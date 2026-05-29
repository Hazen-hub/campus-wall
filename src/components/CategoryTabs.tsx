"use client";

const categories = [
  { key: "all", label: "全部", icon: "📋" },
  { key: "general", label: "日常", icon: "💬" },
  { key: "love", label: "表白墙", icon: "💕" },
  { key: "lostfound", label: "失物招领", icon: "🔍" },
  { key: "trade", label: "二手交易", icon: "🤝" },
  { key: "joke", label: "吐槽", icon: "😂" },
  { key: "ask", label: "求助", icon: "❓" },
];

export default function CategoryTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      {categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key)}
          className={`shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            active === cat.key
              ? "bg-primary text-white shadow-sm"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
          }`}
        >
          <span className="mr-1">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}

export { categories };
