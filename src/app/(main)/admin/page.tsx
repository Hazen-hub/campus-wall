"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";
import { formatDate } from "@/lib/utils";
import type { PostWithAuthor } from "@/types";

interface FeedbackItem {
  id: string;
  content: string;
  contact: string | null;
  status: string;
  reply: string | null;
  createdAt: string;
  user: { id: string; username: string; email: string } | null;
}

interface ReportItem {
  id: string;
  postId: string;
  reason: string;
  status: string;
  createdAt: string;
  user: { id: string; username: string } | null;
  post: { id: string; content: string; isHidden: boolean; category: string } | null;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"posts" | "feedback" | "reports" | "words" | "users">("posts");
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [filter, setFilter] = useState<"all" | "hidden" | "deleted">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 意见箱
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [fbFilter, setFbFilter] = useState<"all" | "pending" | "resolved">("all");
  const [pendingCount, setPendingCount] = useState(0);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  // 举报管理
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportFilter, setReportFilter] = useState<"all" | "pending">("all");
  const [reportPendingCount, setReportPendingCount] = useState(0);

  // 敏感词管理
  const [words, setWords] = useState<any[]>([]);
  const [newWord, setNewWord] = useState("");

  // 用户管理
  const [users, setUsers] = useState<any[]>([]);

  const user = session?.user as any;

  useEffect(() => {
    if (!session) { router.push("/auth/login"); return; }
    if (user?.role !== "admin") { router.push("/"); return; }
    if (tab === "posts") loadPosts();
    else if (tab === "feedback") loadFeedbacks();
    else if (tab === "reports") loadReports();
    else if (tab === "words") loadWords();
    else loadUsers();
  }, [session, user?.role, filter, fbFilter, reportFilter, tab]);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?filter=${filter}&limit=50`);
      const data = await res.json();
      if (data.success) setPosts(data.data);
      else setError(data.error);
    } catch (err) { setError("加载失败"); }
    finally { setLoading(false); }
  }

  async function loadFeedbacks() {
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback?status=${fbFilter}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.data);
        setPendingCount(data.pendingCount);
      } else setError(data.error);
    } catch (err) { setError("加载失败"); }
    finally { setLoading(false); }
  }

  const handleModAction = async (postId: string, action: string) => {
    await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, action }) });
    loadPosts();
  };

  const handleForceDelete = async (postId: string) => {
    if (!confirm("确定要永久删除此帖子？")) return;
    await fetch("/api/admin", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId }) });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleFeedbackAction = async (id: string, action: "resolve" | "pending", reply?: string) => {
    await fetch("/api/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, reply }) });
    loadFeedbacks();
    setReplyText((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  // 举报管理
  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?status=${reportFilter}&limit=50`);
      const data = await res.json();
      if (data.success) { setReports(data.data); setReportPendingCount(data.pendingCount); }
      else setError(data.error);
    } catch (err) { setError("加载失败"); }
    finally { setLoading(false); }
  }

  // 敏感词
  async function loadWords() {
    setLoading(true);
    try {
      const res = await fetch("/api/sensitive-words");
      const data = await res.json();
      if (data.success) setWords(data.data);
    } catch (err) { setError("加载失败"); }
    finally { setLoading(false); }
  }
  const addWord = async () => {
    if (!newWord.trim()) return;
    await fetch("/api/sensitive-words", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ word: newWord.trim() }) });
    setNewWord("");
    loadWords();
  };
  const deleteWord = async (id: string) => {
    await fetch("/api/sensitive-words", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadWords();
  };

  // 用户管理
  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) { setError("加载失败"); }
    finally { setLoading(false); }
  }
  const banUser = async (userId: string, ban: boolean) => {
    await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: ban ? "ban" : "unban" }) });
    loadUsers();
  };

  const handleReportAction = async (reportId: string, action: "dismiss" | "hide") => {
    const msg = action === "hide" ? "确定隐藏该帖子并标记举报已处理？" : "确定驳回此举报？";
    if (!confirm(msg)) return;
    await fetch("/api/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId, action }) });
    loadReports();
  };

  if (!session || user?.role !== "admin") return null;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
        </div>
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {[
            { key: "posts", label: "帖子管理" },
            { key: "reports", label: `举报管理${reportPendingCount > 0 ? ` (${reportPendingCount})` : ""}` },
            { key: "users", label: "用户管理" },
            { key: "words", label: "敏感词" },
            { key: "feedback", label: `意见箱${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === "posts" ? (
        <>
          {/* 帖子管理筛选 */}
          <div className="flex items-center gap-2">
            {(["all", "hidden", "deleted"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === f ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {f === "all" ? "全部帖子" : f === "hidden" ? "已隐藏" : "已删除"}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id}>
                <PostCard post={post} onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))} showModActions />
                <div className="flex justify-end gap-2 mt-2">
                  {filter === "deleted" ? (
                    <button onClick={async () => { await handleModAction(post.id, "restore"); loadPosts(); }}
                      className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                    >🔄 恢复帖子</button>
                  ) : (
                    <button onClick={() => handleForceDelete(post.id)}
                      className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                    >🗑️ 永久删除</button>
                  )}
                </div>
              </div>
            ))}
            {posts.length === 0 && <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"><p className="text-gray-500">没有帖子</p></div>}
          </div>
        </>
      ) : tab === "words" ? (
        <>
          <div className="flex gap-2 mb-4">
            <input value={newWord} onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addWord()}
              placeholder="输入敏感词..."
              className="flex-1 px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm" />
            <button onClick={addWord}
              className="px-4 py-2 bg-primary text-white text-sm rounded-lg">添加</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {words.map((w: any) => (
              <span key={w.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg">
                {w.word}
                <button onClick={() => deleteWord(w.id)} className="ml-1 text-red-400 hover:text-red-600">✕</button>
              </span>
            ))}
            {words.length === 0 && <p className="text-gray-500 text-sm">暂无敏感词</p>}
          </div>
        </>
      ) : tab === "users" ? (
        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{u.username[0]}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm dark:text-gray-200">{u.username}</span>
                    {u.role === "admin" && <span className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded">管理员</span>}
                    {u.banned && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">已封禁</span>}
                  </div>
                  <span className="text-xs text-gray-400">{u.email} · {u.grade || "未设置年级"}{u.className ? `·${u.className}` : ""} · {u._count.posts}帖</span>
                </div>
              </div>
              {u.role !== "admin" && (
                <button onClick={() => banUser(u.id, !u.banned)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium ${u.banned ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                >{u.banned ? "解封" : "封禁"}</button>
              )}
            </div>
          ))}
        </div>
      ) : tab === "reports" ? (
        <>
          {/* 举报管理筛选 */}
          <div className="flex items-center gap-2">
            {[
              { key: "all", label: "全部" },
              { key: "pending", label: `待处理${reportPendingCount > 0 ? ` (${reportPendingCount})` : ""}` },
            ].map((f) => (
              <button key={f.key} onClick={() => setReportFilter(f.key as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${reportFilter === f.key ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"}`}
              >{f.label}</button>
            ))}
          </div>

          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 animate-fade-in ${r.status === "pending" ? "border-l-4 border-l-red-400" : "border-l-4 border-l-gray-300"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${r.status === "pending" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                      {r.status === "pending" ? "待处理" : r.status === "resolved" ? "已隐藏" : "已驳回"}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-1">
                      <button onClick={() => handleReportAction(r.id, "dismiss")}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-lg hover:bg-gray-300"
                      >驳回</button>
                      <button onClick={() => handleReportAction(r.id, "hide")}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600"
                      >确认隐藏</button>
                    </div>
                  )}
                </div>

                {/* 被举报帖子 */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500">被举报帖子：</span>
                    {r.post && (
                      <span className="text-xs text-gray-400">
                        [{r.post.category}] {r.post.isHidden ? "(已隐藏)" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {r.post?.content?.substring(0, 150) || "帖子已删除"}
                  </p>
                </div>

                {/* 举报原因 */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">举报原因：</span>
                  <span className="font-medium text-red-600">{r.reason}</span>
                  {r.user && (
                    <span className="text-gray-400 text-xs ml-auto">举报人：{r.user.username}</span>
                  )}
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-500">暂无举报</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* 意见箱筛选 */}
          <div className="flex items-center gap-2">
            {[
              { key: "all", label: "全部" },
              { key: "pending", label: `待处理${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
              { key: "resolved", label: "已解决" },
            ].map((f) => (
              <button key={f.key} onClick={() => setFbFilter(f.key as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${fbFilter === f.key ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"}`}
              >{f.label}</button>
            ))}
          </div>

          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <div key={fb.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 animate-fade-in ${fb.status === "pending" ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-green-400"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${fb.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {fb.status === "pending" ? "待处理" : "已解决"}
                    </span>
                    {fb.user ? (
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{fb.user.username}</span>
                    ) : (
                      <span className="text-sm text-gray-400">游客</span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(fb.createdAt)}</span>
                  </div>
                  <div className="flex gap-1">
                    {fb.status === "pending" ? (
                      <button onClick={() => handleFeedbackAction(fb.id, "resolve", replyText[fb.id])}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                      >标记解决</button>
                    ) : (
                      <button onClick={() => handleFeedbackAction(fb.id, "pending")}
                        className="px-3 py-1 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors"
                      >重新打开</button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">{fb.content}</p>

                {fb.contact && (
                  <p className="text-xs text-gray-400 mb-2">📞 联系方式：{fb.contact}</p>
                )}

                {fb.reply && (
                  <div className="bg-blue-50 dark:bg-gray-900 border border-blue-200 dark:border-blue-900 rounded-lg px-3 py-2 mt-2">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">📝 管理员回复：</p>
                    <p className="text-sm text-blue-800 dark:text-blue-300 mt-0.5">{fb.reply}</p>
                  </div>
                )}

                {!fb.reply && fb.status === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={replyText[fb.id] || ""}
                      onChange={(e) => setReplyText((prev) => ({ ...prev, [fb.id]: e.target.value }))}
                      placeholder="输入回复内容（可选）"
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
            ))}
            {feedbacks.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-500">暂无意见反馈</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
