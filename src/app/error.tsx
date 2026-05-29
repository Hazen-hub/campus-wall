"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg,#f5f5f7)] px-4">
      <div className="text-center">
        <div className="text-8xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">出错了</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">服务器遇到问题，请稍后重试</p>
        <button onClick={reset} className="inline-block px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors">
          重试
        </button>
      </div>
    </div>
  );
}
