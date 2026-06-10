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
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0F0F23] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-600/25 group-hover:shadow-xl group-active:scale-95 transition-all select-none">
              番
            </div>
            <h1 className="text-2xl font-extrabold text-[#171717] dark:text-[#EDE8F0] tracking-tight">
              番禺校园墙
            </h1>
          </Link>
          <p className="text-[#737373] dark:text-[#6B6380] mt-1.5 text-sm">
            登录你的账号
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#1A1A35] rounded-2xl shadow-sm border border-[#E5E5E5] dark:border-[#2A2A48] p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-50 dark:bg-[#2D1520] text-[#EF4444] text-sm font-medium px-4 py-2.5 rounded-xl border border-red-100 dark:border-red-500/10">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-[#171717] dark:text-[#EDE8F0] mb-1.5"
            >
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 border border-[#E5E5E5] dark:border-[#2A2A48] rounded-xl text-sm bg-[#FAFAFA] dark:bg-[#222244] text-[#171717] dark:text-[#EDE8F0] placeholder-[#A3A3A3] dark:placeholder-[#6B6380] outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-[#171717] dark:text-[#EDE8F0] mb-1.5"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              required
              className="w-full px-4 py-3 border border-[#E5E5E5] dark:border-[#2A2A48] rounded-xl text-sm bg-[#FAFAFA] dark:bg-[#222244] text-[#171717] dark:text-[#EDE8F0] placeholder-[#A3A3A3] dark:placeholder-[#6B6380] outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-600/20"
          >
            {loading ? "登录中..." : "登录"}
          </button>

          {/* Forgot password */}
          <p className="text-right">
            <Link
              href="/auth/reset-password"
              className="text-xs text-[#737373] dark:text-[#6B6380] hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
            >
              忘记密码？
            </Link>
          </p>
        </form>

        {/* Divider + QQ Login */}
        <div className="mt-5 text-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#E5E5E5] dark:bg-[#2A2A48]" />
            <span className="text-xs text-[#A3A3A3] dark:text-[#6B6380] font-medium">
              其他方式
            </span>
            <div className="flex-1 h-px bg-[#E5E5E5] dark:bg-[#2A2A48]" />
          </div>
          <button
            type="button"
            onClick={() => signIn("qq", { callbackUrl: "/" })}
            className="w-full py-3 bg-[#12B7F5] text-white font-semibold rounded-xl hover:bg-[#0D9FD9] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#12B7F5]/20"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-2.73 1.483 0 0 6.715-.12 8.788-4.48 1.022 2.095 3.118 4.48 8.787 4.48 0 0-.958-.988-2.73-1.483 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.746 2.072.111 0 .283-.36.283-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z" />
            </svg>
            QQ 登录
          </button>
        </div>

        {/* Register link */}
        <p className="text-center mt-5 text-sm text-[#737373] dark:text-[#6B6380] font-medium">
          还没有账号？
          <Link
            href="/auth/register"
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline ml-1"
          >
            立即注册
          </Link>
        </p>

        {/* Guest browsing */}
        <div className="text-center mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 border border-[#E5E5E5] dark:border-[#2A2A48] text-[#737373] dark:text-[#6B6380] font-medium rounded-xl hover:border-indigo-600 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400 transition-colors text-sm"
          >
            游客浏览
          </Link>
          <p className="text-xs text-[#A3A3A3] dark:text-[#6B6380] mt-2">
            无需登录，仅浏览帖子内容
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center mt-6 text-xs">
          <Link
            href="/"
            className="text-[#A3A3A3] dark:text-[#6B6380] hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
          >
            &larr; 返回首页
          </Link>
        </p>
      </div>
    </div>
  );
}
