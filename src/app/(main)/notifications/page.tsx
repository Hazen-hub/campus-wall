"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { router.push("/auth/login"); return; }
    async function load() {
      const res = await fetch("/api/notifications?limit=50");
      const data = await res.json();
      if (data.success) setNotifs(data.data);
      setLoading(false);
    }
    load();
    // 标记已读
    fetch("/api/notifications", { method: "PATCH" });
  }, [session, router]);

  const typeIcon: Record<string, string> = {
    like: "❤️", comment: "💬", reply: "↩️", system: "📢",
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold dark:text-gray-100">🔔 消息通知</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-5xl mb-3">🔔</div>
          <p className="text-gray-500 dark:text-gray-400">暂无消息</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <Link key={n.id} href={n.postId ? `/posts/${n.postId}` : "#"}
              className={`block bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 hover:shadow-md transition-shadow ${!n.isRead ? "border-l-4 border-l-primary" : ""}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{typeIcon[n.type] || "📌"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm dark:text-gray-200">{n.message}</p>
                  <span className="text-xs text-gray-400">{formatDate(n.createdAt)}</span>
                </div>
                {!n.isRead && <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
