"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const sendCode = async () => {
    if (!email) { setError("请输入邮箱"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.success) { setStep("reset"); setCountdown(60); }
      else setError(data.error);
    } catch { setError("网络错误"); }
    finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (!code || !newPassword) { setError("请填写验证码和新密码"); return; }
    if (newPassword.length < 8) { setError("密码至少8个字符"); return; }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) { setError("密码需包含字母和数字"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset-password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code, newPassword }) });
      const data = await res.json();
      if (data.success) setStep("done");
      else setError(data.error);
    } catch { setError("网络错误"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg,#f5f5f7)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-primary"><span>🎓</span></Link>
          <p className="text-gray-500 mt-2">找回密码</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 space-y-4">
          {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

          {step === "email" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">注册邮箱</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                  className="w-full px-3 py-2.5 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm" />
              </div>
              <button onClick={sendCode} disabled={loading}
                className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50">
                {loading ? "发送中..." : "发送验证码"}
              </button>
            </>
          )}

          {step === "reset" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">验证码</label>
                <input type="text" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
                  maxLength={6} placeholder="6位验证码"
                  className="w-full px-3 py-2.5 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm text-center tracking-[0.3em] font-mono text-lg" />
                <p className="text-right mt-1">
                  <button onClick={sendCode} disabled={countdown > 0}
                    className="text-xs text-primary hover:underline disabled:text-gray-400">
                    {countdown > 0 ? `${countdown}秒后重发` : "重新发送"}
                  </button>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">新密码</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少8位，包含字母和数字"
                  className="w-full px-3 py-2.5 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm" />
              </div>
              <button onClick={resetPassword} disabled={loading}
                className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50">
                {loading ? "重置中..." : "重置密码"}
              </button>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-medium dark:text-gray-100">密码已重置</p>
              <Link href="/auth/login" className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg text-sm">去登录</Link>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-xs text-gray-400">
          <Link href="/auth/login" className="hover:underline">← 返回登录</Link>
        </p>
      </div>
    </div>
  );
}
