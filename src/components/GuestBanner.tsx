"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function GuestBanner() {
  const { data: session } = useSession();

  // 已登录用户不显示
  if (session) return null;

  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg shrink-0">👀</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary-dark truncate">游客浏览模式</p>
          <p className="text-xs text-gray-500 hidden sm:block">你可以浏览帖子，但无法发帖、评论和点赞</p>
        </div>
      </div>
      <Link
        href="/auth/login"
        className="shrink-0 px-4 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
      >
        去登录
      </Link>
    </div>
  );
}
