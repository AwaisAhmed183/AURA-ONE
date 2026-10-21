import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GALLERY_ITEMS, GalleryItem } from '../data/productData';

gsap.registerPlugin(ScrollTrigger);

function renderEditorialPlateDataUrl(theme: GalleryItem['sceneTheme']): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grad = ctx.createLinearGradient(0, 0, 960, 600);
  if (theme === 'berlin-console') {
    grad.addColorStop(0, '#141312');
    grad.addColorStop(0.5, '#23201c');
    grad.addColorStop(1, '#0e0e0e');
  } else if (theme === 'osaka-cnc') {
    grad.addColorStop(0, '#121518');
    grad.addColorStop(0.6, '#24272a');
    grad.addColorStop(1, '#101112');
  } else if (theme === 'tokyo-bar') {
    grad.addColorStop(0, '#1b1410');
    grad.addColorStop(0.55, '#2b1e16');
    grad.addColorStop(1, '#0f0c0a');
  } else {
    grad.addColorStop(0, '#141413');
    grad.addColorStop(0.5, '#1e1e1c');
    grad.addColorStop(1, '#0c0c0c');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 600);

  ctx.strokeStyle = 'rgba(236, 231, 223, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 60; x < 960; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 600);
    ctx.stroke();
  }
  for (let y = 60; y < 600; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(960, y);
    ctx.stroke();
  }

  const spot = ctx.createRadialGradient(520, 280, 20, 520, 280, 380);
  spot.addColorStop(0, 'rgba(255, 77, 0, 0.22)');
  spot.addColorStop(0.5, 'rgba(236, 231, 223, 0.06)');
  spot.addColorStop(1, 'rgba(14, 14, 14, 0)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, 960, 600);

  ctx.save();
  if (theme === 'berlin-console') {
    ctx.fillStyle = '#1b1a18';
    ctx.fillRect(80, 340, 800, 200);
    ctx.strokeStyle = 'rgba(236, 231, 223, 0.28)';
    ctx.strokeRect(80, 340, 800, 200);

    [220, 440].forEach((vx) => {
      ctx.fillStyle = '#2a241b';
      ctx.fillRect(vx, 180, 160, 110);
      ctx.strokeStyle = '#ECE7DF';
      ctx.strokeRect(vx, 180, 160, 110);
      ctx.beginPath();
      ctx.arc(vx + 80, 275, 65, Math.PI * 1.15, Math.PI * 1.85);
      ctx.strokeStyle = '#FF4D00';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(vx + 80, 275);
      ctx.lineTo(vx + 115, 205);
      ctx.strokeStyle = '#ECE7DF';
      ctx.stroke();
    });

    for (let f = 0; f < 12; f++) {
      const fx = 130 + f * 58;
      ctx.strokeStyle = 'rgba(236, 231, 223, 0.25)';
      ctx.beginPath();
      ctx.moveTo(fx, 370);
      ctx.lineTo(fx, 500);
      ctx.stroke();
      const knobY = 395 + ((f * 29) % 75);
      ctx.fillStyle = f === 4 ? '#FF4D00' : '#ECE7DF';
      ctx.fillRect(fx - 8, knobY, 16, 22);
    }
  } else if (theme === 'osaka-cnc') {
    ctx.strokeStyle = '#ECE7DF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(480, 300, 155, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#FF4D00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(480, 300, 110, 0, Math.PI * 2);
    ctx.stroke();

    for (let a = 0; a < 36; a++) {
      const rad = (a * Math.PI * 2) / 36;
      ctx.strokeStyle = 'rgba(236, 231, 223, 0.55)';
      ctx.beginPath();
      ctx.moveTo(480 + Math.cos(rad) * 155, 300 + Math.sin(rad) * 155);
      ctx.lineTo(480 + Math.cos(rad) * 172, 300 + Math.sin(rad) * 172);
      ctx.stroke();
    }
  } else if (theme === 'tokyo-bar') {
    for (let row = 0; row < 3; row++) {
      for (let s = 0; s < 28; s++) {
        ctx.fillStyle = s % 5 === 0 ? 'rgba(255, 77, 0, 0.35)' : 'rgba(236, 231, 223, 0.14)';
        ctx.fillRect(90 + s * 28, 80 + row * 140, 18, 115);
      }
    }
    ctx.strokeStyle = '#ECE7DF';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(480, 320, 130, Math.PI, 0);
    ctx.stroke();

    ctx.fillStyle = '#ECE7DF';
    ctx.beginPath();
    ctx.ellipse(350, 360, 42, 68, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(610, 360, 42, 68, -0.15, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const parts = [
      { x: 220, y: 220, r: 72, label: '02 CUSHION' },
      { x: 480, y: 220, r: 58, label: '03 40MM DRIVER' },
      { x: 740, y: 220, r: 76, label: '04 ANODIZED CUP' },
      { x: 340, y: 420, r: 46, label: '07 POGO RING' },
      { x: 620, y: 420, r: 34, label: '05 ENCODER DIAL' },
    ];
    parts.forEach((p, idx) => {
      ctx.strokeStyle = idx === 1 ? '#FF4D00' : '#ECE7DF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(236, 231, 223, 0.25)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#8A8A85';
      ctx.font = '12px monospace';
      ctx.fillText(p.label, p.x - 42, p.y + p.r + 24);
    });
  }
  ctx.restore();

  // Technical film border stamp
  ctx.fillStyle = '#8A8A85';
  ctx.font = '13px monospace';
  ctx.fillText(`STUDIO KINETIC ARCHIVE · ${theme.toUpperCase()}`, 32, 42);
  ctx.fillStyle = '#FF4D00';
  ctx.fillText('35MM KODAK TRI-X · VERIFIED PLATE', 680, 42);

  return canvas.toDataURL('image/jpeg', 0.9);
}

export const GallerySection: React.FC = () => {
  const [fallbackPlates, setFallbackPlates] = useState<Record<string, string>>({});
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const [horizontalProgress, setHorizontalProgress] = useState(0);

  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const generated: Record<string, string> = {};
    for (const item of GALLERY_ITEMS) {
      generated[item.id] = renderEditorialPlateDataUrl(item.sceneTheme);
    }
    setFallbackPlates(generated);
  }, []);

  // ST #9: Pinned Horizontal Scroll Gallery (Desktop) + Inner Image Parallax & Clip-Path Reveal
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const ctx = gsap.context(() => {
      const words = section.querySelectorAll('.js-kinetic-word');
      if (words.length > 0) {
        gsap.fromTo(
          words,
          { yPercent: 85 },
          {
            yPercent: 0,
            stagger: 0.015,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 92%',
              end: 'top 55%',
              scrub: 0.25,
            },
          }
        );
      }

      const mm = gsap.matchMedia();

      // Desktop: Horizontal scroll filmstrip scrubbed smoothly across Section 05 without pin-spacer gaps
      mm.add('(min-width: 768px)', () => {
        const getScrollDistance = () =>
          Math.max(180, Math.min(480, track.scrollWidth - track.parentElement!.clientWidth));

        gsap.to(track, {
          x: () => -getScrollDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            end: 'bottom 15%',
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              setHorizontalProgress(Math.round(self.progress * 100));
            },
          },
        });

        // Inner image parallax & clip-path curtain reveal across the horizontal scroll
        const cards = gsap.utils.toArray<HTMLElement>('.js-gallery-card');
        cards.forEach((card) => {
          const img = card.querySelector('.js-gallery-img');
          const revealBox = card.querySelector('.js-gallery-clip');

          if (revealBox) {
            gsap.fromTo(
              revealBox,
              { clipPath: 'inset(4% 10% 4% 0%)' },
              {
                clipPath: 'inset(0% 0% 0% 0%)',
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: section,
                  start: 'top 90%',
                  end: 'top 50%',
                  scrub: 0.4,
                },
              }
            );
          }

          if (img) {
            gsap.fromTo(
              img,
              { xPercent: -6, scale: 1.08 },
              {
                xPercent: 6,
                scale: 1.01,
                ease: 'none',
                scrollTrigger: {
                  trigger: section,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 0.8,
                },
              }
            );
          }
        });
      });

      // Mobile (< 768px): Vertical clip-path + parallax reveals without horizontal overflow
      mm.add('(max-width: 767px)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('.js-gallery-card');
        cards.forEach((card) => {
          const revealBox = card.querySelector('.js-gallery-clip');
          if (revealBox) {
            gsap.fromTo(
              revealBox,
              { clipPath: 'inset(8% 8% 8% 8%)', y: 24 },
              {
                clipPath: 'inset(0% 0% 0% 0%)',
                y: 0,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: card,
                  start: 'top 90%',
                  end: 'top 50%',
                  scrub: 0.5,
                },
              }
            );
          }
        });
      });
    }, section);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="gallery"
      ref={sectionRef}
      aria-labelledby="gallery-heading"
      className="js-motion-section relative z-10 border-b border-[#ECE7DF]/15 bg-transparent overflow-hidden"
    >
      <div className="mx-auto max-w-[1440px] border-x border-[#ECE7DF]/15">
        {/* Section Index Header */}
        <div className="grid grid-cols-12 border-b border-[#ECE7DF]/15 px-4 py-3 sm:px-8 font-mono text-xs uppercase tracking-widest text-[#8A8A85] bg-[#0E0E0E]/95">
          <div className="col-span-6 sm:col-span-4 text-[#ECE7DF] js-sec-num">
            05 / FIELD DOCUMENTATION
          </div>
          <div className="hidden sm:block sm:col-span-5 js-mono-label">
            HORIZONTAL FILMSTRIP · BERLIN · OSAKA · TOKYO · ROTTERDAM
          </div>
          <div className="col-span-6 sm:col-span-3 text-right text-[#FF4D00] js-mono-label">
            REEL SCRUB: {horizontalProgress}%
          </div>
        </div>

        {/* 12-Column Split: Left 8 Cols = Title + Horizontal Filmstrip | Right 4 Cols = Full-Height 3D Field Rig Stage Bay */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-8 border-b lg:border-b-0 lg:border-r border-[#ECE7DF]/15 bg-[#0E0E0E]/94 overflow-hidden flex flex-col justify-between">
            <div className="p-6 sm:p-8 border-b border-[#ECE7DF]/15 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2
                  id="gallery-heading"
                  data-kinetic-headline
                  className="font-display text-3xl sm:text-5xl font-bold uppercase tracking-tight leading-[0.92] text-[#ECE7DF]"
                >
                  {'BUILT FOR MASTERING ROOMS, MILLING BENCHES, AND NIGHT TRAINS.'
                    .split(' ')
                    .map((w, i) => (
                      <span
                        key={i}
                        className="inline-block overflow-hidden align-bottom mr-[0.24em] pb-[0.04em]"
                      >
                        <span
                          className={`js-kinetic-word inline-block will-change-transform ${
                            w === 'NIGHT' || w === 'TRAINS.' ? 'text-[#FF4D00]' : ''
                          }`}
                        >
                          {w}
                        </span>
                      </span>
                    ))}
                </h2>
              </div>
              <p className="font-mono text-xs text-[#8A8A85] max-w-xs shrink-0 leading-relaxed">
                Every AURA ONE unit is serialized on the inner yoke and stress-tested for 48 hours in Rotterdam prior to dispatch.
              </p>
            </div>

            {/* Horizontal Filmstrip Track on Desktop / Vertical Stack on Mobile */}
            <div className="py-6 px-4 sm:px-8 overflow-hidden">
              <div
                ref={trackRef}
                data-testid="gallery-horizontal-track"
                className="flex flex-col md:flex-row gap-5 w-full md:w-max"
              >
                {GALLERY_ITEMS.map((item) => {
                  const useFallback = failedUrls[item.id];
                  const activeSrc =
                    useFallback && fallbackPlates[item.id]
                      ? fallbackPlates[item.id]
                      : item.unsplashUrl;

                  return (
                    <figure
                      key={item.id}
                      className="js-gallery-card w-full md:w-[390px] lg:w-[420px] shrink-0 border border-[#ECE7DF]/20 bg-[#0E0E0E] flex flex-col justify-between overflow-hidden"
                    >
                      {/* Clip-Path Reveal & Inner Parallax Image Container */}
                      <div className="js-gallery-clip relative w-full h-[220px] sm:h-[250px] overflow-hidden bg-[#141414]">
                        {activeSrc && (
                          <img
                            src={activeSrc}
                            data-unsplash-source={item.unsplashUrl}
                            alt={`${item.location} — ${item.caption}`}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            onError={() => {
                              if (!failedUrls[item.id]) {
                                setFailedUrls((prev) => ({ ...prev, [item.id]: true }));
                              }
                            }}
                            className="js-gallery-img w-full h-full object-cover object-center filter contrast-105 will-change-transform"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-[#0E0E0E]/20 to-transparent" />

                        {/* Top Coordinate Stamp */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[#ECE7DF]">
                          <span className="bg-[#0E0E0E]/90 px-2 py-0.5 border border-[#ECE7DF]/20">
                            {item.indexCode} · {item.location}
                          </span>
                          <span className="hidden sm:inline-block bg-[#0E0E0E]/90 px-2 py-0.5 border border-[#ECE7DF]/20 text-[#8A8A85]">
                            {item.coordinates}
                          </span>
                        </div>
                      </div>

                      {/* Specific Situation Caption Footer */}
                      <figcaption className="p-4 sm:p-5 bg-[#0E0E0E] border-t border-[#ECE7DF]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-xs sm:text-sm text-[#ECE7DF] font-medium">
                            {item.caption}
                          </p>
                          <p className="font-mono text-[11px] text-[#8A8A85] mt-1">
                            {item.technicalNote}
                          </p>
                        </div>
                        <span className="font-mono text-[11px] text-[#FF4D00] uppercase shrink-0">
                          [RAW PLATE]
                        </span>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 4 Columns: Dedicated Full-Height Unobstructed 3D Field Rig Stage Bay */}
          <div
            data-stage-bay
            data-stage-index="4"
            data-testid="gallery-3d-stage-bay"
            className="lg:col-span-4 min-h-[360px] lg:min-h-full p-6 flex flex-col justify-between bg-transparent select-none"
          >
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#8A8A85]">
              <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#FF4D00]">
                STAGE 05 · FIELD RIG OFFSET
              </span>
              <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20">
                SERIALIZED YOKE
              </span>
            </div>

            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#8A8A85]">
              <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#ECE7DF]">
                48H ROTTERDAM QA LOG
              </span>
              <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#FF4D00]">
                PASS · 254G
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
