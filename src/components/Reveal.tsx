import { useLayoutEffect, useRef, type HTMLAttributes } from "react";

type RevealProps = HTMLAttributes<HTMLDivElement> & { delay?: number };

/** Presentation-only reveal. Content is visible until safely armed off-screen. */
export default function Reveal({ delay = 0, children, ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rect = element.getBoundingClientRect();
    if (motion.matches || !("IntersectionObserver" in window) || rect.top < window.innerHeight) return;

    const show = (animate: boolean) => {
      element.style.transition = animate
        ? `opacity 600ms ease-out ${Math.min(240, Math.max(0, delay))}ms, transform 600ms ease-out ${Math.min(240, Math.max(0, delay))}ms`
        : "none";
      element.style.opacity = "1";
      element.style.transform = "none";
    };
    const threshold = Math.min(0.15, (window.innerHeight * 0.9) / rect.height);
    const observer = new IntersectionObserver(([entry]) => {
      // Very tall blocks must still be able to reach the visibility threshold.
      if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
        show(true);
        observer.disconnect();
      }
    }, { threshold });
    const stopMotion = () => {
      if (motion.matches) {
        show(false);
        observer.disconnect();
      }
    };
    // Keyboard users should never focus an invisible descendant.
    const revealFocus = () => {
      show(false);
      observer.disconnect();
    };
    element.style.opacity = "0";
    element.style.transform = "translateY(24px)";
    observer.observe(element);
    motion.addEventListener("change", stopMotion);
    element.addEventListener("focusin", revealFocus);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", stopMotion);
      element.removeEventListener("focusin", revealFocus);
      show(false);
    };
  }, [delay]);

  return <div {...props} ref={ref} data-reveal="">{children}</div>;
}
