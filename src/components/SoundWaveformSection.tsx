import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type BandMode = 'full' | 'sub' | 'mids' | 'air';

interface BandSpec {
  id: BandMode;
  label: string;
  range: string;
  gainNote: string;
  freqHz: number;
  description: string;
}

const BAND_SPECS: BandSpec[] = [
  {
    id: 'full',
    label: 'Full Reference Sweep',
    range: '6Hz – 38kHz',
    gainNote: '+3dB Sub Shelf / Flat Mids',
    freqHz: 110,
    description:
      'Complete acoustic transfer function measured on a B&K 5128 head-and-torso simulator. Zero artificial 8kHz sibilance spike.',
  },
  {
    id: 'sub',
    label: 'Sub-Bass Shelf',
    range: '6Hz – 60Hz',
    gainNote: '+3.0dB Low-Q Shelf',
    freqHz: 55,
    description:
      'Dual Helmholtz chamber ports extend sub-bass excursion down to 6Hz without bleeding into the 120Hz upper-bass punch.',
  },
  {
    id: 'mids',
    label: 'Reference Midrange',
    range: '200Hz – 4kHz',
    gainNote: '±0.4dB Flat Target',
    freqHz: 220,
    description:
      'The 40mm bacterial biocellulose dome tracks vocal fundamentals and snare transients without paper cone breakup.',
  },
  {
    id: 'air',
    label: 'Ultrasonic Air Band',
    range: '10kHz – 38kHz',
    gainNote: 'LDAC 990kbps Extended',
    freqHz: 440,
    description:
      'Low-mass copper-clad aluminium voice coil preserves room decay and cymbal air well past the 20kHz human threshold.',
  },
];

interface SoundWaveformSectionProps {
  soundPulseRef?: React.MutableRefObject<number>;
  onDriverPulse?: (amplitude: number) => void;
}

