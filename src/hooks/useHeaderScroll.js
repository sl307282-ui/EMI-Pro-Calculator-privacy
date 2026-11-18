import { useRef, useCallback, useEffect, useLayoutEffect } from 'react';

/**
 * useHeaderScroll Hook
 * Tracks scroll on the container and updates --scroll-progress (0.000 to 1.000)
 * on the header element using requestAnimationFrame for zero-re-render 60fps performance.
 *
 * @param {Object} options
 * @param {Function} [options.onScroll] Optional secondary scroll callback
 * @param {number} [options.threshold=60] Scroll distance in px to reach 100% collapsed state
 */
export function useHeaderScroll(options = {}) {
  const { onScroll, threshold = 60, tabsThreshold = 80 } = options;
  const headerRef = useRef(null);
  const scrollRef = useRef(null);
  const tabsRef = useRef(null);
  const rafIdRef = useRef(null);
  const currentProgressRef = useRef(0);
  const currentTabsProgressRef = useRef(0);
  const lastAppliedProgressRef = useRef(-1);
  const lastAppliedTabsProgressRef = useRef(-1);

  const applyProgressToElements = useCallback((targetHeader, targetTabs) => {
    if (headerRef.current && Math.abs(targetHeader - lastAppliedProgressRef.current) > 0.002) {
      lastAppliedProgressRef.current = targetHeader;
      headerRef.current.style.setProperty('--scroll-progress', targetHeader.toFixed(3));
    }
    if (tabsRef.current && Math.abs(targetTabs - lastAppliedTabsProgressRef.current) > 0.002) {
      lastAppliedTabsProgressRef.current = targetTabs;
      tabsRef.current.style.setProperty('--tabs-progress', targetTabs.toFixed(3));
      tabsRef.current.style.setProperty('--scroll-progress', targetHeader.toFixed(3));
    }
    if (scrollRef.current) {
      scrollRef.current.style.setProperty('--scroll-progress', targetHeader.toFixed(3));
      scrollRef.current.style.setProperty('--tabs-progress', targetTabs.toFixed(3));
    }
  }, []);

  const syncScroll = useCallback((scrollTopValue) => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headerProg = prefersReduced
      ? (scrollTopValue > 30 ? 1 : 0)
      : Math.min(1, Math.max(0, scrollTopValue / threshold));
    const tabsProg = prefersReduced
      ? (scrollTopValue > 16 ? 1 : 0)
      : Math.min(1, Math.max(0, (scrollTopValue - 16) / Math.max(1, tabsThreshold - 16)));

    currentProgressRef.current = headerProg;
    currentTabsProgressRef.current = tabsProg;

    applyProgressToElements(headerProg, tabsProg);
  }, [threshold, tabsThreshold, applyProgressToElements]);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    syncScroll(0);
  }, [syncScroll]);

  const handleScroll = useCallback((e) => {
    const scrollTop = e?.currentTarget?.scrollTop ?? 0;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const progress = prefersReduced
      ? (scrollTop > 30 ? 1 : 0)
      : Math.min(1, Math.max(0, scrollTop / threshold));
    const tabsProgress = prefersReduced
      ? (scrollTop > 16 ? 1 : 0)
      : Math.min(1, Math.max(0, (scrollTop - 16) / Math.max(1, tabsThreshold - 16)));

    currentProgressRef.current = progress;
    currentTabsProgressRef.current = tabsProgress;

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        applyProgressToElements(currentProgressRef.current, currentTabsProgressRef.current);
      });
    }

    if (onScroll) {
      onScroll(e);
    }
  }, [onScroll, threshold, tabsThreshold, applyProgressToElements]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return { headerRef, scrollRef, tabsRef, handleScroll, syncScroll };
}

export default useHeaderScroll;
