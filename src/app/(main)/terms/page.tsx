export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto prose dark:prose-invert">
      <h1 className="text-2xl font-bold mb-4 dark:text-gray-100">用户协议</h1>

      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-lg font-bold mb-2 dark:text-gray-100">1. 社区规范</h2>
          <p>禁止发布色情、暴力、违法内容。禁止人身攻击、恶意骚扰。管理员有权删除违规内容并封禁账号。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2 dark:text-gray-100">2. 账号责任</h2>
          <p>用户对使用自己账号发布的所有内容负责。请妥善保管密码，不要将账号借给他人使用。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2 dark:text-gray-100">3. 知识产权</h2>
          <p>用户发布的内容版权归原作者所有。校园墙展示内容不视为授权转载。</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2 dark:text-gray-100">4. 免责声明</h2>
          <p>校园墙为校内社区平台，用户言论不代表平台立场。对用户间交易、线下见面等行为不承担责任。</p>
        </section>
      </div>
    </div>
  );
}