export const SoundWaveformSection: React.FC<SoundWaveformSectionProps> = ({
  soundPulseRef,
  onDriverPulse,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBand, setActiveBand] = useState<BandMode>('full');
  const [ancEnabled, setAncEnabled] = useState(true);
  const [dbReadout, setDbReadout] = useState('-14.2 dBFS');

  // Animated count-up state for frequency numbers
  const [countLowHz, setCountLowHz] = useState(6);
  const [countHighKhz, setCountHighKhz] = useState(38);
  const [countHighFullHz, setCountHighFullHz] = useState(38000);
  const [countMatchDb, setCountMatchDb] = useState('0.5');

  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollDrawProgressRef = useRef<number>(0.25);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscNodesRef = useRef<{
    osc1?: OscillatorNode;
    osc2?: OscillatorNode;
    gain?: GainNode;
    analyser?: AnalyserNode;
  }>({});

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const activeBandRef = useRef(activeBand);
  activeBandRef.current = activeBand;

  const ancEnabledRef = useRef(ancEnabled);
  ancEnabledRef.current = ancEnabled;

  const emitPulse = (amp: number) => {
    if (soundPulseRef) {
      soundPulseRef.current = amp;
    }
    onDriverPulse?.(amp);
  };
  const onDriverPulseRef = useRef(emitPulse);
  onDriverPulseRef.current = emitPulse;

  const stopAudio = () => {
    try {
      if (oscNodesRef.current.gain && audioCtxRef.current) {
        oscNodesRef.current.gain.gain.setTargetAtTime(
          0.0001,
          audioCtxRef.current.currentTime,
          0.04
        );
      }
      setTimeout(() => {
        try {
          oscNodesRef.current.osc1?.stop();
          oscNodesRef.current.osc2?.stop();
          oscNodesRef.current.osc1?.disconnect();
          oscNodesRef.current.osc2?.disconnect();
        } catch {
          // ignore if already stopped
        }
        oscNodesRef.current = {};
      }, 60);
    } catch {
      // ignore audio context teardown errors
    }
  };

  const startAudio = (band: BandMode) => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      stopAudio();

      const spec = BAND_SPECS.find((b) => b.id === band) || BAND_SPECS[0];
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(spec.freqHz, ctx.currentTime);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(spec.freqHz * 1.5, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.12);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      osc1.start();
      osc2.start();

      oscNodesRef.current = { osc1, osc2, gain, analyser };
    } catch {
      // Visual waveform still runs even if WebAudio is blocked by browser autoplay policy
    }
  };

  const handleTogglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    if (next) {
      startAudio(activeBand);
      setDbReadout('-03.0 dBFS · ACTIVE');
      onDriverPulseRef.current?.(1.0);
    } else {
      stopAudio();
      setDbReadout('-60.0 dBFS · IDLE');
      onDriverPulseRef.current?.(0.2);
    }
  };

  const handleBandSelect = (band: BandMode) => {
    setActiveBand(band);
    if (isPlaying && oscNodesRef.current.osc1 && audioCtxRef.current) {
      const spec = BAND_SPECS.find((b) => b.id === band) || BAND_SPECS[0];
      oscNodesRef.current.osc1.frequency.setTargetAtTime(
        spec.freqHz,
        audioCtxRef.current.currentTime,
        0.05
      );
      oscNodesRef.current.osc2?.frequency.setTargetAtTime(
        spec.freqHz * 1.5,
        audioCtxRef.current.currentTime,
        0.05
      );
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // GSAP ScrollTriggers for Section 03 Sound:
  // 1) Scrubbed left-to-right waveform draw + 3D driver pulse
  // 2) Frequency numbers count-up ("6HZ–38KHZ", "38,000 Hz", "±0.5 dB")
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      scrollDrawProgressRef.current = 1;
      return;
    }

    const ctx = gsap.context(() => {
      const words = el.querySelectorAll('.js-kinetic-word');
      if (words.length > 0) {
        gsap.fromTo(
          words,
          { yPercent: 85 },
          {
            yPercent: 0,
            stagger: 0.015,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 92%',
              end: 'top 55%',
              scrub: 0.25,
            },
          }
        );
      }

      // ST #4: Scrubbed waveform draw left-to-right across Section 03
      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        end: 'bottom 30%',
        scrub: 0.7,
        onUpdate: (self) => {
          const drawP = Math.max(0.12, Math.min(1, self.progress * 1.25));
          scrollDrawProgressRef.current = drawP;
          if (!isPlayingRef.current) {
            onDriverPulseRef.current?.(Math.sin(self.progress * Math.PI) * 0.85);
          }
        },
      });

      // ST #5: Numeric count-up on frequency metrics when entering Section 03
      const counterObj = { progress: 0 };
      gsap.fromTo(
        counterObj,
        { progress: 0 },
        {
          progress: 1,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 75%',
            end: 'top 25%',
            scrub: 0.8,
          },
          onUpdate: () => {
            const p = counterObj.progress;
            setCountLowHz(Math.max(1, Math.round(6 * p)));
            setCountHighKhz(Math.max(1, Math.round(38 * p)));
            setCountHighFullHz(Math.round(38000 * p));
            setCountMatchDb((0.5 * p).toFixed(1));
          },
        }
      );
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    let animId = 0;
    let phase = 0;
    let lastFrame = 0;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(300, Math.floor(rect.width * dpr));
      canvas.height = Math.max(220, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const renderFrame = (now: number) => {
      animId = requestAnimationFrame(renderFrame);
      if (isHeadless && now - lastFrame < 64) return;
      lastFrame = now;

      const width = canvas.clientWidth || 600;
      const height = canvas.clientHeight || 300;
      const playing = isPlayingRef.current;
      const band = activeBandRef.current;
      const anc = ancEnabledRef.current;
      const drawRatio = playing ? 1.0 : scrollDrawProgressRef.current;
      const maxDrawX = Math.max(24, width * drawRatio);

      phase += playing ? 0.095 : 0.032;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(14, 14, 14, 0.72)';
      ctx.fillRect(0, 0, width, height);

      // Draw technical grid lines
      ctx.strokeStyle = 'rgba(236, 231, 223, 0.08)';
      ctx.lineWidth = 1;
      const cols = 12;
      const rows = 6;
      for (let c = 1; c < cols; c++) {
        const x = (width / cols) * c;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let r = 1; r < rows; r++) {
        const y = (height / rows) * r;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw 0dB Reference Horizontal Line
      const midY = height * 0.52;
      ctx.strokeStyle = 'rgba(236, 231, 223, 0.24)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(maxDrawX, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Target Frequency Response Curve (draws left-to-right with scroll)
      ctx.strokeStyle = 'rgba(236, 231, 223, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= maxDrawX; x += 4) {
        const normX = x / width;
        const subShelf = normX < 0.28 ? Math.cos((normX / 0.28) * (Math.PI / 2)) * 28 : 0;
        const airRoll = normX > 0.82 ? ((normX - 0.82) / 0.18) * 14 : 0;
        const y = midY - subShelf + airRoll;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Live Oscilloscope Waveform (draws left-to-right on scroll AND pulses with Play/Scroll)
      const ampBase = playing ? 48 : 16 + drawRatio * 18;
      const freqMult =
        band === 'sub' ? 1.8 : band === 'mids' ? 4.2 : band === 'air' ? 8.5 : 3.2;

      ctx.strokeStyle = '#FF4D00';
      ctx.lineWidth = playing ? 2.5 : 2.0;
      ctx.beginPath();

      let tipY = midY;
      for (let x = 0; x <= maxDrawX; x += 2) {
        const normX = x / width;
        const windowEnv = Math.sin(normX * Math.PI);

        let bandBoost = 1.0;
        if (band === 'sub') bandBoost = normX < 0.35 ? 1.55 : 0.35;
        if (band === 'mids') bandBoost = normX >= 0.25 && normX <= 0.75 ? 1.45 : 0.35;
        if (band === 'air') bandBoost = normX > 0.65 ? 1.65 : 0.35;

        const harmonic1 = Math.sin(normX * Math.PI * 2 * freqMult - phase);
        const harmonic2 =
          0.42 * Math.sin(normX * Math.PI * 4 * freqMult + phase * 1.35);
        const harmonic3 =
          playing ? 0.22 * Math.cos(normX * Math.PI * 9 - phase * 2.1) : 0;

        const noiseFloor = !anc
          ? Math.sin(x * 1.7 + phase * 5) * 6 + Math.cos(x * 0.9 - phase * 3) * 4
          : 0;

        const yOffset =
          (harmonic1 + harmonic2 + harmonic3) * ampBase * windowEnv * bandBoost +
          noiseFloor;

        const y = midY + yOffset;
        tipY = y;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw leading draw-head reticle at the tip of the scrubbed waveform
      ctx.fillStyle = '#FF4D00';
      ctx.fillRect(maxDrawX - 3, tipY - 3, 6, 6);

      // Draw Frequency Axis Markers at bottom
      ctx.fillStyle = '#8A8A85';
      ctx.font = '10px "JetBrains Mono", monospace';
      const markers = [
        { pos: 0.04, text: '6Hz' },
        { pos: 0.18, text: '60Hz (+3dB)' },
        { pos: 0.42, text: '500Hz' },
        { pos: 0.64, text: '2kHz (FLAT)' },
        { pos: 0.82, text: '16kHz' },
        { pos: 0.93, text: '38kHz' },
      ];
      markers.forEach((m) => {
        ctx.fillText(m.text, m.pos * width, height - 10);
      });
    };

    animId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const currentBandSpec = BAND_SPECS.find((b) => b.id === activeBand) || BAND_SPECS[0];

  return (
    <section
      id="sound"
      ref={sectionRef}
      aria-labelledby="sound-heading"
      className="js-motion-section relative z-10 border-b border-[#ECE7DF]/15 bg-transparent overflow-hidden"
    >
      <div className="mx-auto max-w-[1440px] border-x border-[#ECE7DF]/15">
        {/* Section Header Bar */}
        <div className="grid grid-cols-12 border-b border-[#ECE7DF]/15 px-4 py-3 sm:px-8 font-mono text-xs uppercase tracking-widest text-[#8A8A85] bg-[#0E0E0E]/95">
          <div className="col-span-6 sm:col-span-3 text-[#ECE7DF] js-sec-num">
            03 / ACOUSTIC LAB
          </div>
          <div className="hidden sm:block sm:col-span-6 js-mono-label">
            B&amp;K 5128 DIFFUSE-FIELD TARGET · 3D DRIVER CUTAWAY ACTIVE
          </div>
          <div className="col-span-6 sm:col-span-3 text-right text-[#FF4D00] js-mono-label">
            THD &lt; 0.08% @ 1kHz 100dB
          </div>
        </div>

        {/* Main 12-Column Sound Grid — Left 7 cols: Copy, Controls & Oscilloscope | Right 5 cols: Full-height 3D Driver Cutaway Bay */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left 7 Columns: Engineer Copy, Band Controls, Play/Pause & Live Scrubbed Oscilloscope */}
          <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[#ECE7DF]/15 flex flex-col justify-between bg-[#0E0E0E]/94">
            <div className="p-6 sm:p-8 border-b border-[#ECE7DF]/15">
              <p className="font-mono text-xs uppercase tracking-widest text-[#8A8A85] mb-2.5 js-mono-label">
                TRANSDUCER TRANSFER FUNCTION · {countLowHz}HZ–{countHighKhz}KHZ
              </p>
              <h2
                id="sound-heading"
                data-kinetic-headline
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight leading-[0.95] text-[#ECE7DF]"
              >
                {'6HZ–38KHZ, TUNED FLAT IN THE MIDS, +3DB SUB-BASS SHELF.'
                  .split(' ')
                  .map((w, i) => (
                    <span
                      key={i}
                      className="inline-block overflow-hidden align-bottom mr-[0.24em] pb-[0.04em]"
                    >
                      <span
                        className={`js-kinetic-word inline-block will-change-transform ${
                          w === '+3DB' || w === 'SUB-BASS' ? 'text-[#FF4D00]' : ''
                        }`}
                      >
                        {w}
                      </span>
                    </span>
                  ))}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[#8A8A85] leading-relaxed">
                Consumer headphones boost 100Hz to fake warmth and spike 8kHz to simulate detail—fatiguing your ears in twenty minutes. We grew a 40mm bacterial biocellulose dome that stays pistonic down to 6Hz, keeping vocals and studio monitors phase-accurate from 200Hz to 4kHz.
              </p>

              {/* Frequency Band Selector Buttons */}
              <div className="mt-6">
                <div className="font-mono text-[11px] uppercase tracking-wider text-[#8A8A85] mb-2">
                  SELECT ACOUSTIC INSPECTION BAND:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BAND_SPECS.map((band) => {
                    const active = activeBand === band.id;
                    return (
                      <button
                        key={band.id}
                        type="button"
                        data-testid={`band-btn-${band.id}`}
                        onClick={() => handleBandSelect(band.id)}
                        className={`relative z-20 pointer-events-auto text-left p-2.5 border transition-colors cursor-pointer min-w-0 ${
                          active
                            ? 'border-[#FF4D00] bg-[#FF4D00]/15 text-[#ECE7DF]'
                            : 'border-[#ECE7DF]/15 bg-[#0E0E0E] text-[#8A8A85] hover:border-[#ECE7DF]/40 hover:text-[#ECE7DF]'
                        }`}
                      >
                        <div className="font-mono text-[10px] uppercase tracking-wider text-[#FF4D00] truncate">
                          {band.range}
                        </div>
                        <div className="font-sans text-xs font-medium text-[#ECE7DF] mt-0.5 truncate">
                          {band.label}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 p-3.5 border border-[#ECE7DF]/15 bg-[#141414]">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[#ECE7DF]">
                    <span>{currentBandSpec.label.toUpperCase()}</span>
                    <span className="text-[#FF4D00]">{currentBandSpec.gainNote}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#8A8A85] leading-relaxed">
                    {currentBandSpec.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Telemetry Bar + Live Canvas Oscilloscope + Metrics Strip */}
            <div className="flex flex-col justify-between bg-[#0E0E0E]/96">
              <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 p-4 sm:px-8 border-b border-[#ECE7DF]/15 bg-[#0E0E0E]">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    data-testid="play-reference-signal-btn"
                    onClick={handleTogglePlay}
                    aria-pressed={isPlaying}
                    className={`relative z-20 pointer-events-auto px-3 sm:px-4 py-2 font-mono text-xs uppercase tracking-widest font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                      isPlaying
                        ? 'bg-[#FF4D00] text-[#0E0E0E]'
                        : 'bg-[#ECE7DF] text-[#0E0E0E] hover:bg-[#FF4D00]'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <rect x="3" y="2" width="4" height="12" />
                          <rect x="9" y="2" width="4" height="12" />
                        </svg>
                        <span>Pause Test Signal</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <polygon points="3,2 14,8 3,14" />
                        </svg>
                        <span>Play Reference Signal</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    data-testid="anc-toggle-btn"
                    onClick={() => setAncEnabled((prev) => !prev)}
                    aria-pressed={ancEnabled}
                    className={`relative z-20 pointer-events-auto px-2.5 sm:px-3 py-2 font-mono text-xs uppercase tracking-wider border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      ancEnabled
                        ? 'border-[#ECE7DF]/40 text-[#ECE7DF] bg-[#161616]'
                        : 'border-[#ECE7DF]/15 text-[#8A8A85] hover:text-[#ECE7DF]'
                    }`}
                  >
                    {ancEnabled ? 'ANC: -38DB ACTIVE' : 'ANC: BYPASSED'}
                  </button>
                </div>

                <div className="font-mono text-xs text-[#8A8A85]">
                  LEVEL: <span className="text-[#ECE7DF]">{dbReadout}</span>
                </div>
              </div>

              {/* Live Canvas Oscilloscope */}
              <div className="relative h-[200px] sm:h-[230px] w-full overflow-hidden">
                <canvas
                  ref={canvasRef}
                  data-testid="sound-waveform-canvas"
                  aria-label="Live acoustic frequency response and oscilloscope waveform"
                  className="w-full h-full block pointer-events-none"
                />
                <div className="pointer-events-none absolute top-3 left-4 sm:left-8 flex flex-wrap items-center gap-6 font-mono text-[11px] uppercase tracking-wider text-[#8A8A85]">
                  <span className="text-[#FF4D00]">ORANGE TRACE: SCROLL-SCRUBBED WAVEFORM</span>
                  <span>DASHED LINE: 0.0 dB FLAT TARGET</span>
                </div>
              </div>

              {/* Acoustic Metrics Footer Strip with Count-Up Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-[#ECE7DF]/15 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE7DF]/15 font-mono bg-[#0E0E0E]">
                <div className="p-3.5 sm:px-6 min-w-0">
                  <div className="text-[11px] text-[#8A8A85] uppercase truncate">SUB-BASS EXTENSION</div>
                  <div className="text-base sm:text-lg font-semibold text-[#ECE7DF] mt-0.5">
                    {countLowHz} Hz <span className="text-xs text-[#FF4D00]">+3dB</span>
                  </div>
                </div>
                <div className="p-3.5 sm:px-6 min-w-0">
                  <div className="text-[11px] text-[#8A8A85] uppercase truncate">L/R DRIVER MATCHING</div>
                  <div className="text-base sm:text-lg font-semibold text-[#ECE7DF] mt-0.5">
                    ±{countMatchDb} dB
                  </div>
                </div>
                <div className="p-3.5 sm:px-6 min-w-0">
                  <div className="text-[11px] text-[#8A8A85] uppercase truncate">HIGH-RES UPPER LIMIT</div>
                  <div className="text-base sm:text-lg font-semibold text-[#ECE7DF] mt-0.5">
                    {countHighFullHz.toLocaleString()} Hz
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Dedicated Full-Height Unobstructed 3D Driver Cutaway Stage Bay */}
          <div
            data-stage-bay
            data-stage-index="2"
            data-testid="sound-3d-stage-bay"
            className="pointer-events-none lg:col-span-5 min-h-[380px] lg:min-h-full p-6 flex flex-col justify-between bg-transparent select-none"
          >
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#8A8A85]">
              <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#FF4D00]">
                STAGE 03 · 40MM DRIVER CUTAWAY
              </span>
              <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20">
                N52 1.2T FLUX
              </span>
            </div>

            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#8A8A85]">
              <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#ECE7DF]">
                BIOCELLULOSE DOME + COPPER VOICE COIL
              </span>
              <span className="bg-[#0E0E0E]/90 px-2.5 py-1 border border-[#ECE7DF]/20 text-[#FF4D00]">
                EXCURSION ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
