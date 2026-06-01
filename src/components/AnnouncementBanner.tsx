"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Announcement { id: string; content: string; createdAt: string; }

export default function AnnouncementBanner({ category = "all" }: { category?: string }) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [dismissedId, setDismissedId] = useState("");

  useEffect(() => {
    setDismissed(false); setAnnouncement(null);
    const hidden = localStorage.getItem(`announcement-dismissed-${category}`);
    if (hidden) { try { const { id, time } = JSON.parse(hidden); if (Date.now() - time < 86400000) setDismissedId(id); } catch {} }
    const url = category !== "all" ? `/api/announcements?category=${category}` : "/api/announcements";
    fetch(url).then(r => r.json()).then(d => { if (d.success && d.data && d.data.id !== dismissedId) setAnnouncement(d.data); }).catch(() => {});
  }, [category]);

  if (!announcement || (dismissedId && announcement.id === dismissedId)) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg animate-fade-up">
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-dark to-accent opacity-90" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
      <div className="relative px-5 py-4 flex items-start gap-3">
        <span className="text-2xl shrink-0 mt-0.5">📢</span>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/80 bg-white/20 px-2 py-0.5 rounded-full">管理员公告</span>
          <Link href={`/posts/${announcement.id}`} className="block text-white/95 text-sm leading-relaxed hover:text-white transition-colors line-clamp-2 mt-1">{announcement.content}</Link>
          <p className="text-white/60 text-xs mt-1">{new Date(announcement.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <button onClick={() => { setDismissed(true); localStorage.setItem(`announcement-dismissed-${category}`, JSON.stringify({ id: announcement.id, time: Date.now() })); }} className="shrink-0 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm">✕</button>
      </div>
    </div>
  );
}
