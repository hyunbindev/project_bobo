"use client";

import { useEffect, useRef, useState } from "react";

import type { RankingUnit } from "@/lib/rankings/types";
import { animateNumber } from "@/lib/utils";

type AnimatedRankingValueProps = {
  value: number;
  unit: RankingUnit;
};

export function AnimatedRankingValue({
  value,
  unit,
}: AnimatedRankingValueProps) {
  const [displayValue, setDisplayValue] = useState(() =>
    formatRankingValue(0, unit),
  );
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = numberRef.current;

    if (!element) {
      return;
    }

    let cancelAnimation: (() => void) | undefined;

    const startAnimation = () => {
      setDisplayValue(formatRankingValue(0, unit));
      cancelAnimation = animateNumber({
        to: value,
        duration: 1500,
        onUpdate: (currentValue) => {
          setDisplayValue(formatRankingValue(currentValue, unit));
        },
      });
    };

    if (!("IntersectionObserver" in window)) {
      startAnimation();
      return () => cancelAnimation?.();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        observer.disconnect();
        startAnimation();
      },
      { threshold: 0.35 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimation?.();
    };
  }, [unit, value]);

  return <span ref={numberRef}>{displayValue}</span>;
}

function formatRankingValue(value: number, unit: RankingUnit) {
  if (unit === "회" || unit === "킬" || unit === "P") {
    return Math.round(value).toLocaleString("ko-KR");
  }

  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}
