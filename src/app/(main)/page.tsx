"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import PostCard from "@/components/PostCard";
import PostForm from "@/components/PostForm";
import GuestBanner from "@/components/GuestBanner";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import CommunityRules from "@/components/CommunityRules";
import OnlineCount from "@/components/OnlineCount";
import ChildrensDay from "@/components/ChildrensDay";
import CategoryTabs from "@/components/CategoryTabs";
import type { PostWithAuthor } from "@/types";

export default function HomePage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [category, setCategory] = useState("all");
  const observerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const pullRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (pageNum: number, reset = false) => {
    try {
      if (reset) setRefreshing(true);
      else setLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", "20");
      params.set("sort", sort);
      if (category && category !== "all") params.set("category", category);
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();

      if (data.success) {
        if (reset) {
          setPosts(data.data);
        } else {
          setPosts((prev) => [...prev, ...data.data]);
        }
        setHasMore(data.pagination.page < data.pagination.totalPages);
      } else {
        setError(data.error || "加载失败");
      }
    } catch (err) {
      setError("加载失败，请检查网络");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sort, category]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, true);
  }, [fetchPosts]);

  // Pull-to-refresh (移动端下拉刷新)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const diff = e.changedTouches[0].clientY - touchStartY.current;
      // 如果下拉超过 80px 且页面在顶部，触发刷新
      if (diff > 80 && window.scrollY === 0 && !refreshing && !loading) {
        setPage(1);
        fetchPosts(1, true);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [refreshing, loading, fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          setPage((prev) => {
            const next = prev + 1;
            fetchPosts(next);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loading, fetchPosts]);

  const handlePostCreated = (newPost: PostWithAuthor) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* 下拉刷新指示器 */}
      <div ref={pullRef} className={`pull-indicator ${refreshing ? "active" : ""}`}>
        {refreshing && <div className="pull-spinner" />}
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">禺山高级中学</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            欢迎{ session ? `回来，${(session.user as any)?.name}` : "来到禺山高级中学" }
          </p>
        </div>

        {/* Sort toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setSort("latest")}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[40px] touch-target ${
              sort === "latest"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            最新
          </button>
          <button
            onClick={() => setSort("popular")}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[40px] touch-target ${
              sort === "popular"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            最热
          </button>
        </div>
      </div>

      {/* Announcement */}
      <AnnouncementBanner category={category} />
      <CommunityRules />
      <ChildrensDay />
      <OnlineCount />

      {/* Category tabs */}
      <CategoryTabs active={category} onChange={(key) => { setCategory(key); setPage(1); fetchPosts(1, true); }} />

      {/* Guest banner */}
      <GuestBanner />

      {/* Post form */}
      <PostForm onPostCreated={handlePostCreated} />

      {/* Posts feed */}
      <div className="space-y-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={handlePostDeleted}
          />
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && !refreshing && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full skeleton" />
                <div className="space-y-1.5">
                  <div className="w-20 h-3 skeleton" />
                  <div className="w-12 h-2.5 skeleton" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-3 skeleton" />
                <div className="w-3/4 h-3 skeleton" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">还没有帖子</h3>
          <p className="text-gray-500">成为第一个发帖的人吧！</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-3">{error}</p>
          <button
            onClick={() => { setPage(1); fetchPosts(1, true); }}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark min-h-[44px] touch-target"
          >
            重试
          </button>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-400">- 已经到底了 -</p>
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={observerRef} className="h-4" />
    </div>
  );
}
