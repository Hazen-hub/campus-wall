import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("请输入邮箱和密码");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          throw new Error("邮箱或密码错误");
        }

        if (user.banned) {
          throw new Error("账号已被封禁，请联系管理员");
        }

        // 检查是否被锁定
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
          throw new Error(`账号已被锁定，请 ${minutes} 分钟后重试`);
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          // 记录失败尝试
          const attempts = user.loginAttempts + 1;
          const updateData: any = { loginAttempts: attempts };
          if (attempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 锁定 15 分钟
          }
          await prisma.user.update({ where: { id: user.id }, data: updateData });

          if (attempts >= 5) {
            throw new Error("密码错误次数过多，账号已锁定 15 分钟");
          }
          throw new Error(`邮箱或密码错误（还剩 ${5 - attempts} 次尝试）`);
        }

        // 登录成功，重置尝试次数
        if (user.loginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.mustChangePassword = (user as any).mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
});
