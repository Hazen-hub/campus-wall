"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function FeedbackPage() {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("请输入意见内容");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          contact: contact.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        setContent("");
        setContact("");
      } else {
        setError(data.error || "提交失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="text-6xl mb-4">📬</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">感谢你的反馈！</h1>
        <p className="text-gray-500 mb-6">
          我们已经收到你的意见，会认真阅读并尽快处理。
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setSubmitted(false)}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            继续提交
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📬 意见箱</h1>
        <p className="text-sm text-gray-500 mt-1">
          欢迎提出宝贵意见、建议或问题反馈，我们会认真对待每一条留言
        </p>
      </div>

      {/* 提交表单 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>
        )}

        {/* 意见内容 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            意见内容 <span className="text-red-400">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请详细描述你的意见、建议或遇到的问题..."
            rows={6}
            maxLength={2000}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
          <p className="mt-1 text-xs text-gray-400 text-right">{content.length}/2000</p>
        </div>

        {/* 联系方式（可选） */}
        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
            联系方式 <span className="text-gray-400 font-normal">（选填）</span>
          </label>
          <input
            id="contact"
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="QQ号 / 微信号 / 邮箱，方便我们联系你回复"
            maxLength={100}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* 提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-700">
            💡 提示：如要举报违规帖子，请直接联系管理员或使用管理后台的举报功能。
            {session ? "" : " 登录后提交的意见可以方便我们联系你回复。"}
          </p>
        </div>

        {/* 登录提示 */}
        {!session && (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
            <span>🔒</span>
            <span>当前为游客模式，</span>
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              登录
            </Link>
            <span>后意见会关联到你的账号</span>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <span className="flex items-center gap-2 justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              提交中...
            </span>
          ) : (
            "提交意见"
          )}
        </button>
      </form>

      {/* 反馈类型说明 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: "💡", title: "功能建议", desc: "希望新增的功能" },
          { icon: "🐛", title: "Bug 反馈", desc: "遇到的问题和错误" },
          { icon: "📢", title: "其他意见", desc: "任何想说的话" },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <h3 className="text-sm font-medium text-gray-800">{item.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
