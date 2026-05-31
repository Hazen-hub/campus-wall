"use client";

import { useEffect } from "react";

export default function ChildrensDay() {
  useEffect(() => {
    const now = new Date();
    const isJune = now.getMonth() === 5;
    const isDay1or2 = now.getDate() === 1 || now.getDate() === 2;
    if (!isJune || !isDay1or2) return;

    // 糖果配色
    const root = document.documentElement;
    root.classList.add("childrens-day");
    root.style.setProperty("--color-primary", "#FF1493", "important");
    root.style.setProperty("--color-primary-dark", "#FF0080", "important");
    root.style.setProperty("--color-primary-light", "#FF69B4", "important");
    root.style.setProperty("--color-accent", "#00BFFF", "important");
    document.body.style.setProperty("background", "linear-gradient(135deg, #FFF0F5 0%, #F0F8FF 25%, #FFF5E6 50%, #F5FFFA 75%, #FFF0F5 100%)", "important");

    // 撒花
    const colors = ["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#FF6FB7","#C9B1FF","#FF8C42"];
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
    document.body.appendChild(container);
    for (let i = 0; i < 60; i++) {
      const confetti = document.createElement("div");
      const size = Math.random() * 10 + 6;
      confetti.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${Math.random()*100}%;top:-20px;border-radius:${Math.random()>0.5?"50%":"2px"};animation:confettiFall ${Math.random()*3+3}s ease-in ${Math.random()*5}s infinite;opacity:0.9`;
      container.appendChild(confetti);
    }
    for (let i = 0; i < 8; i++) {
      const balloon = document.createElement("div");
      const bc = ["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#FF6FB7","#C9B1FF"];
      balloon.style.cssText = `position:absolute;width:40px;height:50px;background:${bc[i%6]};left:${5+i*12}%;bottom:-60px;border-radius:50% 50% 50% 50%/40% 40% 60% 60%;animation:balloonRise ${6+i*0.5}s ease-in ${i*0.8}s infinite;opacity:0.85`;
      container.appendChild(balloon);
    }

    // 注入 keyframes + 头像框 CSS
    const style = document.createElement("style");
    style.textContent = `
      @keyframes confettiFall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
      @keyframes balloonRise { 0%{transform:translateY(0) scale(1)} 50%{transform:translateY(-50vh) scale(1.1) translateX(20px)} 100%{transform:translateY(-110vh) scale(0.9) translateX(-10px)} }
      @keyframes lollipopBounce { 0%,100%{transform:scale(1) rotate(0)} 25%{transform:scale(1.4) rotate(-20deg)} 50%{transform:scale(0.9) rotate(0)} 75%{transform:scale(1.5) rotate(20deg)} }
      html.childrens-day img[src*="data:image"] { box-shadow:0 0 0 5px #FF1493,0 0 0 10px #FFD700,0 0 0 15px #00FF7F,0 0 0 20px #00BFFF!important;border-radius:50%!important }
    `;
    document.head.appendChild(style);

    // 点赞动画 - 每 2 秒扫描一次
    function makeLollipop() {
      document.querySelectorAll("span.text-lg").forEach((el: any) => {
        if (!el.dataset.lollipop) {
          el.dataset.lollipop = "1";
          el.style.animation = "lollipopBounce 1.5s ease-in-out infinite";
          el.style.display = "inline-block";
        }
      });
    }
    makeLollipop();
    setInterval(makeLollipop, 2000);

    return () => {
      root.classList.remove("childrens-day");
      container.remove();
      style.remove();
    };
  }, []);

  return null;
}
