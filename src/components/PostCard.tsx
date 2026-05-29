"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import type { PostWithAuthor } from "@/types";

interface PostCardProps {
  post: PostWithAuthor;
  onDelete?: (id: string) => void;
  showModActions?: boolean;
}

export default function PostCard({ post, onDelete, showModActions }: PostCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post._count.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;
  const isOwner = userId === post.authorId;
  const canDelete = isOwner || userRole === "admin";

  const categoryLabels: Record<string, { label: string; color: string }> = {
    general: { label: "日常", color: "bg-blue-100 text-blue-700" },
    love: { label: "表白墙", color: "bg-pink-100 text-pink-700" },
    lostfound: { label: "失物招领", color: "bg-amber-100 text-amber-700" },
    trade: { label: "二手交易", color: "bg-green-100 text-green-700" },
    joke: { label: "吐槽", color: "bg-purple-100 text-purple-700" },
    ask: { label: "求助", color: "bg-orange-100 text-orange-700" },
  };
  const cat = categoryLabels[(post as any).category] || categoryLabels.general;

  const reportReasons = ["色情低俗", "暴力血腥", "虚假信息", "人身攻击", "垃圾广告", "其他"];

  const images = Array.isArray(post.images)
    ? post.images
    : typeof post.images === "string"
    ? (() => { try { return JSON.parse(post.images); } catch { return []; } })()
    : [];

  const handleLike = async () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (res.ok) {
        const { data } = await res.json();
        if (data.liked) {
          setShowHeartAnim(true);
          setTimeout(() => setShowHeartAnim(false), 400);
        }
        setIsLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete?.(post.id);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const getGridCols = (count: number) => {
    if (count === 1) return "cols-1";
    if (count === 2 || count === 4) return "cols-2";
    return "cols-3";
  };

  return (
    <div className={`rounded-xl shadow-sm border p-4 animate-fade-in ${
      (post as any).type === "announcement" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" :
      post.isPinned ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" :
      "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    }`}>
      {/* Post header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${(post as any).isAnonymous ? "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400" : "bg-primary/10 text-primary"}`}>
          {(post as any).isAnonymous ? "?" : post.author.username[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
              {(post as any).isAnonymous ? "匿名用户" : post.author.username}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cat.color}`}>{cat.label}</span>
            {(post as any).type === "announcement" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700">📢 公告</span>
            )}
            {(post as any).type === "poll" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-green-100 text-green-700">📊 投票</span>
            )}
            {post.isPinned && (
              <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">置顶</span>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(post.createdAt)}</span>
        </div>

        {/* Delete button */}
        {canDelete && (
          <div className="relative">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            {showDeleteConfirm && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10 w-40 animate-fade-in">
                <p className="text-sm text-gray-700 mb-2">确认删除？</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { handleDelete(); setShowDeleteConfirm(false); }}
                    className="flex-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    删除
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin mod actions */}
        {showModActions && userRole === "admin" && (
          <div className="flex gap-1">
            <button
              onClick={async () => {
                await fetch("/api/admin", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ postId: post.id, action: post.isPinned ? "unpin" : "pin" }),
                });
                router.refresh();
              }}
              className={`px-2 py-1 text-xs rounded ${
                post.isPinned ? "bg-accent text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {post.isPinned ? "取消置顶" : "置顶"}
            </button>
            <button
              onClick={async () => {
                await fetch("/api/admin", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ postId: post.id, action: post.isHidden ? "unhide" : "hide" }),
                });
                router.refresh();
              }}
              className={`px-2 py-1 text-xs rounded ${
                post.isHidden ? "bg-success text-white" : "bg-danger text-white"
              }`}
            >
              {post.isHidden ? "显示" : "隐藏"}
            </button>
          </div>
        )}
      </div>

      {/* Post content */}
      <Link href={`/posts/${post.id}`} className="block">
        <div className="post-content text-gray-800 dark:text-gray-200 mb-3 text-sm leading-relaxed">
          {post.content.length > 300 ? post.content.slice(0, 300) + "..." : post.content}
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div className={`image-grid ${getGridCols(images.length)} mb-3`}>
            {images.slice(0, 9).map((url: string, i: number) => (
              <div key={i} className="relative overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={url}
                  alt={`图片 ${i + 1}`}
                  className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ maxHeight: i === 0 && images.length === 1 ? "400px" : "200px" }}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowImageModal(url);
                  }}
                  loading="lazy"
                />
                {i === 8 && images.length > 9 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                    +{images.length - 9}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Link>

      {/* Poll */}
      {(post as any).type === "poll" && (post as any).pollOptions && (() => {
        const options = JSON.parse((post as any).pollOptions);
        const votes = (post as any).pollVotes ? JSON.parse((post as any).pollVotes) : {};
        const totalVotes = Object.values(votes).reduce((sum: number, arr: any) => sum + (arr as any[]).length, 0);
        const hasVoted = userId && Object.values(votes).some((arr: any) => (arr as string[]).includes(userId));
        return (
          <div className="mb-3 space-y-1.5">
            {options.map((opt: string) => {
              const count = (votes[opt] || []).length;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const voted = userId && (votes[opt] || []).includes(userId);
              return (
                <button key={opt} onClick={async () => {
                  if (!session) { router.push("/auth/login"); return; }
                  if (hasVoted) return;
                  const res = await fetch(`/api/polls/${post.id}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ option: opt }) });
                  const data = await res.json();
                  if (data.success) router.refresh();
                }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${voted ? "bg-primary/10 border-primary" : hasVoted ? "bg-gray-50 border-gray-200 cursor-default" : "bg-gray-50 border-gray-200 hover:border-primary hover:bg-primary/5 cursor-pointer"}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{opt}</span>
                    {hasVoted && <span className="text-xs text-gray-500">{pct}%</span>}
                  </div>
                  {hasVoted && (
                    <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </button>
              );
            })}
            <p className="text-xs text-gray-400 text-right">{totalVotes} 人参与投票</p>
          </div>
        );
      })()}

      {/* Post actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
        {/* Like button */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
            isLiked
              ? "text-red-500 bg-red-50"
              : "text-gray-500 hover:text-red-500 hover:bg-red-50"
          }`}
        >
          <span className={`text-lg ${showHeartAnim ? "animate-heart" : ""}`}>
            {isLiked ? "❤️" : "🤍"}
          </span>
          <span className="font-medium">{likesCount}</span>
        </button>

        {/* Comment button */}
        <Link
          href={`/posts/${post.id}#comments`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <span className="text-lg">💬</span>
          <span className="font-medium">{post._count.comments}</span>
        </Link>

        {/* Bookmark */}
        <button
          onClick={async () => {
            if (!session) { router.push("/auth/login"); return; }
            const res = await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST" });
            const data = await res.json();
            if (data.success) setIsBookmarked(data.data.bookmarked);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${isBookmarked ? "text-amber-500 bg-amber-50" : "text-gray-500 hover:text-amber-500 hover:bg-amber-50"}`}
        ><span className="text-lg">{isBookmarked ? "⭐" : "☆"}</span></button>

        {/* Share */}
        <div className="relative">
          <button onClick={() => { setShowShare(!showShare); navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }).catch(() => {}); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
          ><span className="text-lg">{shareCopied ? "✅" : "📤"}</span></button>
        </div>

        {/* View count */}
        <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
          👁️ {(post as any).viewCount || 0}
        </span>

        {/* Edit (own post) */}
        {isOwner && (
          <Link href={`/posts/${post.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-primary transition-colors"
            title="编辑帖子"
          ><span className="text-base">✏️</span></Link>
        )}

        {/* Report */}
        <button onClick={() => setShowReport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-red-500 transition-colors"
        ><span className="text-base">🚩</span></button>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowReport(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-2xl rounded-b-none shadow-xl p-6 w-full max-w-sm sm:max-w-sm mx-auto mt-auto sm:mt-24 sm:mx-auto fixed bottom-0 sm:relative sm:bottom-auto z-10" onClick={(e) => e.stopPropagation()}>
            {reportSubmitted ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-medium dark:text-gray-100">举报已提交</p>
                <p className="text-sm text-gray-500 mt-1">管理员会尽快处理</p>
                <button onClick={() => { setShowReport(false); setReportSubmitted(false); }} className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">关闭</button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-1 dark:text-gray-100">举报帖子</h3>
                <p className="text-sm text-gray-500 mb-4">请选择举报原因</p>
                <div className="space-y-2 mb-4">
                  {reportReasons.map((r) => (
                    <button key={r} onClick={() => setReportReason(r)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${reportReason === r ? "bg-primary/10 text-primary font-medium" : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"}`}
                    >{r}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowReport(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">取消</button>
                  <button onClick={async () => {
                    if (!reportReason) return;
                    await fetch(`/api/posts/${post.id}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: reportReason }) });
                    setReportSubmitted(true);
                  }} disabled={!reportReason}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >提交举报</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
          onClick={() => setShowImageModal(null)}
        >
          <img
            src={showImageModal}
            alt="大图"
            className="max-w-full max-h-[95vh] sm:max-h-[90vh] rounded-lg object-contain"
          />
          <button
            onClick={() => setShowImageModal(null)}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-lg sm:text-xl transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
