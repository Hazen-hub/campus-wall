"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";
import type { PostWithAuthor } from "@/types";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", bio: "", grade: "", className: "", website: "", location: "" });
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"posts" | "likes">("posts");

  useEffect(() => {
    if (!session) { router.push("/auth/login"); return; }
    async function load() {
      const userId = (session?.user as any)?.id;
      if (!userId) return;
      const resPosts = await fetch("/api/posts?limit=50");
      const postsData = await resPosts.json();
      if (postsData.success) setPosts(postsData.data.filter((p: PostWithAuthor) => p.authorId === userId));
      setLoading(false);
    }
    load();
  }, [session, router]);

  const startEdit = () => {
    setForm({
      username: user?.name || "", bio: user?.bio || "", grade: user?.grade || "",
      className: user?.className || "", website: user?.website || "", location: user?.location || "",
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    const res = await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) { setEditing(false); alert("保存成功！重新登录刷新"); }
    else alert(data.error);
    setSaving(false);
  };

  const uploadFile = async (file: File, type: "avatar" | "banner") => {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch(`/api/user/${type === "banner" ? "banner-upload" : "avatar"}`, { method: "POST", body: fd });
    const data = await res.json();
    if (data.success) window.location.reload();
    else alert(data.error || "上传失败");
  };

  if (!session) return null;
  const grades = ["高一", "高二", "高三", "教师", "其他"];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Banner + Avatar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 overflow-hidden">
        {/* Banner */}
        <div className="relative h-32 sm:h-44 bg-gradient-to-r from-primary to-primary-light cursor-pointer group" onClick={() => bannerInputRef.current?.click()}>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "banner")} />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <span className="text-white text-sm">点击更换封面</span>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex justify-between items-start -mt-10 sm:-mt-12">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-gray-800 bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold overflow-hidden">
                {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs">换头像</span>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "avatar")} />
            </div>

            {/* Edit / Follow button */}
            <div className="mt-2">
              <button onClick={startEdit} className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                编辑资料
              </button>
            </div>
          </div>

          {/* User info */}
          <div className="mt-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user?.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.name?.toLowerCase()}</p>
            {user?.bio && <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{user.bio}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
              {user?.grade && <span>🎓 {user.grade}{user.className && `·${user.className}`}</span>}
              {user?.location && <span>📍 {user.location}</span>}
              {user?.website && <span>🔗 <a href={user.website} target="_blank" className="text-primary hover:underline">{user.website}</a></span>}
              <span>📅 {new Date(user?.createdAt).toLocaleDateString("zh-CN")} 加入</span>
            </div>
          </div>

          {/* 编辑按钮 */}
          <button onClick={startEdit} className="mt-3 w-full py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            ✏️ 编辑个人资料
          </button>

        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 space-y-3">
          <h3 className="font-bold dark:text-gray-100">编辑资料</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 dark:text-gray-400">用户名</label><input value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm" /></div>
            <div><label className="text-xs text-gray-500 dark:text-gray-400">年级</label><select value={form.grade} onChange={(e) => setForm({...form, grade: e.target.value})} className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm">{["","高一","高二","高三","教师","其他"].map(g=><option key={g} value={g}>{g||"未设置"}</option>)}</select></div>
            <div><label className="text-xs text-gray-500 dark:text-gray-400">班级</label><input value={form.className} onChange={(e) => setForm({...form, className: e.target.value})} placeholder="如：3班" className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm" /></div>
            <div><label className="text-xs text-gray-500 dark:text-gray-400">位置</label><input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="如：广州" className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm" /></div>
          </div>
          <div><label className="text-xs text-gray-500 dark:text-gray-400">个人网站</label><input value={form.website} onChange={(e) => setForm({...form, website: e.target.value})} placeholder="https://..." className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm" /></div>
          <div><label className="text-xs text-gray-500 dark:text-gray-400">简介</label><textarea value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} rows={2} maxLength={200} className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm" /></div>
          <div className="flex gap-2">
            <button onClick={saveProfile} disabled={saving} className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium">{saving?"保存中":"保存"}</button>
            <button onClick={() => setEditing(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-full text-sm">取消</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(["posts","likes"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>
            {t === "posts" ? "帖子" : "喜欢"}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12"><div className="text-4xl mb-3">📝</div><p className="text-gray-500">还没有发布过帖子</p></div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (<PostCard key={post.id} post={post} onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))} />))}
        </div>
      )}
    </div>
  );
}
