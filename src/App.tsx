import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  ASSEMBLY_PARTS,
  CartItem,
  FINISHES,
  FINISH_LIST,
  FinishId,
  PRODUCT_CONSTANTS,
  REVIEWS,
  TECHNICAL_SPECS,
  addItemToCart,
  addSpareCushionToCart,
  calculateCartTotals,
  computeAssemblyStateAtScroll,
  SECTION_STAGE_ORDER,
  removeCartItem,
  updateCartItemQuantity,
} from './data/productData';
import type { PersistentSceneControlRef } from './components/HeadphoneCanvas';
import {
  CustomCursorAndProgress,
  MagneticButton,
  PageLoader,
} from './components/CustomCursorAndLoader';

const HeadphoneCanvas = lazy(() =>
  import('./components/HeadphoneCanvas').then((m) => ({
    default: m.HeadphoneCanvas,
  }))
);
const SoundWaveformSection = lazy(() =>
  import('./components/SoundWaveformSection').then((m) => ({
    default: m.SoundWaveformSection,
  }))
);
const GallerySection = lazy(() =>
  import('./components/GallerySection').then((m) => ({
    default: m.GallerySection,
  }))
);
const CartDrawer = lazy(() =>
  import('./components/CartDrawer').then((m) => ({
    default: m.CartDrawer,
  }))
);

gsap.registerPlugin(ScrollTrigger);

const MARQUEE_ITEMS = Array.from({ length: 8 }).map(
  (_, i) =>
    `40H BATTERY • USB-C • REPLACEABLE CUSHIONS • 254 GRAMS • 10-YEAR PARTS GUARANTEE • BLUETOOTH 5.4 LDAC • item-${i}`
);

/**
 * Splits a headline string into overflow-masked words so GSAP can animate
 * each word with a masked slide-up + stagger on scroll.
 */
const KineticWords: React.FC<{
  text: string;
  accentWords?: string[];
}> = ({ text, accentWords = [] }) => {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, idx) => {
        const isAccent = accentWords.includes(word);
        return (
          <span
            key={`${word}-${idx}`}
            className="inline-block overflow-hidden align-bottom mr-[0.24em] pb-[0.04em]"
          >
            <span
              className={`js-kinetic-word inline-block will-change-transform ${
                isAccent ? 'text-[#FF4D00]' : ''
              }`}
            >
              {word}
            </span>
          </span>
        );
      })}
    </>
  );
};

