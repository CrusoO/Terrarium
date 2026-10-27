import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function Wordmark() {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const t = ".wm-letter:nth-child(1)";
        const i = ".wm-letter:nth-child(7)";
        let wait: gsap.core.Tween | undefined;
        let cycle: gsap.core.Timeline | undefined;
        const turn = () => {
          gsap.set(".wm", { overflow: "visible" });
          cycle = gsap.timeline({ onComplete: () => { wait = gsap.delayedCall(0.9, turn); } });
          cycle
            .to(t, { rotationY: 360, transformPerspective: 500, duration: 1.1, ease: "back.inOut(1.7)" }, 0)
            .to(t, { color: "#E2456F", duration: 0.45, yoyo: true, repeat: 1 }, 0.05)
            .set(t, { rotationY: 0 }, 1.1)
            .to(i, { y: -7, duration: 0.26, ease: "power2.out" }, 1.4)
            .to(i, { rotation: 360, duration: 0.8, ease: "power2.inOut" }, 1.4)
            .to(i, { y: 0, duration: 0.5, ease: "bounce.out" }, 1.66)
            .to(i, { color: "#E2456F", duration: 0.4, yoyo: true, repeat: 1 }, 1.4)
            .set(i, { rotation: 0 }, 2.2)
            .call(() => gsap.set([t, i], { clearProps: "color,transform" }), undefined, 2.25);
        };
        wait = gsap.delayedCall(2.4, turn);
        return () => {
          cycle?.kill();
          wait?.kill();
          gsap.set([t, i], { clearProps: "all" });
          gsap.set(".wm", { overflow: "visible" });
        };
      });
      return () => mm.revert();
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <span ref={ref} className="wm" aria-label="Terrarium">
      <span className="wm-letter wm-accent">T</span><span className="wm-letter">e</span>
      <span className="wm-letter">r</span><span className="wm-letter">r</span>
      <span className="wm-letter">a</span><span className="wm-letter">r</span>
      <span className="wm-letter wm-accent">i</span><span className="wm-letter">u</span>
      <span className="wm-letter">m</span>
    </span>
  );
}
