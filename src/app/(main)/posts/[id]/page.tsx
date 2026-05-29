"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import { formatDate } from "@/lib/utils";
import type { PostWithAuthor, CommentWithAuthor } from "@/types";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    async function load() {
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`/api/posts/${id}`),
          fetch(`/api/posts/${id}/comments`),
        ]);
        const postData = await postRes.json();
        const commentsData = await commentsRes.json();

        if (postData.success) {
          setPost(postData.data);
        } else {
          setError(postData.error || "帖子不存在");
        }
        if (commentsData.success) {
          setComments(commentsData.data);
        }
      } catch (err) {
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentText.trim(),
          parentId: replyTo?.id || null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        if (replyTo) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyTo.id
                ? { ...c, replies: [...c.replies, data.data] }
                : c
            )
          );
        } else {
          setComments((prev) => [data.data, ...prev]);
        }
        setCommentText("");
        setReplyTo(null);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("评论失败");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">😢</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">{error || "帖子不存在"}</h3>
        <Link href="/" className="text-primary hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span>←</span>
        <span>返回</span>
      </button>

      {/* Post */}
      <PostCard post={post} onDelete={() => router.push("/")} />

      {/* Edit post */}
      {userId === post.authorId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
          {editingPost ? (
            <div className="space-y-3">
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[100px] p-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm resize-none" maxLength={5000} />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingPost(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-sm rounded-lg">取消</button>
                <button onClick={async () => {
                  if (!editContent.trim()) return;
                  setSavingEdit(true);
                  const res = await fetch(`/api/posts/${post.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: editContent.trim() }) });
                  const data = await res.json();
                  if (data.success) { setPost({ ...post, content: editContent.trim(), editedAt: new Date().toISOString() } as any); setEditingPost(false); }
                  setSavingEdit(false);
                }} disabled={savingEdit}
                  className="px-4 py-2 bg-primary text-white text-sm rounded-lg">{savingEdit ? "保存中..." : "保存修改"}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setEditContent(post.content); setEditingPost(true); }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
            ><span>✏️</span> 编辑帖子 {post.editedAt && <span className="text-xs text-gray-400">(已编辑)</span>}</button>
          )}
        </div>
      )}

      {/* Share */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 flex items-center gap-3">
        <span className="text-sm text-gray-500">📤 分享此帖：</span>
        <button onClick={() => { navigator.clipboard.writeText(window.location.href); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }}
          className="px-4 py-2 bg-primary text-white text-sm rounded-lg">{shareCopied ? "✅ 已复制" : "复制链接"}</button>
      </div>

      {/* Comments section */}
      <div id="comments" className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          评论 ({comments.reduce((sum, c) => sum + 1 + c.replies.length, 0)})
        </h2>

        {/* Comment form */}
        <form onSubmit={handleSubmitComment} className="mb-6">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
              <span>回复 @{replyTo.username}</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={session ? "写下你的评论..." : "登录后发表评论"}
              disabled={!session}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submittingComment ? "..." : "发送"}
            </button>
          </div>
        </form>

        {/* Comments list */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(c) => setReplyTo({ id: c.id, username: c.author.username })}
            />
          ))}
          {comments.length === 0 && (
            <p className="text-center text-gray-400 py-4 text-sm">暂无评论，来说点什么吧</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
}: {
  comment: CommentWithAuthor;
  onReply: (comment: CommentWithAuthor) => void;
}) {
  const { data: session } = useSession();
  const myUserId = (session?.user as any)?.id;
  const myRole = (session?.user as any)?.role;

  return (
    <div className="animate-fade-in">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
          {comment.author.username[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-gray-900">
              {comment.author.username}
            </span>
            <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 mb-1.5">{comment.content}</p>
          {session && (
            <button onClick={() => onReply(comment)}
              className="text-xs text-gray-400 hover:text-primary transition-colors">回复</button>
          )}
          {(myUserId === comment.authorId || myRole === "admin") && (
            <button onClick={async () => {
              if (!confirm("确定删除此评论？")) return;
              await fetch(`/api/posts/${comment.postId}/comments`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId: comment.id }) });
              window.location.reload();
            }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-2">删除</button>
          )}

          {/* Replies */}
          {comment.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs shrink-0">
                    {reply.author.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-900">
                        {reply.author.username}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
