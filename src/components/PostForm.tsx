"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PostFormProps {
  onPostCreated?: (post: any) => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState("general");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // 草稿：从 localStorage 恢复
  useEffect(() => {
    if (!session) return;
    const draft = localStorage.getItem("post-draft");
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.content) setContent(d.content);
        if (d.category) setCategory(d.category);
        if (d.isAnonymous) setIsAnonymous(d.isAnonymous);
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 3000);
      } catch {}
    }
  }, [session]);

  // 草稿：自动保存（每 3 秒）
  useEffect(() => {
    if (!session || !content) return;
    const timer = setInterval(() => {
      localStorage.setItem("post-draft", JSON.stringify({ content, category, isAnonymous }));
    }, 3000);
    return () => clearInterval(timer);
  }, [content, category, isAnonymous, session]);

  const categories = [
    { key: "general", label: "日常", icon: "💬" },
    { key: "love", label: "表白墙", icon: "💕" },
    { key: "lostfound", label: "失物招领", icon: "🔍" },
    { key: "trade", label: "二手交易", icon: "🤝" },
    { key: "joke", label: "吐槽", icon: "😂" },
    { key: "ask", label: "求助", icon: "❓" },
  ];

  const user = session?.user as any;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length + files.length > 9) {
      setError("最多上传9张图片");
      return;
    }

    setUploading(true);
    setError("");

    // 浏览器端压缩（Vercel 限制 4.5MB）
    async function compressFile(file: File): Promise<File> {
      if (file.size < 2 * 1024 * 1024) return file; // <2MB 不压缩
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxW = 1920;
          let w = img.width, h = img.height;
          if (w > maxW) { h = h * maxW / w; w = maxW; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            resolve(new File([blob!], file.name, { type: "image/jpeg" }));
          }, "image/jpeg", 0.7);
        };
        img.src = URL.createObjectURL(file);
      });
    }

    const formData = new FormData();
    for (const file of Array.from(files)) {
      const compressed = await compressFile(file);
      formData.append("files", compressed);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setImages((prev) => [...prev, ...data.data.urls]);
      } else {
        setError(data.error || "上传失败");
      }
    } catch (err) {
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if (!content.trim()) {
      setError("请输入内容");
      return;
    }
    if (content.length > 5000) {
      setError("内容不能超过5000字");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), images, category, isAnonymous }),
      });
      const data = await res.json();
      if (data.success) {
        setContent("");
        setImages([]);
        setIsAnonymous(false);
        setCategory("general");
        localStorage.removeItem("post-draft");
        onPostCreated?.(data.data);
        router.refresh();
      } else {
        setError(data.error || "发布失败");
      }
    } catch (err) {
      setError("发布失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-gray-800 font-medium mb-1">登录后即可发帖</p>
        <p className="text-gray-400 text-sm mb-4">
          游客只能浏览帖子，登录后可以发帖、评论和点赞
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => router.push("/auth/login")}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            登录
          </button>
          <button
            onClick={() => router.push("/auth/register")}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            注册
          </button>
        </div>
      </div>
    );
  }

  return (
    <form id="post-form" onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的校园生活..."
            className="w-full min-h-[80px] p-2 text-sm text-gray-800 placeholder-gray-400 resize-none outline-none border-0 focus:ring-0"
            maxLength={5000}
          />
        </div>
      </div>

      {/* Image preview */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 ml-12">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`预览 ${i + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
          {uploading && (
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Category + Anonymous */}
      <div className="flex items-center gap-3 mt-2 ml-12 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {categories.map((c) => (
            <button key={c.key} type="button"
              onClick={() => setCategory(c.key)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${category === c.key ? "bg-primary/10 text-primary font-medium" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >{c.icon} {c.label}</button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary" />
          <span className="text-xs text-gray-500">匿名</span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <p className="ml-12 mt-2 text-sm text-red-500">{error}</p>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 ml-12">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || images.length >= 9}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50"
          >
            <span>🖼️</span>
            <span>图片</span>
          </button>
          <span className="text-xs text-gray-400">{content.length}/5000</span>
        </div>

        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-5 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <span className="flex items-center gap-1">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              发布中
            </span>
          ) : (
            "发布"
          )}
        </button>
      </div>
    </form>
  );
}
