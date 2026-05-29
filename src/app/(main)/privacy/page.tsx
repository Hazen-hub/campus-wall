export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto prose dark:prose-invert">
      <h1 className="text-2xl font-bold mb-4 dark:text-gray-100">隐私政策</h1>
      <p className="text-sm text-gray-500 mb-6">更新日期：2026年5月30日</p>

      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-lg font-bold mb-2 dark:text-gray-100">1. 信息收集</h2>
          <p>注册时收集邮箱地址、用户名、年级班级信息。邮箱仅用于验证码验证和账号找回。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2 dark:text-gray-100">2. 信息使用</h2>
          <p>用户信息仅用于校园墙社区功能，不会出售或分享给第三方。匿名发帖时用户名不会对外显示。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2 dark:text-gray-100">3. 内容管理</h2>
          <p>用户发布的帖子、评论含违规内容将被管理员隐藏或删除。敏感词自动过滤。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2 dark:text-gray-100">4. 数据安全</h2>
          <p>密码使用 bcrypt 加密存储。数据库定期备份。验证码 5 分钟后自动失效。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2 dark:text-gray-100">5. 联系我们</h2>
          <p>通过意见箱功能或直接联系管理员处理隐私相关问题。</p>
        </section>
      </div>
    </div>
  );
}
