"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-primary">
            <span>🎓</span>
            <span>禺山高级中学</span>
          </Link>
          <p className="text-gray-500 mt-2">登录你的账号</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {loading ? "登录中..." : "登录"}
          </button>

          <p className="text-right mt-2">
            <Link href="/auth/reset-password" className="text-xs text-gray-400 hover:text-primary">
              忘记密码？
            </Link>
          </p>
        </form>

        {/* Register link */}
        <p className="text-center mt-6 text-sm text-gray-500">
          还没有账号？
          <Link href="/auth/register" className="text-primary font-medium hover:underline ml-1">
            立即注册
          </Link>
        </p>

        {/* Guest browsing */}
        <div className="text-center mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 border-2 border-gray-200 text-gray-500 font-medium rounded-xl hover:border-primary hover:text-primary transition-colors text-sm"
          >
            👀 游客浏览
          </Link>
          <p className="text-xs text-gray-400 mt-2">无需登录，仅浏览帖子内容</p>
        </div>

        <p className="text-center mt-6 text-xs text-gray-400">
          <Link href="/" className="hover:underline">← 返回首页</Link>
        </p>
      </div>
    </div>
  );
}
