import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg,#f5f5f7)] px-4">
      <div className="text-center">
        <div className="text-8xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">404</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">页面不存在或已被删除</p>
        <Link href="/" className="inline-block px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors">
          返回首页
        </Link>
      </div>
    </div>
  );
}
