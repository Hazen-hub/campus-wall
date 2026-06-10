"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  // 实时邮箱格式验证 + 国内邮箱域名识别
  const validateEmail = useCallback((value: string) => {
    if (!value) {
      setEmailError("");
      return true;
    }
    // 基本格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("邮箱格式不正确，请检查是否包含 @ 和域名");
      return false;
    }
    // 常见国内邮箱域名
    const commonDomains = [
      "qq.com", "163.com", "126.com", "yeah.net",
      "sina.com", "sina.cn", "sohu.com", "foxmail.com",
      "gmail.com", "outlook.com", "hotmail.com", "live.com",
      "icloud.com", "aliyun.com",
    ];
    const domain = value.split("@")[1]?.toLowerCase();
    if (domain && !commonDomains.includes(domain)) {
      // 非常见域名也允许，但不给绿色通过提示
      setEmailError("");
    } else {
      setEmailError("");
    }
    return true;
  }, []);

  useEffect(() => {
    if (email) {
      validateEmail(email);
    } else {
      setEmailError("");
    }
  }, [email, validateEmail]);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    setError("");

    if (!email) {
      setError("请先输入邮箱地址");
      return;
    }

    if (!validateEmail(email)) {
      setError("邮箱格式不正确");
      return;
    }

    setSendingCode(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setCodeSent(true);
        setCountdown(60);

        // 验证码已发送到邮箱，不在页面上显示
      } else {
        setError(data.error || "发送验证码失败");
        if (data.cooldown) {
          setCountdown(data.cooldown);
          setCodeSent(true);
        }
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setSendingCode(false);
    }
  };

  // 注册
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 验证邮箱格式
    if (!validateEmail(email)) {
      setError("邮箱格式不正确");
      return;
    }

    // 验证验证码
    if (!code || code.length !== 6) {
      setError("请输入6位验证码");
      return;
    }

    // 验证密码
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, code }),
      });
      const data = await res.json();

      if (data.success) {
        // 注册成功后自动登录
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          router.push("/auth/login");
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        setError(data.error || "注册失败");
      }
    } catch (err) {
      setError("注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // Input style helper based on validation state
  const inputClass = (hasError: boolean, hasSuccess: boolean) =>
    `w-full px-4 py-3 border rounded-xl text-sm bg-[#FAFAFA] dark:bg-[#222244] text-[#171717] dark:text-[#EDE8F0] placeholder-[#A3A3A3] dark:placeholder-[#6B6380] outline-none transition-colors ${
      hasError
        ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]"
        : hasSuccess
        ? "border-[#22C55E] focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
        : "border-[#E5E5E5] dark:border-[#2A2A48] focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0F0F23] px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex flex-col items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-600/25 group-hover:shadow-xl group-active:scale-95 transition-all select-none">
              番
            </div>
            <h1 className="text-2xl font-extrabold text-[#171717] dark:text-[#EDE8F0] tracking-tight">
              番禺校园墙
            </h1>
          </Link>
          <p className="text-[#737373] dark:text-[#6B6380] mt-1.5 text-sm">
            创建你的账号
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

          {/* 用户名 */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-[#171717] dark:text-[#EDE8F0] mb-1.5"
            >
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="你的昵称（2-20个字符）"
              required
              minLength={2}
              maxLength={20}
              className={inputClass(false, !!username)}
            />
          </div>

          {/* 邮箱 + 验证图标 */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-[#171717] dark:text-[#EDE8F0] mb-1.5"
            >
              邮箱
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className={`${inputClass(!!emailError, !!email && !emailError)} pr-10`}
              />
              {/* 邮箱格式状态图标 */}
              {email && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                  {emailError ? (
                    <svg className="w-5 h-5 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              )}
            </div>
            {/* 邮箱格式错误提示 */}
            {emailError && (
              <p className="mt-1 text-xs text-[#EF4444] font-medium">{emailError}</p>
            )}
            {/* 常见邮箱提示 */}
            {email && !emailError && (
              <p className="mt-1 text-xs text-[#22C55E] font-medium">邮箱格式正确</p>
            )}
          </div>

          {/* 验证码 */}
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-semibold text-[#171717] dark:text-[#EDE8F0] mb-1.5"
            >
              验证码
            </label>
            <div className="flex gap-2">
              <input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => {
                  // 只允许输入数字，最多6位
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(val);
                }}
                placeholder="输入6位验证码"
                required
                maxLength={6}
                className="flex-1 px-4 py-3 border border-[#E5E5E5] dark:border-[#2A2A48] rounded-xl text-center tracking-[0.3em] font-mono font-bold text-lg bg-[#FAFAFA] dark:bg-[#222244] text-[#171717] dark:text-[#EDE8F0] placeholder-[#A3A3A3] dark:placeholder-[#6B6380] outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0 || !email || !!emailError}
                className="px-4 py-3 text-sm font-semibold rounded-xl whitespace-nowrap min-w-[110px] transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm shadow-indigo-600/20 hover:from-indigo-700 hover:to-indigo-600 active:scale-95"
              >
                {sendingCode ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    发送中
                  </span>
                ) : countdown > 0 ? (
                  `${countdown}s`
                ) : codeSent ? (
                  "重新发送"
                ) : (
                  "获取验证码"
                )}
              </button>
            </div>
            {codeSent && countdown === 0 && (
              <p className="mt-1.5 text-xs text-[#A3A3A3] dark:text-[#6B6380]">
                未收到验证码？请检查垃圾邮件或点击重新发送
              </p>
            )}
          </div>

          {/* 密码 */}
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
              placeholder="至少6个字符"
              required
              minLength={6}
              className={inputClass(false, password.length >= 6)}
            />
          </div>

          {/* 确认密码 */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-[#171717] dark:text-[#EDE8F0] mb-1.5"
            >
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              required
              className={`${inputClass(
                !!confirmPassword && password !== confirmPassword,
                !!confirmPassword && password === confirmPassword
              )} pr-10`}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-[#EF4444] font-medium">
                两次输入的密码不一致
              </p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="mt-1 text-xs text-[#22C55E] font-medium">
                密码一致
              </p>
            )}
          </div>

          {/* 注册按钮 */}
          <button
            type="submit"
            disabled={loading || !code || !email || !!emailError}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-600/20"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                注册中
              </span>
            ) : (
              "注册"
            )}
          </button>

          {/* 注意事项 */}
          <p className="text-xs text-[#A3A3A3] dark:text-[#6B6380] text-center">
            注册即表示同意校园墙的使用规则，请文明发言
          </p>
        </form>

        {/* Login link */}
        <p className="text-center mt-5 text-sm text-[#737373] dark:text-[#6B6380] font-medium">
          已有账号？
          <Link
            href="/auth/login"
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline ml-1"
          >
            立即登录
          </Link>
        </p>

        {/* Back to home */}
        <p className="text-center mt-4 text-xs">
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
