"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const counter = { n: 0 };
    const tween = gsap.to(counter, {
      n: value,
      duration: 1.2,
      delay: 0.2,
      ease: "power4.out",
      onUpdate: () => {
        el.textContent = Math.round(counter.n).toLocaleString("id-ID");
      },
    });
    return () => {
      tween.kill();
    };
  }, [value]);

  return <span ref={ref}>{value.toLocaleString("id-ID")}</span>;
}
