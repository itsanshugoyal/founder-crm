import { useEffect, useState } from "react";
import bunnyHead from "./assets/dashboard/scroll-bunny.svg";

export function CuteScrollbars() {
  const [heads, setHeads] = useState<{ key: number; x: number; y: number }[]>([]);
  useEffect(() => {
    let areas: HTMLElement[] = [];
    let frame = 0;
    let scanTimer = 0;
    const paint = () => {
      frame = 0;
      const next: { key: number; x: number; y: number }[] = [];
      const root = document.scrollingElement as HTMLElement | null;
      if (root && root.scrollHeight > window.innerHeight + 2) {
        const track = window.innerHeight - 44;
        const thumb = Math.max(60, track * window.innerHeight / root.scrollHeight);
        next.push({ key: 0, x: window.innerWidth - 20, y: 2 + (track - thumb) * root.scrollTop / (root.scrollHeight - window.innerHeight) });
      }
      areas.forEach((area, index) => {
        const rect = area.getBoundingClientRect();
        if (rect.width < 20 || rect.height < 65 || rect.bottom <= 0 || rect.top >= window.innerHeight || area.scrollHeight <= area.clientHeight + 2) return;
        const track = area.clientHeight - 44;
        const thumb = Math.max(60, track * area.clientHeight / area.scrollHeight);
        const top = rect.top + 2 + Math.max(0, track - thumb) * area.scrollTop / (area.scrollHeight - area.clientHeight);
        next.push({ key: index + 1, x: Math.min(window.innerWidth - 20, rect.right - 7), y: Math.min(window.innerHeight - 40, Math.max(0, top)) });
      });
      setHeads(next);
    };
    const queuePaint = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const scan = () => {
      areas = Array.from(document.querySelectorAll<HTMLElement>("aside, main, section, nav, div, ul, textarea")).filter((area) => {
        if (area.clientHeight < 65) return false;
        return /^(auto|scroll)$/.test(getComputedStyle(area).overflowY);
      });
      queuePaint();
    };
    const queueScan = () => { window.clearTimeout(scanTimer); scanTimer = window.setTimeout(scan, 180); };
    const observer = new MutationObserver(queueScan);
    observer.observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
    document.addEventListener("scroll", queuePaint, true);
    window.addEventListener("resize", queueScan);
    scan();
    return () => {
      observer.disconnect();
      document.removeEventListener("scroll", queuePaint, true);
      window.removeEventListener("resize", queueScan);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(scanTimer);
    };
  }, []);
  return <div className="cute-scrollbar-heads" aria-hidden="true">{heads.map((head) => <img key={head.key} src={bunnyHead} width={32} height={40} alt="" style={{ left: head.x - 16, top: head.y }} />)}</div>;
}
