"use client";
import { useState } from "react";

export default function CommunityRules() {
  const [open, setOpen] = useState(false);
  const rules = [
    { emoji: "🤝", title: "文明发言", desc: "禁止人身攻击、辱骂、恶意骚扰。" },
    { emoji: "🚫", title: "禁止违规内容", desc: "禁止色情、暴力、违法信息及不当政治言论。" },
    { emoji: "🔒", title: "保护隐私", desc: "未经同意不得公开他人隐私信息。" },
    { emoji: "📝", title: "内容真实", desc: "失物招领、二手交易信息需真实准确。" },
    { emoji: "💕", title: "表白有度", desc: "不得恶意骚扰、造谣或人身攻击。" },
    { emoji: "⚖️", title: "违规处理", desc: "违反规则将被警告、禁言或封禁账号。" },
  ];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <div className="flex items-center gap-2.5"><span className="text-lg">📜</span><span className="font-bold text-sm text-gray-900 dark:text-gray-100">禺山高级中学校园墙 · 社区规则</span><span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">必读</span></div>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${open?"rotate-180":""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-3 text-sm animate-fade-in"><div className="grid gap-2">{rules.map(r=><div key={r.title} className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30"><span className="text-xl shrink-0">{r.emoji}</span><div><p className="font-semibold text-gray-900 dark:text-gray-100">{r.title}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.desc}</p></div></div>)}</div></div>}
    </div>
  );
}
