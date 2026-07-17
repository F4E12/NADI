"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ProductMotion() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(".nadi-product-page");
    if (!root || root.querySelector("[data-reveal]")) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const items = Array.from(root.children) as HTMLElement[];
        const fold = window.innerHeight * 0.88;
        const visible = items.filter((item) => item.getBoundingClientRect().top < fold);
        const belowFold = items.filter((item) => !visible.includes(item));

        gsap.from(visible, {
          y: 14,
          autoAlpha: 0,
          duration: 0.48,
          ease: "power4.out",
          stagger: 0.045,
          clearProps: "transform,opacity,visibility",
        });

        belowFold.forEach((item) => {
          gsap.from(item, {
            y: 18,
            autoAlpha: 0,
            duration: 0.52,
            ease: "power4.out",
            clearProps: "transform,opacity,visibility",
            scrollTrigger: {
              trigger: item,
              start: "top 90%",
              once: true,
            },
          });
        });
      }, root);

      return () => context.revert();
    });

    return () => mm.revert();
  }, [pathname]);

  return null;
}
