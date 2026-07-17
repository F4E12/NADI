"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = root.querySelectorAll("[data-reveal]");
    if (targets.length === 0) return;

    const mm = gsap.matchMedia(root);
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(targets, {
        y: 18,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power4.out",
        stagger: 0.07,
        clearProps: "all",
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
