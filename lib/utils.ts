import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export type AnimateNumberOptions = {
  from?: number;
  to: number;
  duration?: number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
};

/**
 * 숫자를 from에서 to까지 부드럽게 증가시키고 매 프레임의 값을 전달한다.
 * 반환된 함수를 호출하면 진행 중인 애니메이션을 취소할 수 있다.
 */
export function animateNumber({
  from = 0,
  to,
  duration = 800,
  onUpdate,
  onComplete,
}: AnimateNumberOptions): () => void {
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw new TypeError("from and to must be finite numbers.");
  }

  const normalizedDuration = Math.max(duration, 0);
  const cannotAnimate =
    typeof window === "undefined" ||
    normalizedDuration === 0 ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (cannotAnimate) {
    onUpdate(to);
    onComplete?.();
    return () => undefined;
  }

  let animationFrameId = 0;
  let startedAt: number | null = null;
  let cancelled = false;

  const updateFrame = (timestamp: number) => {
    startedAt ??= timestamp;

    const progress = Math.min((timestamp - startedAt) / normalizedDuration, 1);
    // ease-out cubic: 처음에는 빠르게 증가하고 끝으로 갈수록 자연스럽게 감속한다.
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    onUpdate(from + (to - from) * easedProgress);

    if (progress < 1 && !cancelled) {
      animationFrameId = window.requestAnimationFrame(updateFrame);
      return;
    }

    if (!cancelled) {
      onUpdate(to);
      onComplete?.();
    }
  };

  animationFrameId = window.requestAnimationFrame(updateFrame);

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(animationFrameId);
  };
}
