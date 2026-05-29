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
        {/* */}

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-primary">
            <span>🎓</span>
            <span>禺山高级中学</span>
          </Link>
          <p className="text-gray-500 mt-2">创建你的账号</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          {/* 用户名 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* 邮箱 + 验证码 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
                    emailError
                      ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                      : email && !emailError
                      ? "border-green-300 focus:border-primary focus:ring-1 focus:ring-primary"
                      : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                  }`}
                />
                {/* 邮箱格式状态图标 */}
                {email && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                    {emailError ? "❌" : "✅"}
                  </span>
                )}
              </div>
            </div>
            {/* 邮箱格式错误提示 */}
            {emailError && (
              <p className="mt-1 text-xs text-red-500">{emailError}</p>
            )}
            {/* 常见邮箱提示 */}
            {email && !emailError && (
              <p className="mt-1 text-xs text-green-600">邮箱格式正确</p>
            )}
          </div>

          {/* 验证码 */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm tracking-[0.3em] text-center font-mono font-bold text-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0 || !email || !!emailError}
                className="px-3 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap min-w-[100px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary-dark"
              >
                {sendingCode ? (
                  <span className="flex items-center gap-1 justify-center">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              <p className="mt-1 text-xs text-gray-400">未收到验证码？请检查垃圾邮件或点击重新发送</p>
            )}
          </div>

          {/* 密码 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* 确认密码 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              required
              className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-1 transition-colors ${
                confirmPassword && password !== confirmPassword
                  ? "border-red-300 focus:border-red-400 focus:ring-red-400"
                  : confirmPassword && password === confirmPassword
                  ? "border-green-300 focus:border-primary focus:ring-primary"
                  : "border-gray-200 focus:border-primary focus:ring-primary"
              }`}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-500">两次输入的密码不一致</p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="mt-1 text-xs text-green-600">密码一致</p>
            )}
          </div>

          {/* 注册按钮 */}
          <button
            type="submit"
            disabled={loading || !code || !email || !!emailError}
            className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                注册中
              </span>
            ) : (
              "注册"
            )}
          </button>

          {/* 注意事项 */}
          <p className="text-xs text-gray-400 text-center">
            注册即表示同意校园墙的使用规则，请文明发言
          </p>
        </form>

        {/* Login link */}
        <p className="text-center mt-6 text-sm text-gray-500">
          已有账号？
          <Link href="/auth/login" className="text-primary font-medium hover:underline ml-1">
            立即登录
          </Link>
        </p>

        <p className="text-center mt-4 text-xs text-gray-400">
          <Link href="/" className="hover:underline">← 返回首页</Link>
        </p>
      </div>
    </div>
  );
}
