"use client";
import { useEffect } from "react";

export default function ChildrensDay() {
  useEffect(() => {
    const now = new Date();
    if (now.getMonth() !== 5 || (now.getDate() !== 1 && now.getDate() !== 2)) return;

    document.body.style.background = "linear-gradient(135deg, #FFF0F5, #F0F8FF, #FFF5E6, #F5FFFA, #FFF0F5)";

    // 撒花 + 气球
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
    document.body.appendChild(container);
    const colors = ["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#FF6FB7","#C9B1FF"];
    for (let i = 0; i < 50; i++) {
      const c = document.createElement("div");
      c.style.cssText = `position:absolute;width:${6+Math.random()*10}px;height:${6+Math.random()*10}px;background:${colors[i%6]};left:${Math.random()*100}%;top:-20px;animation:cf${i%3} ${2+Math.random()*3}s ease-in ${Math.random()*4}s infinite;opacity:0.9`;
      container.appendChild(c);
    }
    for (let i = 0; i < 8; i++) {
      const b = document.createElement("div");
      b.style.cssText = `position:absolute;width:40px;height:50px;background:${colors[i]};left:${5+i*12}%;bottom:-60px;border-radius:50%/40% 40% 60% 60%;animation:br${i%3} ${5+i*0.5}s ease-in ${i*0.7}s infinite;opacity:0.85`;
      container.appendChild(b);
    }

    // 纯 CSS 注入：不碰 React DOM，不破坏事件
    const style = document.createElement("style");
    style.textContent = `
      @keyframes cf0{0%{transform:translateY(0)rotate(0)}100%{transform:translateY(100vh)rotate(360deg)}}
      @keyframes cf1{0%{transform:translateY(0)rotate(0)}100%{transform:translateY(100vh)rotate(-360deg)}}
      @keyframes cf2{0%{transform:translateY(0)rotate(0)}100%{transform:translateY(100vh)rotate(720deg)}}
      @keyframes br0{0%{transform:translateY(0)scale(1)}50%{transform:translateY(-50vh)scale(1.1)translateX(20px)}100%{transform:translateY(-110vh)scale(.9)}}
      @keyframes br1{0%{transform:translateY(0)scale(.9)}50%{transform:translateY(-50vh)scale(1.05)translateX(-15px)}100%{transform:translateY(-110vh)scale(1)}}
      @keyframes br2{0%{transform:translateY(0)scale(1)}50%{transform:translateY(-40vh)scale(1.15)translateX(10px)}100%{transform:translateY(-110vh)scale(.85)}}
      @keyframes lollipopBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}

    `;
    document.head.appendChild(style);

    // 彩虹头像框 - 内联样式
    function rainbow() {
      document.querySelectorAll("div[class*=rounded-full]").forEach((d: any) => {
        const imgs = d.querySelectorAll("img");
        if (imgs.length > 0) {
          imgs.forEach((img: any) => {
            if (!img.dataset.rbow) {
              img.dataset.rbow = "1";
              img.style.setProperty("box-shadow", "0 0 0 4px #FF1493,0 0 0 8px #FFD700,0 0 0 12px #00FF7F,0 0 0 16px #00BFFF", "important");
              img.style.setProperty("border-radius", "50%", "important");
            }
          });
        } else if (!d.dataset.rbow2) {
          d.dataset.rbow2 = "1";
          d.style.setProperty("box-shadow", "0 0 0 4px #FF1493,0 0 0 8px #FFD700,0 0 0 12px #00FF7F,0 0 0 16px #00BFFF", "important");
        }
      });
    }
    rainbow();
    const rf = setInterval(rainbow, 2000);

    return () => { container.remove(); style.remove(); clearInterval(rf); };
  }, []);
  return null;
}
