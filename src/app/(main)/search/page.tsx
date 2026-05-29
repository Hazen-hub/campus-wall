"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PostCard from "@/components/PostCard";
import type { PostWithAuthor } from "@/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const observerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string, pageNum: number, reset = false) => {
    if (!q.trim()) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${pageNum}&limit=20`);
      const data = await res.json();
      if (data.success) {
        if (reset) {
          setPosts(data.data);
        } else {
          setPosts((prev) => [...prev, ...data.data]);
        }
        setHasMore(data.pagination.page < data.pagination.totalPages);
      } else {
        setError(data.error || "搜索失败");
      }
    } catch (err) {
      setError("搜索失败，请检查网络");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearched(true);
    search(query, 1, true);
  };

  // Infinite scroll for search results
  useEffect(() => {
    if (!searched) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => {
            const next = prev + 1;
            search(query, next);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );
    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loading, search, query, searched]);

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">搜索帖子</h1>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入关键词搜索..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {loading ? "搜索中..." : "搜索"}
        </button>
      </form>

      {/* Results */}
      {searched && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {loading ? "搜索中..." : `找到 ${posts.length} 个与 "${query}" 相关的帖子`}
          </p>

          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onDelete={handleDelete} />
            ))}
          </div>

          {!loading && posts.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-gray-500">没有找到相关帖子</p>
              <p className="text-sm text-gray-400 mt-1">试试其他关键词</p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-6">
              <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-6">
              <p className="text-red-500 mb-2">{error}</p>
              <button
                onClick={() => { setPage(1); search(query, 1, true); }}
                className="text-primary hover:underline text-sm"
              >
                重试
              </button>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p className="text-center text-sm text-gray-400 py-4">- 没有更多结果 -</p>
          )}
        </div>
      )}

      {!searched && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔎</div>
          <p className="text-gray-500">搜索你感兴趣的内容</p>
        </div>
      )}

      <div ref={observerRef} className="h-4" />
    </div>
  );
}
