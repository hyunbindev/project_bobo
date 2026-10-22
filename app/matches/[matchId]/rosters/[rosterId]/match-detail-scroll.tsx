"use client";

import { useEffect } from "react";

import { getMatchDetailScrollTarget, MATCH_DETAIL_NAVIGATION_EVENT } from "@/lib/match-detail-navigation";

/** Resolve fragment navigation after async content and accordion motion settle. */
export function MatchDetailScroll({ historyAvailable }: { historyAvailable: boolean }) {
  useEffect(() => {
    let cancelPending = () => {};

    function navigate() {
      cancelPending();
      const requestedTarget = getMatchDetailScrollTarget(window.location.hash);
      if (!requestedTarget) return;
      const targetId = requestedTarget === "squad-matches" && !historyAvailable ? "match-records" : requestedTarget;
      let frame = 0;
      let cancelled = false;
      let previousTop: number | undefined;
      let stableFrames = 0;

      const observer = new MutationObserver(schedule);
      function cleanup() {
        cancelled = true;
        cancelAnimationFrame(frame);
        observer.disconnect();
        window.removeEventListener("wheel", cleanup);
        window.removeEventListener("touchstart", cleanup);
        window.removeEventListener("pointerdown", cleanup);
        window.removeEventListener("keydown", onKeyDown);
      }
      function onKeyDown(event: KeyboardEvent) {
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) cleanup();
      }
      function schedule() {
        if (cancelled) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(check);
      }
      function check() {
        if (cancelled) return;
        const target = document.getElementById(targetId);
        const history = document.getElementById("squad-matches");
        if (!target || history?.dataset.scrollReady === "false" || document.fonts.status === "loading") return;

        const panel = document.querySelector<HTMLElement>("#squad-history [data-slot='collapsible-content']");
        if (panel?.getAnimations().some((animation) => animation.playState === "running")) {
          schedule();
          return;
        }
        const top = target.getBoundingClientRect().top + window.scrollY;
        stableFrames = previousTop !== undefined && Math.abs(top - previousTop) < 1 ? stableFrames + 1 : 0;
        previousTop = top;
        if (stableFrames < 2) {
          schedule();
          return;
        }
        cleanup();
        target.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      }

      cancelPending = cleanup;
      observer.observe(document.body, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ["data-scroll-ready", "data-starting-style", "data-ending-style", "hidden"],
      });
      window.addEventListener("wheel", cleanup, { passive: true });
      window.addEventListener("touchstart", cleanup, { passive: true });
      window.addEventListener("pointerdown", cleanup, { passive: true });
      window.addEventListener("keydown", onKeyDown);
      void document.fonts.ready.then(schedule);
      schedule();
    }

    navigate();
    window.addEventListener("hashchange", navigate);
    window.addEventListener("popstate", navigate);
    window.addEventListener(MATCH_DETAIL_NAVIGATION_EVENT, navigate);
    return () => {
      cancelPending();
      window.removeEventListener("hashchange", navigate);
      window.removeEventListener("popstate", navigate);
      window.removeEventListener(MATCH_DETAIL_NAVIGATION_EVENT, navigate);
    };
  }, [historyAvailable]);

  return null;
}
