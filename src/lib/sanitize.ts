// XSS 防护：清洗用户输入
const ALLOWED_TAGS: Record<string, string[]> = {
  b: [], i: [], u: [], s: [], strong: [], em: [], br: [], p: [],
};

export function sanitizeHtml(input: string): string {
  if (!input) return "";

  // 1. 转义所有 HTML 特殊字符
  let result = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  // 2. 恢复允许的标签
  for (const [tag] of Object.entries(ALLOWED_TAGS)) {
    const openRegex = new RegExp(`&lt;${tag}&gt;`, "gi");
    const closeRegex = new RegExp(`&lt;/${tag}&gt;`, "gi");
    result = result.replace(openRegex, `<${tag}>`);
    result = result.replace(closeRegex, `</${tag}>`);
  }

  // 3. 允许换行
  result = result.replace(/&lt;br\s*\/?&gt;/gi, "<br>");

  return result;
}

// 简单版：完全去除 HTML
export function stripHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
