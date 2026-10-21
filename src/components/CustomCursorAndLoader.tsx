import React, { useEffect, useRef, useState } from 'react';

interface PageLoaderProps {
  isReady?: boolean;
  onComplete?: () => void;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  isReady = false,
  onComplete,
}) => {
  const [hidden, setHidden] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1' || isReady;
  });

  useEffect(() => {
    if (isReady && !hidden) {
      setHidden(true);
      onComplete?.();
    }
  }, [isReady, hidden, onComplete]);

  if (hidden) return null;

  return (
    <div
      data-testid="page-loader"
      aria-hidden="true"
      className="fixed inset-0 z-[100] bg-[#0E0E0E] text-[#ECE7DF] flex flex-col justify-between p-6 sm:p-12 border border-[#ECE7DF]/20 pointer-events-none"
    >
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-[#8A8A85]">
        <span>STUDIO KINETIC · OSAKA · BERLIN</span>
        <span>CAD GEOMETRY INITIALIZATION</span>
      </div>

      <div className="my-auto">
        <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] mb-2">
          CALIBRATING 40MM BIOCELLULOSE TRANSDUCER
        </div>
        <div className="font-display text-4xl sm:text-6xl font-bold uppercase tracking-tight text-[#ECE7DF]">
          INITIALIZING 3D ACOUSTIC RIG
        </div>
        <div className="w-full max-w-md h-[2px] bg-[#ECE7DF]/20 mt-4 overflow-hidden">
          <div className="h-full w-1/2 bg-[#FF4D00] animate-pulse" />
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-xs uppercase text-[#8A8A85]">
        <span>AURA ONE · REF. SK-A1</span>
        <span>254 GRAMS · $349</span>
      </div>
    </div>
  );
};

export const CustomCursorAndProgress: React.FC = () => {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    const reduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setEnabled(!isHeadless && !isMobile && !reduced);

    const handleScroll = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollRatio(Math.min(1, Math.max(0, window.scrollY / docHeight)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
      const target = e.target as HTMLElement | null;
      const interactive = Boolean(
        target?.closest('button, a, [role="button"], input, select')
      );
      setIsHoveringInteractive(interactive);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  return (
    <>
      {/* Top Scroll Progress Line */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-[#ECE7DF]/10 pointer-events-none"
      >
        <div
          className="h-full bg-[#FF4D00] origin-left transition-transform duration-75"
          style={{ transform: `scaleX(${scrollRatio})` }}
        />
      </div>

      {/* Subtle SVG Film Grain Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[55] opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Custom Cursor Dot (Desktop only) */}
      {enabled && (
        <div
          ref={dotRef}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-[90] -ml-2 -mt-2 transition-transform duration-75 ease-out"
        >
          <div
            className={`w-4 h-4 border border-[#FF4D00] transition-transform duration-150 ${
              isHoveringInteractive
                ? 'scale-[2.2] bg-[#FF4D00]/25'
                : 'scale-100 bg-[#FF4D00]'
            }`}
          />
        </div>
      )}
    </>
  );
};

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.18;
    const dy = (e.clientY - cy) * 0.18;
    setOffset({ x: dx, y: dy });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
      className={`transition-transform duration-150 ease-out ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
