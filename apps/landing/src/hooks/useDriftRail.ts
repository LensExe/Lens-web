import { useEffect, useRef, useSyncExternalStore } from "react";

// The drifting rail only runs where a mouse can steer it: wide screens with a
// fine pointer. Touch / narrow screens keep the native swipe rail.
const DRIFT_QUERY = "(min-width: 1024px) and (pointer: fine)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** Drift speed, px per second — slow enough to read the cards. */
const SPEED = 30;
/** After ‹ › the rail waits this long before drifting again (ms). */
const HOLD_MS = 2500;
/** A mouse drag longer than this (px) is a drag, not a click. */
const DRAG_THRESHOLD = 6;
/** Easing rate toward the target position (higher = snappier). */
const EASE = 8;

const pad = (n: number) => String(n).padStart(2, "0");

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DRIFT_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** True on wide screens with a mouse: render the drifting (looping) rail. */
export function useDriftMode() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DRIFT_QUERY).matches,
    () => false
  );
}

/**
 * Slow, endless sideways drift for a card rail whose items are rendered twice
 * (the second set is an inert clone). All motion is one rAF loop writing a
 * transform — no React state per frame.
 *
 * - Pauses while the mouse rests on the rail, while a card has keyboard focus,
 *   while dragging, off-screen and in hidden tabs.
 * - Wheel over the rail scrolls it sideways, but only once the user has moved
 *   the mouse onto it: if the rail merely slid under a still pointer during a
 *   page scroll, the wheel keeps scrolling the page.
 * - Mouse drag, and `step(±1)` for the ‹ › buttons.
 * - Reduced motion: no drift, no easing — moves jump straight to place.
 *
 * Returns the refs to attach (viewport, track, counter text, progress bar)
 * and `step` for the buttons.
 */
