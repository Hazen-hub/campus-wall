"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";
import type { PostWithAuthor } from "@/types";

export default function BookmarksPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { router.push("/auth/login"); return; }
    async function load() {
      const res = await fetch("/api/bookmarks?limit=50");
      const data = await res.json();
      if (data.success) setPosts(data.data);
      setLoading(false);
    }
    load();
  }, [session, router]);

  if (!session) return null;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold dark:text-gray-100">⭐ 我的收藏</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-5xl mb-3">⭐</div>
          <p className="text-gray-500 dark:text-gray-400">还没有收藏任何帖子</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={() => setPosts((prev) => prev.filter((p) => p.id !== post.id))} />
          ))}
        </div>
      )}
    </div>
  );
}