export default function App() {
  const [selectedFinishId, setSelectedFinishId] = useState<FinishId>('matte-black');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  // Persistent 3D Journey & Section 02 Assembly State
  const [activeStageName, setActiveStageName] = useState<string>('HERO');
  const [assemblyScrollProgress, setAssemblyScrollProgress] = useState<number>(0);
  const [manualPartIndex, setManualPartIndex] = useState<number | null>(null);

  // Specs Section 04 Count-Up State (driven by ScrollTrigger)
  const [specCountRatio, setSpecCountRatio] = useState<number>(1);

  // Interactive 3D tilt state for Review cards (Section 06)
  const [reviewTilts, setReviewTilts] = useState<
    Record<string, { rx: number; ry: number }>
  >({});

  const mainRef = useRef<HTMLElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const heroLeftColRef = useRef<HTMLDivElement | null>(null);
  const marqueeTrackRef = useRef<HTMLDivElement | null>(null);
  const assemblySectionRef = useRef<HTMLElement | null>(null);
  const specsSectionRef = useRef<HTMLElement | null>(null);
  const reviewsSectionRef = useRef<HTMLElement | null>(null);
  const buySectionRef = useRef<HTMLElement | null>(null);
  const bgLayerRef = useRef<HTMLDivElement | null>(null);
  const configuratorRef = useRef<HTMLDivElement | null>(null);

  // Mutable ref shared with the single persistent Three.js canvas at 60fps
  const sceneControlRef = useRef<PersistentSceneControlRef>({
    globalScrollProgress: 0,
    activeStageIndex: 0,
    stageLocalProgress: 0,
    nextStageIndex: 0,
    transitionBlend: 0,
    assemblyOverrideProgress: null,
    manualPartIndex: null,
    soundPulseAmplitude: 0,
    dragDeltaX: 0,
    dragDeltaY: 0,
    pointerNormX: 0,
    pointerNormY: 0,
  });

  // Drag-to-rotate tracking on the 3D stage bays
  const dragStateRef = useRef<{
    dragging: boolean;
    lastX: number;
    lastY: number;
  }>({
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  const selectedFinish = FINISHES[selectedFinishId];
  const cartTotals = calculateCartTotals(cart);

  // Compute active part in Section 02
  const computedAssemblyState = computeAssemblyStateAtScroll(
    assemblyScrollProgress,
    0
  );
  const activePartIndex =
    manualPartIndex !== null ? manualPartIndex : computedAssemblyState.activePartIndex;
  const activeAssemblyPart =
    ASSEMBLY_PARTS[activePartIndex] || ASSEMBLY_PARTS[0];

  // Sync manual part selection to 3D control ref
  useEffect(() => {
    sceneControlRef.current.manualPartIndex = manualPartIndex;
  }, [manualPartIndex]);

  // Safety fallback for sceneReady if WebGL is unavailable in headless/software environments
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSceneReady(true);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  // Global mouse parallax on 3D camera rig and headlines
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      sceneControlRef.current.pointerNormX = nx;
      sceneControlRef.current.pointerNormY = ny;

      if (dragStateRef.current.dragging) {
        const dx = e.clientX - dragStateRef.current.lastX;
        const dy = e.clientY - dragStateRef.current.lastY;
        dragStateRef.current.lastX = e.clientX;
        dragStateRef.current.lastY = e.clientY;
        sceneControlRef.current.dragDeltaX += dx * 0.009;
        sceneControlRef.current.dragDeltaY = Math.max(
          -0.55,
          Math.min(0.55, sceneControlRef.current.dragDeltaY + dy * 0.006)
        );
      }
    };

    const handlePointerUp = () => {
      dragStateRef.current.dragging = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handleStagePointerDown = (e: React.PointerEvent) => {
    dragStateRef.current.dragging = true;
    dragStateRef.current.lastX = e.clientX;
    dragStateRef.current.lastY = e.clientY;
  };

  // Master Lenis + 12+ GSAP ScrollTriggers Orchestration
  useEffect(() => {
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lenis: Lenis | null = null;
    let rafId = 0;

    if (!isHeadless && !prefersReducedMotion) {
      lenis = new Lenis({
        duration: 1.05,
        smoothWheel: true,
      });
      lenis.on('scroll', ScrollTrigger.update);

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    }

    // Velocity-driven marquee loop
    let marqueeOffset = 0;
    let marqueeVelocityBoost = 1;
    let marqueeDirection = 1;
    let marqueeRaf = 0;

    const tickMarquee = () => {
      marqueeRaf = requestAnimationFrame(tickMarquee);
      if (prefersReducedMotion) return;
      marqueeVelocityBoost += (1 - marqueeVelocityBoost) * 0.08;
      marqueeOffset -= 0.045 * marqueeVelocityBoost * marqueeDirection;
      if (marqueeOffset <= -50) marqueeOffset += 50;
      if (marqueeOffset > 0) marqueeOffset -= 50;
      if (marqueeTrackRef.current) {
        marqueeTrackRef.current.style.transform = `translate3d(${marqueeOffset}%, 0, 0)`;
      }
    };
    marqueeRaf = requestAnimationFrame(tickMarquee);

    const ctx = gsap.context(() => {
      // =====================================================================
      // ST #1: SECTION-DRIVEN 3D JOURNEY TRIGGERS (trigger = each section, start "top bottom", end "bottom top")
      // =====================================================================
      const stageBays = gsap.utils.toArray<HTMLElement>('[data-stage-bay]');
      stageBays.forEach((bayEl) => {
        const idx = Number(bayEl.getAttribute('data-stage-index') || '0');
        const secEl = bayEl.closest('section') || bayEl;
        ScrollTrigger.create({
          trigger: secEl,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            const vh = Math.max(window.innerHeight, 320);
            const rect = bayEl.getBoundingClientRect();
            const visTop = Math.max(68, rect.top);
            const visBottom = Math.min(vh - 16, rect.bottom);
            const visH = Math.max(0, visBottom - visTop);
            if (visH > vh * 0.25) {
              sceneControlRef.current.activeStageIndex = idx;
              sceneControlRef.current.stageLocalProgress = Number(
                self.progress.toFixed(4)
              );
              const stageName = SECTION_STAGE_ORDER[idx] || 'HERO';
              setActiveStageName((prev) =>
                prev !== stageName ? stageName : prev
              );
            }
          },
        });
      });

      // Global scroll velocity tracker for marquee acceleration
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => {
          sceneControlRef.current.globalScrollProgress = Number(
            self.progress.toFixed(4)
          );
          const vel = self.getVelocity();
          if (Math.abs(vel) > 15) {
            marqueeDirection = vel >= 0 ? 1 : -1;
            marqueeVelocityBoost = Math.min(6.5, 1 + Math.abs(vel) / 420);
          }
        },
      });

      if (prefersReducedMotion) return;

      // =====================================================================
      // ST #2: HERO (01) LOAD STAGGER & SCROLL-OUT PARALLAX
      // =====================================================================
      if (heroSectionRef.current) {
        const heroWords =
          heroSectionRef.current.querySelectorAll('.js-kinetic-word');
        if (heroWords.length > 0) {
          gsap.fromTo(
            heroWords,
            { yPercent: 100 },
            {
              yPercent: 0,
              duration: 0.65,
              stagger: 0.035,
              ease: 'power3.out',
            }
          );
        }
      }

      // =====================================================================
      // ST #3: KINETIC TYPOGRAPHY REVEALS (Complete by top 55% so headlines are 100% readable in view)
      // =====================================================================
      const allSections = gsap.utils.toArray<HTMLElement>('.js-motion-section');
      allSections.forEach((sec) => {
        const isBuySec = sec.id === 'buy';
        const endTriggerPos = isBuySec ? 'top 72%' : 'top 55%';
        const words = sec.querySelectorAll('.js-kinetic-word');
        const secNums = sec.querySelectorAll('.js-sec-num');
        const monoLabels = sec.querySelectorAll('.js-mono-label');
        const headlineEl = sec.querySelector('[data-kinetic-headline]');

        if (secNums.length > 0) {
          gsap.fromTo(
            secNums,
            { y: 8, opacity: 0.35 },
            {
              y: 0,
              opacity: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sec,
                start: 'top 94%',
                end: endTriggerPos,
                scrub: 0.25,
              },
            }
          );
        }

        if (words.length > 0) {
          gsap.fromTo(
            words,
            { yPercent: 85 },
            {
              yPercent: 0,
              stagger: 0.015,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sec,
                start: 'top 92%',
                end: endTriggerPos,
                scrub: 0.25,
              },
            }
          );
        }

        if (monoLabels.length > 0) {
          gsap.fromTo(
            monoLabels,
            { y: 8, opacity: 0.35 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.03,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sec,
                start: 'top 92%',
                end: endTriggerPos,
                scrub: 0.25,
              },
            }
          );
        }

        if (headlineEl) {
          gsap.fromTo(
            headlineEl,
            { yPercent: 3 },
            {
              yPercent: -3,
              ease: 'none',
              scrollTrigger: {
                trigger: sec,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.6,
              },
            }
          );
        }
      });

      // =====================================================================
      // ST #4: SECTION 02 (ASSEMBLY) SCRUBBED 7-PART EXPLOSION & REASSEMBLY
      // =====================================================================
      if (assemblySectionRef.current) {
        ScrollTrigger.create({
          trigger: assemblySectionRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 0.5,
          onUpdate: (self) => {
            const prog = Number(self.progress.toFixed(3));
            sceneControlRef.current.assemblyOverrideProgress = prog;
            setManualPartIndex(null);
            setAssemblyScrollProgress(prog);
          },
          onLeave: () => {
            sceneControlRef.current.assemblyOverrideProgress = null;
          },
          onLeaveBack: () => {
            sceneControlRef.current.assemblyOverrideProgress = null;
          },
        });
      }

      // =====================================================================
      // ST #5 & #6: SECTION 04 (SPECS) GRID-LINE DRAW, ROW STAGGER & COUNT-UP
      // =====================================================================
      if (specsSectionRef.current) {
        const gridLines =
          specsSectionRef.current.querySelectorAll('.js-spec-grid-line');
        if (gridLines.length > 0) {
          gsap.fromTo(
            gridLines,
            { scaleX: 0 },
            {
              scaleX: 1,
              stagger: 0.04,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: specsSectionRef.current,
                start: 'top 88%',
                end: 'top 45%',
                scrub: 0.4,
              },
            }
          );
        }

        const specRows =
          specsSectionRef.current.querySelectorAll('.js-spec-row');
        if (specRows.length > 0) {
          gsap.fromTo(
            specRows,
            { y: 10, opacity: 0.35 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.04,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: specsSectionRef.current,
                start: 'top 88%',
                end: 'top 45%',
                scrub: 0.4,
              },
            }
          );
        }

        const counterProxy = { ratio: 0.25 };
        gsap.fromTo(
          counterProxy,
          { ratio: 0.25 },
          {
            ratio: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: specsSectionRef.current,
              start: 'top 85%',
              end: 'top 40%',
              scrub: 0.4,
            },
            onUpdate: () => {
              setSpecCountRatio(counterProxy.ratio);
            },
          }
        );
      }

      // =====================================================================
      // ST #7: SECTION 06 (REVIEWS) STAGGERED DEPTH PARALLAX CARDS
      // =====================================================================
      if (reviewsSectionRef.current) {
        const reviewCards =
          reviewsSectionRef.current.querySelectorAll('.js-review-card');
        reviewCards.forEach((card, idx) => {
          const depthOffset = (idx + 1) * 14;
          gsap.fromTo(
            card,
            { y: depthOffset, opacity: 0.5 },
            {
              y: 0,
              opacity: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: reviewsSectionRef.current,
                start: 'top 88%',
                end: 'top 48%',
                scrub: 0.4,
              },
            }
          );
        });
      }

      // =====================================================================
      // ST #8: SECTION 07 (BUY) BOM REVEAL
      // =====================================================================
      if (buySectionRef.current) {
        const bomRows = buySectionRef.current.querySelectorAll('.js-bom-row');
        if (bomRows.length > 0) {
          gsap.fromTo(
            bomRows,
            { y: 12, opacity: 0.4 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.04,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: buySectionRef.current,
                start: 'top 88%',
                end: 'top 55%',
                scrub: 0.3,
              },
            }
          );
        }
      }
    }, mainRef);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (marqueeRaf) cancelAnimationFrame(marqueeRaf);
      lenis?.destroy();
      ctx.revert();
    };
  }, []);

  const handleAddToCart = (finishId: FinishId = selectedFinishId) => {
    const finish = FINISHES[finishId];
    setCart((prev) => addItemToCart(prev, finish, 1));
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => updateCartItemQuantity(prev, itemId, delta));
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => removeCartItem(prev, itemId));
  };

  const handleAddSpareCushion = () => {
    setCart((prev) => addSpareCushionToCart(prev));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const scrollToConfigurator = () => {
    configuratorRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const formatAnimatedSpecValue = (code: string, defaultVal: string): string => {
    const r = Math.max(0.1, Math.min(1, specCountRatio));
    if (r >= 0.98) return defaultVal;
    switch (code) {
      case 'SPEC_01':
        return `${Math.round(254 * r)}g`;
      case 'SPEC_02':
        return `${Math.round(40 * r)}mm Biocellulose`;
      case 'SPEC_03':
        return `${Math.max(1, Math.round(6 * r))}Hz–${Math.round(38 * r)}kHz`;
      case 'SPEC_04':
        return `Bluetooth ${(5.4 * r).toFixed(1)}`;
      case 'SPEC_06':
        return `${Math.round(40 * r)}h (ANC on)`;
      case 'SPEC_07':
        return `${Math.max(1, Math.round(10 * r))} min = ${Math.max(1, Math.round(5 * r))}h`;
      case 'SPEC_08':
        return `${Math.max(1, Math.round(3 * r))} Years + ${Math.round(10 * r)}-Yr Parts`;
      default:
        return defaultVal;
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0E0E0E] text-[#ECE7DF] selection:bg-[#FF4D00] selection:text-[#0E0E0E]">
      <PageLoader isReady={sceneReady} />
      <CustomCursorAndProgress />

      {/* ===================================================================
          DYNAMIC GLOBAL BACKGROUND CANVAS (Ink #0E0E0E for Stages 0-5, Bone #ECE7DF for Stage 6)
      =================================================================== */}
      <div
        id="aura-global-backdrop"
        ref={bgLayerRef}
        aria-hidden="true"
        className="fixed inset-0 z-[1] bg-[#0E0E0E] pointer-events-none"
      />

      {/* ===================================================================
          ONE PERSISTENT FIXED 3D WEBGL CANVAS (Behind/Around Entire Page)
      =================================================================== */}
      <Suspense fallback={null}>
        <HeadphoneCanvas
          finishId={selectedFinishId}
          sceneControlRef={sceneControlRef}
          currentStageLabel={activeStageName}
          onReady={() => setSceneReady(true)}
        />
      </Suspense>

      {/* ===================================================================
          TOP NAVIGATION BAR (Strict 3-Zone Contract)
      =================================================================== */}
      <header className="sticky top-0 z-40 bg-[#0E0E0E]/95 border-b border-[#ECE7DF]/15">
        <div className="mx-auto max-w-[1440px] border-x border-[#ECE7DF]/15 px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            className="font-display text-base sm:text-lg font-bold uppercase tracking-tight text-[#ECE7DF] whitespace-nowrap shrink-0"
          >
            STUDIO KINETIC — AURA ONE
          </a>

          {/* Zone 2: 4 Single-line Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-widest text-[#8A8A85]"
          >
            <a
              href="#design"
              className="hover:text-[#ECE7DF] transition-colors whitespace-nowrap shrink-0"
            >
              Design
            </a>
            <a
              href="#sound"
              className="hover:text-[#ECE7DF] transition-colors whitespace-nowrap shrink-0"
            >
              Sound
            </a>
            <a
              href="#specs"
              className="hover:text-[#ECE7DF] transition-colors whitespace-nowrap shrink-0"
            >
              Specs
            </a>
            <a
              href="#buy"
              className="hover:text-[#ECE7DF] transition-colors whitespace-nowrap shrink-0"
            >
              Buy
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action (Cart Button with Working Count) */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            data-testid="nav-cart-button"
            aria-label={`Open shopping cart with ${cartTotals.totalCount} items`}
            className="px-4 py-2 bg-[#ECE7DF] text-[#0E0E0E] hover:bg-[#FF4D00] font-mono text-xs font-semibold uppercase tracking-widest transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            CART [{cartTotals.totalCount}]
          </button>
        </div>
      </header>

      <main id="top" ref={mainRef} className="relative z-10">
        {/* ===================================================================
            SECTION 01: HERO + INTERACTIVE 3D STAGE & WORKING CONFIGURATOR
        =================================================================== */}
        <section
          ref={heroSectionRef}
          aria-labelledby="hero-heading"
          className="relative border-b border-[#ECE7DF]/15 bg-transparent"
        >
          <div className="mx-auto max-w-[1440px] border-x border-[#ECE7DF]/15">
            {/* Editorial Technical Sub-Bar */}
            <div className="grid grid-cols-12 border-b border-[#ECE7DF]/15 px-4 py-2.5 sm:px-8 font-mono text-[11px] uppercase tracking-widest text-[#8A8A85] bg-[#0E0E0E]/95">
              <div className="col-span-6 sm:col-span-4 text-[#ECE7DF] js-sec-num">
                01 / MODULAR REFERENCE HEADPHONE
              </div>
              <div className="hidden sm:block sm:col-span-4 text-center js-mono-label">
                {PRODUCT_CONSTANTS.ORIGIN_STAMP}
              </div>
              <div className="col-span-6 sm:col-span-4 text-right text-[#FF4D00] js-mono-label">
                254G · $349 USD
              </div>
            </div>

            {/* 12-Column Split: Left 7 Cols = Copy, CTAs & Finish Configurator | Right 5 Cols = Full-Height 3D Stage Bay */}
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div
                ref={heroLeftColRef}
                className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[#ECE7DF]/15 flex flex-col justify-between bg-[#0E0E0E]/94 will-change-transform"
              >
                <div className="p-6 sm:p-10">
                  <div className="font-mono text-xs uppercase tracking-widest text-[#8A8A85] mb-3 js-mono-label">
                    {PRODUCT_CONSTANTS.ORIGIN_STAMP} · REF. {selectedFinish.code}
                  </div>

                  <h1
                    id="hero-heading"
                    data-kinetic-headline
                    className="font-display text-4xl sm:text-6xl xl:text-7xl font-bold uppercase tracking-[-0.04em] leading-[0.9] text-[#ECE7DF] text-balance"
                  >
                    <KineticWords
                      text="HEAR EVERY SCREW, SPRING AND SIGNAL."
                      accentWords={['AND', 'SIGNAL.']}
                    />
                  </h1>

                  <p className="mt-5 text-base sm:text-lg text-[#ECE7DF]/90 max-w-xl leading-relaxed">
                    Engineered without a single drop of glue. Every AURA ONE headphone is milled from 6061-T6 aluminium, fastened with standard Torx T6 machine screws, and backed by a{' '}
                    <span className="text-[#ECE7DF] font-semibold underline decoration-[#FF4D00] underline-offset-4">
                      10-year replaceable parts guarantee
                    </span>
                    .
                  </p>

                  {/* Live Price & Primary CTA Block */}
                  <div className="mt-6 pt-6 border-t border-[#ECE7DF]/15 space-y-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-4">
                      <div>
                        <span className="font-mono text-[11px] uppercase tracking-widest text-[#8A8A85] block">
                          ACTIVE CONFIGURATION · {selectedFinish.code}
                        </span>
                        <div
                          data-testid="active-finish-label"
                          className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#ECE7DF] mt-0.5"
                        >
                          AURA ONE — {selectedFinish.name}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-[11px] uppercase tracking-widest text-[#8A8A85] block">
                          DIRECT STUDIO PRICE
                        </span>
                        <div
                          data-testid="hero-price-display"
                          className="font-mono text-3xl sm:text-4xl font-bold text-[#ECE7DF]"
                        >
                          ${selectedFinish.price}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <MagneticButton
                        type="button"
                        onClick={() => handleAddToCart(selectedFinishId)}
                        data-testid="hero-add-to-cart"
                        className="px-6 py-3.5 bg-[#FF4D00] text-[#0E0E0E] font-mono text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-[#ECE7DF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Add to Cart — ${selectedFinish.price}
                      </MagneticButton>

                      <MagneticButton
                        type="button"
                        onClick={scrollToConfigurator}
                        className="px-5 py-3.5 border border-[#ECE7DF]/30 bg-transparent text-[#ECE7DF] font-mono text-xs sm:text-sm uppercase tracking-widest hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Configure yours
                      </MagneticButton>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-xs text-[#8A8A85]">
                      <span>254g Total Mass</span>
                      <span aria-hidden="true">·</span>
                      <span>40h ANC Autonomy</span>
                      <span aria-hidden="true">·</span>
                      <span>{PRODUCT_CONSTANTS.SHIPPING_NOTE}</span>
                    </div>
                  </div>
                </div>

                {/* Working 3-Finish Configurator Dock (Inside Left Column so Right Column is 100% Full-Height 3D Stage Bay) */}
                <div
                  ref={configuratorRef}
                  className="p-6 sm:px-10 border-t border-[#ECE7DF]/15 bg-[#0E0E0E]"
                >
                  <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-[#8A8A85] mb-3">
                    <span>SELECT ANODIZED FINISH:</span>
                    <span className="text-[#ECE7DF]">
                      {selectedFinish.name.toUpperCase()} · ${selectedFinish.price}
                    </span>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="Headphone finish color selector"
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                  >
                    {FINISH_LIST.map((finish) => {
                      const isSelected = finish.id === selectedFinishId;
                      return (
                        <button
                          key={finish.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          data-testid={`finish-btn-${finish.id}`}
                          onClick={() => setSelectedFinishId(finish.id)}
                          className={`p-3 border text-left transition-colors flex items-center gap-3 cursor-pointer ${
                            isSelected
                              ? 'border-[#FF4D00] bg-[#181818] text-[#ECE7DF]'
                              : 'border-[#ECE7DF]/20 bg-[#0E0E0E] text-[#8A8A85] hover:border-[#ECE7DF]/50 hover:text-[#ECE7DF]'
                          }`}
                        >
                          <span
                            className="w-4 h-4 border border-[#ECE7DF]/40 shrink-0"
                            style={{ backgroundColor: finish.swatchHex }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <div className="font-mono text-xs font-semibold uppercase text-[#ECE7DF] whitespace-nowrap truncate">
                              {finish.name}
                            </div>
                            <div className="font-mono text-[10px] text-[#8A8A85] whitespace-nowrap">
                              {finish.code} · ${finish.price}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-2.5 font-mono text-xs text-[#8A8A85] leading-relaxed">
                    {selectedFinish.tagline}
                  </p>
                </div>
              </div>

              {/* Right 5 Columns: Full-Height Unobstructed Interactive 3D Stage Bay */}
              <div
                onPointerDown={handleStagePointerDown}
                data-stage-bay
                data-stage-index="0"
                data-testid="hero-3d-stage-bay"
                className="lg:col-span-5 min-h-[400px] lg:min-h-full p-6 flex flex-col justify-between bg-transparent cursor-grab active:cursor-grabbing select-none"
              >
                <div className="pointer-events-none flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#8A8A85]">
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20">
                    PERSISTENT WEBGL RIG · DRAG TO ROTATE
                  </span>
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#FF4D00]">
                    STAGE: {activeStageName}
                  </span>
                </div>

                <div className="pointer-events-none flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#8A8A85]">
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20">
                    RIM LIGHT: RAL 2005 SIGNAL ORANGE
                  </span>
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#ECE7DF]">
                    SCROLL TO EXPLODE 7 PARTS ↓
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SCROLL-VELOCITY ACCELERATED TECHNICAL MARQUEE STRIP
        =================================================================== */}
        <div
          aria-label="Key specifications marquee"
          className="relative z-20 border-b border-[#ECE7DF]/15 bg-[#ECE7DF] text-[#0E0E0E] py-3 overflow-hidden"
        >
          <div
            ref={marqueeTrackRef}
            className="flex w-max font-mono text-xs sm:text-sm font-semibold uppercase tracking-widest will-change-transform"
          >
            {MARQUEE_ITEMS.map((_, idx) => (
              <span key={idx} className="mx-4 whitespace-nowrap">
                40H BATTERY • USB-C • REPLACEABLE CUSHIONS • 254 GRAMS •
              </span>
            ))}
          </div>
        </div>

        {/* ===================================================================
            SECTION 02: SCROLL-DRIVEN 7-PART EXPLODED ASSEMBLY (Zero Dead Zone)
        =================================================================== */}
        <section
          id="design"
          ref={assemblySectionRef}
          aria-labelledby="assembly-heading"
          className="js-motion-section relative border-b border-[#ECE7DF]/15 bg-transparent"
        >
          <div className="mx-auto max-w-[1440px] border-x border-[#ECE7DF]/15">
            {/* Section 02 Header Bar */}
            <div className="grid grid-cols-12 border-b border-[#ECE7DF]/15 px-4 py-3 sm:px-8 font-mono text-xs uppercase tracking-widest text-[#8A8A85] bg-[#0E0E0E]/95">
              <div className="col-span-6 sm:col-span-4 text-[#ECE7DF] js-sec-num">
                02 / MODULAR EXPLODED ASSEMBLY
              </div>
              <div className="hidden sm:block sm:col-span-4 text-center js-mono-label">
                7 SERVICEABLE SUB-ASSEMBLIES · TORX T6
              </div>
              <div className="col-span-6 sm:col-span-4 text-right text-[#FF4D00] js-mono-label">
                STATE: {computedAssemblyState.phaseLabel}
              </div>
            </div>

            {/* Smooth Progress Fill Bar for Section 02 */}
            <div className="w-full h-1 bg-[#ECE7DF]/10 overflow-hidden">
              <div
                className="h-full bg-[#FF4D00] transition-all duration-75"
                style={{ width: `${Math.round(assemblyScrollProgress * 100)}%` }}
              />
            </div>

            {/* 12-Column Split: Left 6 Cols = Full-Height 3D Exploded Stage Bay | Right 6 Cols = Title, Scrubber, Spec & 7 Parts */}
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left 6 Columns: Full-Height Unobstructed 3D Exploded Stage Bay */}
              <div
                onPointerDown={handleStagePointerDown}
                data-stage-bay
                data-stage-index="1"
                data-testid="assembly-3d-stage-bay"
                className="lg:col-span-6 min-h-[420px] lg:min-h-full p-6 border-b lg:border-b-0 lg:border-r border-[#ECE7DF]/15 flex flex-col justify-between bg-transparent cursor-grab active:cursor-grabbing select-none"
              >
                <div className="pointer-events-none flex items-center justify-between gap-2 font-mono text-xs">
                  <div className="bg-[#0E0E0E]/90 border border-[#ECE7DF]/25 px-3 py-1.5">
                    <span className="text-[#FF4D00] mr-2">
                      [{activeAssemblyPart.stepCode}]
                    </span>
                    <span className="uppercase text-[#ECE7DF] font-semibold">
                      {activeAssemblyPart.name}
                    </span>
                  </div>
                  <div className="bg-[#0E0E0E]/90 border border-[#ECE7DF]/25 px-3 py-1.5 text-[#8A8A85]">
                    EXPLODE: <span className="text-[#ECE7DF]">{Math.round(assemblyScrollProgress * 100)}%</span>
                  </div>
                </div>

                <div className="pointer-events-none flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#8A8A85]">
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20">
                    STAGE 02 · 7-PART EXPLODED CAD RIG
                  </span>
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#FF4D00]">
                    TORX T6 · ZERO ADHESIVE
                  </span>
                </div>
              </div>

              {/* Right 6 Columns: Headline + Scrubber + Active Component Blueprint + 7 Parts List */}
              <div className="lg:col-span-6 flex flex-col justify-between bg-[#0E0E0E]/94">
                {/* Headline & Scrubber Header */}
                <div className="p-6 sm:px-8 border-b border-[#ECE7DF]/15 bg-[#0E0E0E]">
                  <span className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] block js-mono-label">
                    RIGHT-TO-REPAIR ARCHITECTURE
                  </span>
                  <h2
                    id="assembly-heading"
                    data-kinetic-headline
                    className="font-display text-3xl sm:text-5xl font-bold uppercase tracking-tight leading-[0.94] text-[#ECE7DF] mt-1"
                  >
                    <KineticWords
                      text="SEVEN PARTS. ZERO GLUE."
                      accentWords={['ZERO', 'GLUE.']}
                    />
                  </h2>

                  {/* Interactive Explode / Reassemble Scrub Bar */}
                  <div className="mt-5 pt-4 border-t border-[#ECE7DF]/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <label
                      htmlFor="assembly-scrub-slider"
                      className="font-mono text-[11px] uppercase tracking-wider text-[#8A8A85] whitespace-nowrap shrink-0"
                    >
                      MANUAL CAD SCRUBBER:
                    </label>
                    <input
                      id="assembly-scrub-slider"
                      data-testid="assembly-scrubber-input"
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(assemblyScrollProgress * 100)}
                      onChange={(e) => {
                        const val = Number(e.target.value) / 100;
                        setManualPartIndex(null);
                        setAssemblyScrollProgress(val);
                        sceneControlRef.current.assemblyOverrideProgress = val;
                      }}
                      aria-label="Scrub 3D headphone explosion and reassembly timeline"
                      className="w-full accent-[#FF4D00] cursor-pointer"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setManualPartIndex(null);
                          setAssemblyScrollProgress(0.22);
                          sceneControlRef.current.assemblyOverrideProgress = 0.22;
                        }}
                        className="px-2.5 py-1 border border-[#ECE7DF]/25 font-mono text-[11px] uppercase text-[#ECE7DF] hover:border-[#FF4D00] hover:text-[#FF4D00] cursor-pointer whitespace-nowrap"
                      >
                        Explode All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManualPartIndex(null);
                          setAssemblyScrollProgress(0);
                          sceneControlRef.current.assemblyOverrideProgress = 0;
                        }}
                        className="px-2.5 py-1 border border-[#ECE7DF]/25 font-mono text-[11px] uppercase text-[#ECE7DF] hover:border-[#FF4D00] hover:text-[#FF4D00] cursor-pointer whitespace-nowrap"
                      >
                        Reassemble
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Part Detailed Spec Box */}
                <div className="p-6 sm:px-8 border-b border-[#ECE7DF]/15 bg-[#141414] transition-all duration-200">
                  <div className="flex items-center justify-between font-mono text-xs text-[#FF4D00] uppercase">
                    <span>COMPONENT {activeAssemblyPart.stepCode}</span>
                    <span>
                      SKU: {activeAssemblyPart.replacementSku} · SPARE ${activeAssemblyPart.replacementPrice}
                    </span>
                  </div>
                  <h3
                    data-testid="active-assembly-part-title"
                    className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#ECE7DF] mt-1.5"
                  >
                    {activeAssemblyPart.name}
                  </h3>
                  <p className="mt-1.5 font-mono text-xs text-[#ECE7DF]/80">
                    {activeAssemblyPart.materialSpec} · {activeAssemblyPart.toleranceSpec}
                  </p>
                  <p className="mt-2.5 text-sm text-[#8A8A85] leading-relaxed">
                    {activeAssemblyPart.description}
                  </p>
                  <div className="mt-3 pt-3 border-t border-[#ECE7DF]/15 flex items-center justify-between font-mono text-xs text-[#8A8A85]">
                    <span>COMPONENT MASS: {activeAssemblyPart.weightGrams}g</span>
                    <span>10-YEAR OEM STOCK GUARANTEED</span>
                  </div>
                </div>

                {/* All 7 Parts Selector List */}
                <div className="divide-y divide-[#ECE7DF]/15">
                  {ASSEMBLY_PARTS.map((part) => {
                    const isCurrent = part.index === activePartIndex;
                    return (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => setManualPartIndex(part.index)}
                        data-testid={`assembly-part-btn-${part.index}`}
                        className={`w-full px-6 py-3 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#ECE7DF] text-[#0E0E0E]'
                            : 'bg-[#0E0E0E] text-[#ECE7DF] hover:bg-[#161616]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`font-mono text-xs font-semibold ${
                              isCurrent ? 'text-[#FF4D00]' : 'text-[#8A8A85]'
                            }`}
                          >
                            0{part.index + 1}
                          </span>
                          <span className="font-display text-sm sm:text-base font-bold uppercase truncate">
                            {part.name}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-xs shrink-0 ${
                            isCurrent ? 'text-[#0E0E0E]' : 'text-[#8A8A85]'
                          }`}
                        >
                          {part.weightGrams}g · ${part.replacementPrice}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 03: SOUND & FREQUENCY RESPONSE LAB (Cutaway 3D Driver Stage)
        =================================================================== */}
        <Suspense fallback={<div className="min-h-[680px]" />}>
          <SoundWaveformSection
            onDriverPulse={(amp) => {
              sceneControlRef.current.soundPulseAmplitude = amp;
            }}
          />
        </Suspense>

        {/* ===================================================================
            SECTION 04: COMPLETE ENGINEERING SPECIFICATIONS TABLE
            (Left 5 Cols = Full-Height 3D Side-Profile Bay | Right 7 Cols = Header + Spec Table)
        =================================================================== */}
        <section
          id="specs"
          ref={specsSectionRef}
          aria-labelledby="specs-heading"
          className="js-motion-section relative border-b border-[#ECE7DF]/15 bg-transparent"
        >
          <div className="mx-auto max-w-[1440px] border-x border-[#ECE7DF]/15">
            <div className="grid grid-cols-12 border-b border-[#ECE7DF]/15 px-4 py-3 sm:px-8 font-mono text-xs uppercase tracking-widest text-[#8A8A85] bg-[#0E0E0E]/95">
              <div className="col-span-6 sm:col-span-4 text-[#ECE7DF] js-sec-num">
                04 / TECHNICAL SPECIFICATIONS
              </div>
              <div className="hidden sm:block sm:col-span-4 text-center js-mono-label">
                DOCUMENT REF: SK-A1-DATASHEET-REV4
              </div>
              <div className="col-span-6 sm:col-span-4 text-right js-mono-label">
                VERIFIED MASS: 254 GRAMS
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left 5 Columns: Full-Height Unobstructed 3D Side-Profile Stage Bay */}
              <div
                onPointerDown={handleStagePointerDown}
                data-stage-bay
                data-stage-index="3"
                data-testid="specs-3d-stage-bay"
                className="lg:col-span-5 min-h-[380px] lg:min-h-full p-6 border-b lg:border-b-0 lg:border-r border-[#ECE7DF]/15 flex flex-col justify-between bg-transparent cursor-grab active:cursor-grabbing select-none"
              >
                <div className="pointer-events-none flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#8A8A85]">
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#FF4D00]">
                    STAGE 04 · SIDE-PROFILE TELEMETRY
                  </span>
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20">
                    188 × 164 × 78 MM
                  </span>
                </div>

                <div className="pointer-events-none flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#8A8A85]">
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#ECE7DF]">
                    14× TORX T6 · 254G VERIFIED
                  </span>
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#FF4D00]">
                    DRAG TO INSPECT
                  </span>
                </div>
              </div>

              {/* Right 7 Columns: Title Block + 8-Row Specification Table + Hardware Summary */}
              <div className="lg:col-span-7 bg-[#0E0E0E]/94 flex flex-col justify-between">
                <div className="p-6 sm:p-8 border-b border-[#ECE7DF]/15 bg-[#0E0E0E]">
                  <span className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] js-mono-label">
                    HARDWARE BENCHMARK
                  </span>
                  <h2
                    id="specs-heading"
                    data-kinetic-headline
                    className="font-display text-3xl sm:text-5xl font-bold uppercase tracking-tight leading-[0.94] text-[#ECE7DF] mt-1.5"
                  >
                    <KineticWords
                      text="PUBLISHED TO THE MILLIGRAM."
                      accentWords={['MILLIGRAM.']}
                    />
                  </h2>
                  <p className="mt-3 text-sm text-[#8A8A85] max-w-2xl leading-relaxed">
                    Every specification is measured on production units pulled from our Rotterdam assembly line—never pre-production prototypes.
                  </p>
                </div>

                <div>
                  {TECHNICAL_SPECS.map((spec) => (
                    <div key={spec.code} className="relative">
                      <div className="js-spec-grid-line h-[1px] w-full bg-[#ECE7DF]/20 origin-left" />
                      <div className="js-spec-row grid grid-cols-1 sm:grid-cols-12 p-3 sm:px-8 sm:py-3 items-baseline gap-2 hover:bg-[#141414] transition-colors">
                        <div className="sm:col-span-4 font-mono text-xs uppercase tracking-wider text-[#8A8A85]">
                          <span className="text-[#FF4D00] mr-2">{spec.code}</span>
                          {spec.label}
                        </div>
                        <div className="sm:col-span-4 font-display text-lg sm:text-xl font-bold uppercase text-[#ECE7DF] tabular-nums">
                          {formatAnimatedSpecValue(spec.code, spec.value)}
                        </div>
                        <div className="sm:col-span-4 font-mono text-xs text-[#8A8A85]">
                          {spec.note}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 sm:px-8 border-t border-[#ECE7DF]/15 bg-[#0E0E0E] flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#8A8A85]">
                  <span>DIMENSIONS: <strong className="text-[#ECE7DF]">188 × 164 × 78 mm</strong></span>
                  <span>FASTENERS: <strong className="text-[#ECE7DF]">14× Stainless Torx T6</strong></span>
                  <span>INPUT: <strong className="text-[#ECE7DF]">USB-C DAC + 3.5mm TRS</strong></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 05: HORIZONTAL-SCROLL EDITORIAL FIELD GALLERY
        =================================================================== */}
        <Suspense fallback={<div className="min-h-[640px]" />}>
          <GallerySection />
        </Suspense>

        {/* ===================================================================
            SECTION 06: CRITICAL FIELD REVIEWS
            (Left 8 Cols = Header + 3 Review Cards | Right 4 Cols = Full-Height 3D Stage Bay)
        =================================================================== */}
        <section
          id="reviews"
          ref={reviewsSectionRef}
          aria-labelledby="reviews-heading"
          className="js-motion-section relative border-b border-[#ECE7DF]/15 bg-transparent"
        >
          <div className="mx-auto max-w-[1440px] border-x border-[#ECE7DF]/15">
            <div className="grid grid-cols-12 border-b border-[#ECE7DF]/15 px-4 py-3 sm:px-8 font-mono text-xs uppercase tracking-widest text-[#8A8A85] bg-[#0E0E0E]/95">
              <div className="col-span-6 sm:col-span-4 text-[#ECE7DF] js-sec-num">
                06 / LONG-TERM FIELD REPORTS
              </div>
              <div className="hidden sm:block sm:col-span-4 text-center js-mono-label">
                UNEDITED OWNER LOGS (250+ HOURS)
              </div>
              <div className="col-span-6 sm:col-span-4 text-right js-mono-label">
                GOTHENBURG · ANTWERP · KYOTO
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left 8 Columns: Title Block + 3 Review Cards (Solid Dark Background, Zero Overlap) */}
              <div className="lg:col-span-8 border-b lg:border-b-0 lg:border-r border-[#ECE7DF]/15 bg-[#0E0E0E]/94 flex flex-col justify-between">
                <div className="p-6 sm:p-8 border-b border-[#ECE7DF]/15 flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-[#0E0E0E]">
                  <h2
                    id="reviews-heading"
                    data-kinetic-headline
                    className="font-display text-3xl sm:text-5xl font-bold uppercase tracking-tight leading-[0.94] text-[#ECE7DF]"
                  >
                    <KineticWords
                      text="ENGINEER & ARCHIVIST LOGS."
                      accentWords={['LOGS.']}
                    />
                  </h2>
                  <p className="font-mono text-xs text-[#8A8A85] max-w-sm">
                    We ask long-term owners to document both what works and one honest physical trade-off of solid aluminium construction.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-6">
                  {REVIEWS.map((rev) => {
                    const tilt = reviewTilts[rev.id] || { rx: 0, ry: 0 };
                    return (
                      <article
                        key={rev.id}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const nx = (e.clientX - rect.left) / rect.width - 0.5;
                          const ny = (e.clientY - rect.top) / rect.height - 0.5;
                          setReviewTilts((prev) => ({
                            ...prev,
                            [rev.id]: { rx: -ny * 6, ry: nx * 6 },
                          }));
                        }}
                        onMouseLeave={() => {
                          setReviewTilts((prev) => ({
                            ...prev,
                            [rev.id]: { rx: 0, ry: 0 },
                          }));
                        }}
                        style={{
                          transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                        }}
                        className="js-review-card p-5 border border-[#ECE7DF]/20 flex flex-col justify-between bg-[#0E0E0E] hover:border-[#FF4D00] transition-transform duration-150 ease-out will-change-transform"
                      >
                        <div>
                          <div className="flex items-center justify-between font-mono text-[11px] text-[#8A8A85] pb-3 border-b border-[#ECE7DF]/15">
                            <span className="text-[#FF4D00]">{rev.indexCode}</span>
                            <span>
                              {rev.hoursLogged}H · {rev.ratingNumeric}
                            </span>
                          </div>

                          <h3 className="font-display text-lg font-bold uppercase text-[#ECE7DF] mt-4 leading-snug">
                            “{rev.headline}”
                          </h3>

                          <p className="mt-3 text-xs sm:text-sm text-[#ECE7DF]/85 leading-relaxed">
                            {rev.body}
                          </p>

                          <p className="mt-3 p-3 border border-[#ECE7DF]/15 bg-[#141414] font-mono text-[11px] text-[#8A8A85] leading-relaxed">
                            {rev.criticalNote}
                          </p>
                        </div>

                        <footer className="mt-5 pt-3 border-t border-[#ECE7DF]/15 font-mono text-[11px]">
                          <div className="font-semibold text-[#ECE7DF] uppercase">
                            {rev.author} — {rev.city}
                          </div>
                          <div className="text-[#8A8A85] mt-0.5">{rev.role}</div>
                          <div className="text-[#8A8A85] mt-0.5">
                            Unit: {rev.finishOwned}
                          </div>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              </div>

              {/* Right 4 Columns: Dedicated Full-Height Unobstructed 3D Owner Inspection Stage Bay */}
              <div
                onPointerDown={handleStagePointerDown}
                data-stage-bay
                data-stage-index="5"
                data-testid="reviews-3d-stage-bay"
                className="lg:col-span-4 min-h-[360px] lg:min-h-full p-6 flex flex-col justify-between bg-transparent cursor-grab active:cursor-grabbing select-none"
              >
                <div className="pointer-events-none flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#8A8A85]">
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#FF4D00]">
                    STAGE 06 · ARCHIVE INSPECTION
                  </span>
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20">
                    250+ HRS LOGGED
                  </span>
                </div>

                <div className="pointer-events-none flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#8A8A85]">
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#ECE7DF]">
                    ZERO CREAK · 10,000 CYCLES
                  </span>
                  <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#FF4D00]">
                    4.9 / 5.0 AVG
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 07: BUY / REQUISITION BREAKDOWN
            (3-Column Split: Left 4 Cols Headline/Finish | Middle 4 Cols 360° 3D Pedestal Bay | Right 4 Cols BOM & CTA)
        =================================================================== */}
        <section
          id="buy"
          ref={buySectionRef}
          aria-labelledby="buy-heading"
          className="js-motion-section relative border-b border-[#0E0E0E]/15 bg-transparent text-[#0E0E0E] transition-colors lg:min-h-[820px]"
        >
          <div className="mx-auto max-w-[1440px] border-x border-current/15 lg:min-h-[820px] flex flex-col">
            <div className="grid grid-cols-12 border-b border-current/15 px-4 py-3 sm:px-8 font-mono text-xs uppercase tracking-widest bg-[#ECE7DF]/95">
              <div className="col-span-6 sm:col-span-4 font-semibold js-sec-num">
                07 / DIRECT ALLOCATION
              </div>
              <div className="hidden sm:block sm:col-span-4 text-center js-mono-label">
                BATCH 04 · KEILEWERF ROTTERDAM
              </div>
              <div className="col-span-6 sm:col-span-4 text-right font-semibold text-[#FF4D00] js-mono-label">
                $349 USD COMPLETE KIT
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
              {/* Left 4 Columns: Allocation Headline & 3-Finish Switcher (Solid Bone Backdrop, Zero Overlap) */}
              <div className="lg:col-span-4 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-current/15 flex flex-col justify-between bg-[#ECE7DF]/95">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-semibold js-mono-label">
                    STUDIO KINETIC DIRECT-TO-ENGINEER
                  </span>
                  <h2
                    id="buy-heading"
                    data-kinetic-headline
                    className="font-display text-3xl sm:text-4xl xl:text-5xl font-bold uppercase tracking-tight leading-[0.92] mt-2"
                  >
                    <KineticWords
                      text="BUILT TO OUTLIVE FIVE PHONE UPGRADES."
                      accentWords={['OUTLIVE']}
                    />
                  </h2>
                  <p className="mt-4 text-sm opacity-85 leading-relaxed">
                    Every AURA ONE ships in a recycled ballistic-nylon field sleeve with a braided 1.5m USB-C DAC cable, 3.5mm studio adapter, and a stainless steel Torx T6 service key.
                  </p>

                  {/* Finish Switcher inside Section 07 synced with state */}
                  <div className="mt-6">
                    <div className="font-mono text-xs uppercase tracking-widest opacity-75 mb-2.5">
                      CHOOSE FINISH FOR DISPATCH:
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {FINISH_LIST.map((finish) => {
                        const active = finish.id === selectedFinishId;
                        return (
                          <button
                            key={finish.id}
                            type="button"
                            onClick={() => setSelectedFinishId(finish.id)}
                            className={`p-3 border text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                              active
                                ? 'border-[#0E0E0E] bg-[#0E0E0E] text-[#ECE7DF]'
                                : 'border-current/30 bg-[#ECE7DF] text-[#0E0E0E] hover:border-[#0E0E0E]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="w-4 h-4 border border-current shrink-0"
                                style={{ backgroundColor: finish.swatchHex }}
                                aria-hidden="true"
                              />
                              <span className="font-mono text-xs font-bold uppercase">
                                {finish.name}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] opacity-75">
                              {finish.code} · ${finish.price}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-current/15 font-mono text-[11px] opacity-85">
                  3-YEAR WARRANTY · 10-YEAR PARTS GUARANTEE
                </div>
              </div>

              {/* Middle 4 Columns: Dedicated Full-Height 360° 3D Finale Pedestal Stage Bay */}
              <div
                onPointerDown={handleStagePointerDown}
                data-stage-bay
                data-stage-index="6"
                data-testid="buy-3d-stage-bay"
                className="lg:col-span-4 min-h-[380px] lg:min-h-[775px] p-6 border-b lg:border-b-0 lg:border-r border-current/15 flex flex-col justify-between bg-transparent cursor-grab active:cursor-grabbing select-none"
              >
                <div className="pointer-events-none flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider">
                  <span className="px-2.5 py-1 border border-[#0E0E0E]/25 bg-[#0E0E0E] text-[#ECE7DF]">
                    STAGE 07 · 360° HERO FINALE
                  </span>
                  <span className="px-2.5 py-1 border border-[#0E0E0E]/25 bg-[#ECE7DF]/90 text-[#FF4D00] font-semibold">
                    {selectedFinish.name}
                  </span>
                </div>

                <div className="pointer-events-none flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider">
                  <span className="px-2.5 py-1 border border-[#0E0E0E]/25 bg-[#ECE7DF]/90 text-[#0E0E0E]">
                    {selectedFinish.code} · DRAG TO ORBIT
                  </span>
                  <span className="px-2.5 py-1 border border-[#0E0E0E]/25 bg-[#0E0E0E] text-[#FF4D00] font-semibold">
                    IN STOCK
                  </span>
                </div>
              </div>

              {/* Right 4 Columns: Bill of Materials Ledger & Add to Cart CTA */}
              <div className="lg:col-span-4 p-6 sm:p-8 bg-[#E3DDD3]/96 text-[#0E0E0E] flex flex-col justify-between">
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-[#0E0E0E]/70 pb-3 border-b border-[#0E0E0E]/15">
                    BILL OF MATERIALS &amp; PRICE BREAKDOWN
                  </div>

                  <dl className="mt-4 space-y-3 font-mono text-xs">
                    <div className="js-bom-row flex justify-between gap-2">
                      <dt className="text-[#0E0E0E]/75">
                        AURA ONE Chassis ({selectedFinish.name})
                      </dt>
                      <dd className="font-semibold tabular-nums">$245.00</dd>
                    </div>
                    <div className="js-bom-row flex justify-between gap-2">
                      <dt className="text-[#0E0E0E]/75">
                        Matched Pair 40mm Biocellulose Drivers
                      </dt>
                      <dd className="font-semibold tabular-nums">$58.00</dd>
                    </div>
                    <div className="js-bom-row flex justify-between gap-2">
                      <dt className="text-[#0E0E0E]/75">
                        Aniline Lambskin Magnetic Cushions
                      </dt>
                      <dd className="font-semibold tabular-nums">$29.00</dd>
                    </div>
                    <div className="js-bom-row flex justify-between gap-2">
                      <dt className="text-[#0E0E0E]/75">
                        Torx T6 Tool + Braided USB-C DAC Cable
                      </dt>
                      <dd className="font-semibold tabular-nums">$17.00</dd>
                    </div>
                    <div className="js-bom-row flex justify-between gap-2">
                      <dt className="text-[#0E0E0E]/75">
                        Tracked Courier from Rotterdam
                      </dt>
                      <dd className="font-semibold">INCLUDED</dd>
                    </div>
                    <div className="js-bom-row flex justify-between pt-4 border-t border-[#0E0E0E]/20 text-base font-bold">
                      <dt>TOTAL DIRECT PRICE</dt>
                      <dd className="tabular-nums">${selectedFinish.price}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    data-testid="footer-add-to-cart"
                    onClick={() => handleAddToCart(selectedFinishId)}
                    className="w-full py-4 bg-[#0E0E0E] text-[#ECE7DF] hover:bg-[#FF4D00] hover:text-[#0E0E0E] font-mono text-xs sm:text-sm font-bold uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Add to Cart — {selectedFinish.name} (${selectedFinish.price})
                  </button>
                  <p className="font-mono text-[11px] text-[#0E0E0E]/75 text-center">
                    {PRODUCT_CONSTANTS.SHIPPING_NOTE} · Duties included for EU, UK, US &amp; JP
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===================================================================
          MINIMAL INDUSTRIAL FOOTER
      =================================================================== */}
      <footer className="relative z-10 bg-[#0E0E0E]/95 text-[#8A8A85] font-mono text-xs">
        <div className="mx-auto max-w-[1440px] border-x border-[#ECE7DF]/15 px-4 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-[#ECE7DF] font-semibold">
            STUDIO KINETIC GMBH · {PRODUCT_CONSTANTS.ORIGIN_STAMP}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#design" className="hover:text-[#ECE7DF] transition-colors">
              02 Assembly
            </a>
            <a href="#sound" className="hover:text-[#ECE7DF] transition-colors">
              03 Acoustics
            </a>
            <a href="#specs" className="hover:text-[#ECE7DF] transition-colors">
              04 Datasheet
            </a>
            <a href="#gallery" className="hover:text-[#ECE7DF] transition-colors">
              05 Field Archive
            </a>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="text-[#FF4D00] hover:underline uppercase cursor-pointer"
            >
              Cart [{cartTotals.totalCount}]
            </button>
          </div>
        </div>
      </footer>

      {/* Slide-out Cart Drawer */}
      <Suspense fallback={null}>
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onAddSpareCushion={handleAddSpareCushion}
          onClearCart={handleClearCart}
        />
      </Suspense>
    </div>
  );
}
