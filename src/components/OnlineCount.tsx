"use client";
import { useState, useEffect } from "react";
export default function OnlineCount() {
  const [n, setN] = useState<number|null>(null);
  useEffect(() => {
    const f = () => fetch("/api/online").then(r => r.json()).then(d => { if (d.success) setN(d.online); }).catch(() => {});
    f(); const t = setInterval(f, 30000);
    return () => clearInterval(t);
  }, []);
  if (n === null) return null;
  return <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"/></span>{n} 人在线</span>;
}
