import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  const rootRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const origins = ["30.5 30.5", "33.5 30.5", "33.5 33.5", "30.5 33.5"];
        let cycle: gsap.core.Timeline | undefined;
        let wait: gsap.core.Tween | undefined;
        const turn = () => {
          const c = gsap.timeline({ onComplete: () => { wait = gsap.delayedCall(0.9, turn); } });
          c.to(".ring", { rotation: "+=90", svgOrigin: "32 32", duration: 1.1, ease: "back.inOut(1.6)" }, 0)
            .fromTo(".badge", { scale: 0.88 }, { scale: 1, svgOrigin: "32 32", duration: 1, ease: "elastic.out(1,0.45)" }, 0.7);
          cycle = c;
        };
        gsap.timeline({ defaults: { ease: "power3.out" } })
          .from(".pt", { scale: 0, rotation: -140, svgOrigin: (i) => origins[i], duration: 1, ease: "elastic.out(1,0.55)", stagger: 0.12 }, 0)
          .from(".badge-circle", { scale: 0, svgOrigin: "32 32", duration: 0.7, ease: "back.out(2.2)" }, 0.45)
          .from(".tt-bar", { scaleX: 0, svgOrigin: "32 26.4", duration: 0.45 }, 0.85)
          .from(".tt-stem", { scaleY: 0, svgOrigin: "32 24.2", duration: 0.45 }, 1.05)
          .call(turn, undefined, 2.4);
        return () => {
          cycle?.kill();
          wait?.kill();
          gsap.set(".ring,.badge,.pt,.badge-circle,.tt-bar,.tt-stem", { clearProps: "all" });
        };
      });
      return () => mm.revert();
    }, root);
    return () => ctx.revert();
  }, []);

  function replay() {
    const root = rootRef.current;
    if (!root) return;
    gsap.context(() => {
      gsap.set(".ring,.badge,.pt,.badge-circle,.tt-bar,.tt-stem", { clearProps: "all" });
    }, root).revert();
  }

  return (
    <button ref={rootRef} className={className ?? "tw-logo-button"} type="button" aria-label="Replay logo animation" onClick={replay}>
      <svg className="logo-mark" viewBox="0 0 64 64" width="44" height="44" fill="none" style={{ overflow: "visible" }} aria-hidden="true">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8F2447" /><stop offset="1" stopColor="#C23A66" /></linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D6345F" /><stop offset="1" stopColor="#FF6B8A" /></linearGradient>
          <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF8A5C" /><stop offset="1" stopColor="#FFB38A" /></linearGradient>
          <linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F7B6C8" /><stop offset="1" stopColor="#E88AA6" /></linearGradient>
        </defs>
        <g className="ring">
          <path className="pt" d="M30.5 30.5V2.5A28 28 0 0 0 2.5 30.5Z" fill="url(#g1)" />
          <path className="pt" d="M33.5 30.5V2.5A28 28 0 0 1 61.5 30.5Z" fill="url(#g2)" />
          <path className="pt" d="M33.5 33.5H61.5A28 28 0 0 1 33.5 61.5Z" fill="url(#g3)" />
          <path className="pt" d="M30.5 33.5V61.5A28 28 0 0 1 2.5 33.5Z" fill="url(#g4)" />
        </g>
        <g className="badge">
          <circle className="badge-circle" cx="32" cy="32" r="17.5" fill="#7A1F3D" stroke="#FBF9F7" strokeWidth="3" />
          <rect className="tt-bar" x="23.4" y="24.2" width="17.2" height="4.4" rx="1.4" fill="#FFFBE6" />
          <rect className="tt-stem" x="29.8" y="24.2" width="4.4" height="15.6" rx="1.4" fill="#FFFBE6" />
        </g>
      </svg>
    </button>
  );
}
