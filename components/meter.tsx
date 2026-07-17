"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function Meter({ percent }: { percent: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const width = Math.min(100, Math.max(0, percent));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tween = gsap.from(el, {
      scaleX: 0,
      duration: 1.1,
      delay: 0.35,
      ease: "expo.out",
    });
    return () => {
      tween.kill();
    };
  }, [width]);

  return (
    <span className="relative block h-2 w-full overflow-hidden rounded-full bg-mist">
      <span
        ref={ref}
        className="absolute inset-y-0 left-0 origin-left rounded-full"
        style={{
          width: `${width}%`,
          background:
            "linear-gradient(to right in oklab, #bed5fe 0%, #bed5fe 50%, #00c4ff 100%)",
        }}
      />
    </span>
  );
}
