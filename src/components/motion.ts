import { useEffect, useLayoutEffect, useRef } from "react";

/** One observer for meaningful sections, including content arriving from queries.
 * Content remains visible if motion or IntersectionObserver is unavailable.
 * Navigation animates the existing main element without remounting forms/routes.
 */
export function useSiteMotion(pathname: string) {
  const scope = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = scope.current;
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    let mutations: MutationObserver | undefined;
    const reveal = (element: HTMLElement) => {
      element.dataset.motion = "visible";
      observer?.unobserve(element);
    };
    const reset = () => {
      observer?.disconnect();
      mutations?.disconnect();
      root.querySelectorAll<HTMLElement>("[data-motion]").forEach((el) => {
        delete el.dataset.motion;
      });
    };
    const setup = () => {
      reset();
      if (preference.matches || !window.IntersectionObserver) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) reveal(entry.target as HTMLElement);
          });
        },
        { threshold: 0 },
      );
      const register = (node: Element) => {
        const elements = [
          ...(node.matches("[data-reveal]") ? [node] : []),
          ...node.querySelectorAll("[data-reveal]"),
        ];
        elements.forEach((element) => {
          const el = element as HTMLElement;
          if (el.dataset.motion) return;
          el.dataset.motion = "pending";
          observer?.observe(el);
        });
      };
      register(root);
      mutations = new MutationObserver((records) => {
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node instanceof Element) register(node);
          });
          record.removedNodes.forEach((node) => {
            if (node instanceof Element) {
              observer?.unobserve(node);
              node
                .querySelectorAll("[data-reveal]")
                .forEach((el) => observer?.unobserve(el));
            }
          });
        });
      });
      mutations.observe(root, { childList: true, subtree: true });
    };
    // Keyboard focus must never land on an invisible reveal target.
    const onFocus = (event: FocusEvent) => {
      let element = event.target instanceof Element ? event.target : null;
      while (element && element !== root) {
        if (
          element instanceof HTMLElement &&
          element.dataset.motion === "pending"
        )
          reveal(element);
        element = element.parentElement;
      }
    };
    setup();
    preference.addEventListener("change", setup);
    root.addEventListener("focusin", onFocus);
    return () => {
      reset();
      preference.removeEventListener("change", setup);
      root.removeEventListener("focusin", onFocus);
    };
  }, []);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = scope.current?.querySelector("main");
    const animation = main?.animate?.(
      [
        { opacity: 0.65, translate: "0 8px" },
        { opacity: 1, translate: "0 0" },
      ],
      { duration: 350, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
    );
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => {
      if (preference.matches) animation?.cancel();
    };
    preference.addEventListener("change", cancel);
    return () => {
      animation?.cancel();
      preference.removeEventListener("change", cancel);
    };
  }, [pathname]);
  return scope;
}