export function useDriftRail({ enabled, total }: { enabled: boolean; total: number }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const stepRef = useRef<((dir: 1 | -1) => void) | null>(null);

  useEffect(() => {
    const view = viewport.current;
    const rail = track.current;
    if (!enabled || !view || !rail || total === 0) return;
    const reduce = window.matchMedia(REDUCED_QUERY).matches;

    // Geometry: one card step and the width of one full set (the loop).
    let stepW = 0;
    let loop = 0;
    const measure = () => {
      const cards = rail.children as HTMLCollectionOf<HTMLElement>;
      stepW = total > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
      const twin = cards[total];
      // Too few cards to fill the viewport twice → no loop, no drift.
      loop = twin && twin.offsetLeft > view.clientWidth ? twin.offsetLeft : 0;
    };
    measure();

    let pos = 0;
    let target = 0;
    let raf = 0;
    let last = 0;
    let visible = false;
    let resting = false; // mouse deliberately on the rail
    let focused = false;
    let dragging = false;
    let dragX = 0;
    let dragged = 0;
    let holdUntil = 0;
    let holdTimer = 0;

    const wrap = () => {
      if (!loop) {
        target = pos = 0;
        return;
      }
      while (pos >= loop) {
        pos -= loop;
        target -= loop;
      }
      while (pos < 0) {
        pos += loop;
        target += loop;
      }
    };

    const paint = () => {
      rail.style.transform = `translate3d(${-pos}px, 0, 0)`;
      if (counter.current && stepW) {
        counter.current.textContent = pad((Math.floor((pos + stepW / 2) / stepW) % total) + 1);
      }
      if (bar.current && loop) bar.current.style.transform = `scaleX(${(pos + stepW) / loop})`;
    };

    const drifting = (now: number) =>
      !reduce && loop > 0 && !resting && !focused && !dragging && now >= holdUntil;

    const frame = (now: number) => {
      const dt = Math.min(0.064, (now - (last || now)) / 1000);
      last = now;
      const moving = drifting(now);
      if (moving) target += SPEED * dt;
      pos = reduce || dragging ? target : pos + (target - pos) * (1 - Math.exp(-dt * EASE));
      if (!moving && Math.abs(target - pos) < 0.5) pos = target;
      wrap();
      paint();
      // Settled and not drifting → sleep until something kicks the loop.
      raf = moving || pos !== target ? requestAnimationFrame(frame) : 0;
    };

    const kick = () => {
      if (raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const sleep = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    stepRef.current = (dir) => {
      if (!stepW) return;
      target = (Math.round(target / stepW) + dir) * stepW;
      holdUntil = performance.now() + HOLD_MS;
      window.clearTimeout(holdTimer);
      holdTimer = window.setTimeout(kick, HOLD_MS + 50);
      kick();
    };

    // Wheel: sideways gestures always move the rail; a vertical wheel only
    // when the mouse was deliberately placed on it. `data-lenis-prevent` is
    // set per event so Lenis (listening on window) skips only captured ones.
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch / browser zoom
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? view.clientWidth : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;
      const sideways = Math.abs(dx) > Math.abs(dy);
      const capture = sideways || resting;
      view.toggleAttribute("data-lenis-prevent", capture);
      if (!capture) return;
      e.preventDefault();
      target += sideways ? dx : dy;
      kick();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || resting) return;
      // Synthetic moves (the page scrolled under a still mouse) carry no movement.
      if (e.movementX || e.movementY) resting = true;
    };
    const onPointerLeave = () => {
      resting = false;
      kick();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      e.preventDefault(); // no text selection / native link drag
      dragging = true;
      dragX = e.clientX;
      dragged = 0;
      window.addEventListener("pointermove", onDragMove);
      window.addEventListener("pointerup", onDragEnd, { once: true });
    };
    const onDragMove = (e: PointerEvent) => {
      const dx = e.clientX - dragX;
      dragX = e.clientX;
      dragged += Math.abs(dx);
      target -= dx;
      kick();
    };
    const onDragEnd = () => {
      dragging = false;
      window.removeEventListener("pointermove", onDragMove);
      kick();
    };
    // A drag must not open the card it started on.
    const onClickCapture = (e: MouseEvent) => {
      if (dragged > DRAG_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();
      }
      dragged = 0;
    };

    // Keyboard: bring the focused card into view (clones are inert, so focus
    // is always in the first set).
    const onFocusIn = (e: FocusEvent) => {
      focused = true;
      const card = (e.target as HTMLElement).closest("li");
      if (!card) return;
      const left = card.offsetLeft - pos;
      if (left < 0 || left + card.offsetWidth > view.clientWidth) {
        target = pos = Math.max(0, card.offsetLeft - 24);
        paint();
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (view.contains(e.relatedTarget as Node | null)) return;
      focused = false;
      kick();
    };

    const onVisibility = () => (document.hidden ? sleep() : kick());
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
      else sleep();
    });
    const ro = new ResizeObserver(() => {
      measure();
      wrap();
      paint();
    });

    view.addEventListener("wheel", onWheel, { passive: false });
    view.addEventListener("pointermove", onPointerMove);
    view.addEventListener("pointerleave", onPointerLeave);
    view.addEventListener("pointerdown", onPointerDown);
    view.addEventListener("click", onClickCapture, true);
    view.addEventListener("focusin", onFocusIn);
    view.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", onVisibility);
    io.observe(view);
    ro.observe(view);
    paint();

    return () => {
      sleep();
      window.clearTimeout(holdTimer);
      io.disconnect();
      ro.disconnect();
      view.removeEventListener("wheel", onWheel);
      view.removeEventListener("pointermove", onPointerMove);
      view.removeEventListener("pointerleave", onPointerLeave);
      view.removeEventListener("pointerdown", onPointerDown);
      view.removeEventListener("click", onClickCapture, true);
      view.removeEventListener("focusin", onFocusIn);
      view.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("pointermove", onDragMove);
      window.removeEventListener("pointerup", onDragEnd);
      document.removeEventListener("visibilitychange", onVisibility);
      view.removeAttribute("data-lenis-prevent");
      rail.style.transform = "";
      stepRef.current = null;
    };
  }, [enabled, total]);

  const step = (dir: 1 | -1) => stepRef.current?.(dir);
  return { viewport, track, counter, bar, step };
}
