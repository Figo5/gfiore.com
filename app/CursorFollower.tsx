"use client";

import { useEffect, useRef } from "react";

export default function CursorFollower() {
  const follower = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = follower.current;
    if (!element) return;

    const enabled = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let detach = () => {};

    function configure() {
      detach();
      if (!enabled.matches || !element) return;

      let frame = 0;
      let lastTime = 0;
      let visible = false;
      let x = 0;
      let y = 0;
      let targetX = 0;
      let targetY = 0;

      function draw(time: number) {
        if (!element) return;
        const easing = 1 - Math.exp(-Math.min(time - lastTime, 64) / 65);
        lastTime = time;
        x += (targetX - x) * easing;
        y += (targetY - y) * easing;
        const settled = Math.hypot(targetX - x, targetY - y) < 0.25;
        if (settled) { x = targetX; y = targetY; }
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        frame = settled ? 0 : requestAnimationFrame(draw);
      }

      function hide() {
        if (!element) return;
        visible = false;
        element.dataset.visible = "false";
        element.dataset.active = "false";
        cancelAnimationFrame(frame);
        frame = 0;
      }

      function move(event: PointerEvent) {
        if (!element || event.pointerType === "touch") return;
        targetX = event.clientX;
        targetY = event.clientY;
        if (!visible) {
          x = targetX;
          y = targetY;
          element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          element.dataset.visible = "true";
          visible = true;
        }
        element.dataset.active = String(event.target instanceof Element && Boolean(event.target.closest("a,button,summary,input,textarea,select,[role=button]")));
        if (!frame) {
          lastTime = performance.now();
          frame = requestAnimationFrame(draw);
        }
      }

      function leave(event: PointerEvent) { if (!event.relatedTarget) hide(); }
      function visibility() { if (document.hidden) hide(); }

      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("pointerout", leave);
      window.addEventListener("blur", hide);
      window.addEventListener("keydown", hide);
      document.addEventListener("visibilitychange", visibility);
      detach = () => {
        hide();
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerout", leave);
        window.removeEventListener("blur", hide);
        window.removeEventListener("keydown", hide);
        document.removeEventListener("visibilitychange", visibility);
      };
    }

    configure();
    enabled.addEventListener("change", configure);
    return () => { detach(); enabled.removeEventListener("change", configure); };
  }, []);

  return <div ref={follower} className="cursor-follower" aria-hidden="true"><span /></div>;
}
