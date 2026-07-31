import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Diamond } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

/* ─────────────────────────────────────────────
   Inline SVG: Premium 3D-style illustration
   ───────────────────────────────────────────── */
const Illustration3D = () => (
  <svg
    viewBox="0 0 200 190"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    aria-hidden="true"
  >
    {/* ── Bar chart (back layer) ── */}
    <g opacity="0.92">
      {/* Chart base shadow */}
      <ellipse cx="108" cy="170" rx="44" ry="7" fill="#6366f1" opacity="0.08" />
      {/* Bar 1 – tallest */}
      <rect x="72" y="100" width="18" height="62" rx="5" fill="url(#bar1)" />
      {/* Bar 2 */}
      <rect x="96" y="118" width="18" height="44" rx="5" fill="url(#bar2)" />
      {/* Bar 3 – shortest */}
      <rect x="120" y="130" width="18" height="32" rx="5" fill="url(#bar3)" />
      {/* Top shine on bar 1 */}
      <rect x="72" y="100" width="18" height="8" rx="5" fill="white" opacity="0.25" />
      {/* Top shine on bar 2 */}
      <rect x="96" y="118" width="18" height="7" rx="5" fill="white" opacity="0.2" />
      {/* Top shine on bar 3 */}
      <rect x="120" y="130" width="18" height="6" rx="5" fill="white" opacity="0.18" />
      {/* Trend line */}
      <polyline
        points="81,102 105,120 129,133"
        stroke="url(#trendLine)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Trend dots */}
      <circle cx="81" cy="102" r="3.5" fill="#818cf8" />
      <circle cx="105" cy="120" r="3.5" fill="#a5b4fc" />
      <circle cx="129" cy="133" r="3.5" fill="#c7d2fe" />
    </g>

    {/* ── Calculator (mid layer) ── */}
    <g filter="url(#calcShadow)">
      {/* Body */}
      <rect x="18" y="48" width="90" height="120" rx="14" fill="white" />
      {/* Top-left corner shine */}
      <rect x="18" y="48" width="90" height="120" rx="14" fill="url(#calcShine)" />
      {/* Screen bezel */}
      <rect x="28" y="60" width="70" height="34" rx="8" fill="#1e293b" />
      {/* Screen text */}
      <text
        x="93"
        y="82"
        textAnchor="end"
        fontFamily="'SF Mono', 'Fira Code', monospace"
        fontSize="14"
        fontWeight="700"
        fill="#7dd3fc"
      >
        12,450
      </text>
      {/* Currency prefix */}
      <text x="30" y="82" fontFamily="monospace" fontSize="10" fontWeight="700" fill="#475569">
        ₹
      </text>

      {/* Button rows */}
      {/* Row 1 */}
      {[34, 50, 66, 82].map((x, i) => (
        <rect key={`r1-${i}`} x={x} y="104" width="14" height="10" rx="3"
          fill={i === 3 ? '#3b82f6' : '#f1f5f9'} />
      ))}
      {/* Row 2 */}
      {[34, 50, 66, 82].map((x, i) => (
        <rect key={`r2-${i}`} x={x} y="120" width="14" height="10" rx="3"
          fill={i === 3 ? '#6366f1' : '#e2e8f0'} />
      ))}
      {/* Row 3 */}
      {[34, 50, 66, 82].map((x, i) => (
        <rect key={`r3-${i}`} x={x} y="136" width="14" height="10" rx="3"
          fill={i === 3 ? '#2563eb' : '#f8fafc'} />
      ))}
      {/* Wide bottom key */}
      <rect x="34" y="152" width="62" height="10" rx="5" fill="#3b82f6" />
      {/* Key shine */}
      <rect x="34" y="152" width="62" height="4" rx="5" fill="white" opacity="0.2" />
    </g>

    {/* ── Donut chart (foreground) ── */}
    <g transform="translate(128, 50)">
      {/* Shadow */}
      <ellipse cx="30" cy="58" rx="26" ry="6" fill="#6366f1" opacity="0.1" />
      {/* Donut segments */}
      <circle cx="30" cy="30" r="24" fill="none" stroke="#1e40af" strokeWidth="14"
        strokeDasharray="60 90" strokeDashoffset="0" strokeLinecap="round" />
      <circle cx="30" cy="30" r="24" fill="none" stroke="#60a5fa" strokeWidth="14"
        strokeDasharray="40 110" strokeDashoffset="-60" strokeLinecap="round" />
      <circle cx="30" cy="30" r="24" fill="none" stroke="#f472b6" strokeWidth="14"
        strokeDasharray="50 100" strokeDashoffset="-100" strokeLinecap="round" />
      {/* Inner fill */}
      <circle cx="30" cy="30" r="16" fill="white" />
      {/* Inner % label */}
      <text x="30" y="34" textAnchor="middle" fontSize="9" fontWeight="800"
        fill="#1e293b" fontFamily="system-ui">72%</text>
      {/* 3D rim highlight */}
      <circle cx="30" cy="30" r="24" fill="none" stroke="white" strokeWidth="3"
        strokeDasharray="20 130" strokeDashoffset="-5" strokeLinecap="round" opacity="0.4" />
    </g>

    {/* ── Floating ₹ Coin ── */}
    <g filter="url(#coinShadow)">
      <circle cx="148" cy="132" r="19" fill="url(#coinGrad)" />
      <circle cx="148" cy="132" r="19" fill="none" stroke="white" strokeWidth="2.5" opacity="0.3" />
      {/* Coin shine */}
      <ellipse cx="142" cy="124" rx="7" ry="4" fill="white" opacity="0.25" transform="rotate(-30 142 124)" />
      {/* Rupee symbol */}
      <text x="148" y="138" textAnchor="middle" fontSize="17" fontWeight="900"
        fill="white" fontFamily="system-ui">₹</text>
    </g>

    {/* ── Sparkle stars ── */}
    {[
      { cx: 14, cy: 38, r: 2.5, op: 0.6 },
      { cx: 165, cy: 22, r: 2,   op: 0.5 },
      { cx: 30,  cy: 175, r: 2,   op: 0.45 },
    ].map((s, i) => (
      <g key={i} opacity={s.op}>
        <line x1={s.cx} y1={s.cy - s.r * 2.2} x2={s.cx} y2={s.cy + s.r * 2.2}
          stroke="#93c5fd" strokeWidth="1.2" strokeLinecap="round" />
        <line x1={s.cx - s.r * 2.2} y1={s.cy} x2={s.cx + s.r * 2.2} y2={s.cy}
          stroke="#93c5fd" strokeWidth="1.2" strokeLinecap="round" />
        <line x1={s.cx - s.r * 1.4} y1={s.cy - s.r * 1.4} x2={s.cx + s.r * 1.4} y2={s.cy + s.r * 1.4}
          stroke="#bfdbfe" strokeWidth="0.8" strokeLinecap="round" />
        <line x1={s.cx + s.r * 1.4} y1={s.cy - s.r * 1.4} x2={s.cx - s.r * 1.4} y2={s.cy + s.r * 1.4}
          stroke="#bfdbfe" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    ))}

    {/* ── SVG Defs ── */}
    <defs>
      <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="bar2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="bar3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a5b4fc" />
        <stop offset="100%" stopColor="#818cf8" />
      </linearGradient>
      <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#c7d2fe" />
      </linearGradient>
      <linearGradient id="calcShine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.7" />
      </linearGradient>
      <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <filter id="calcShadow" x="-20%" y="-10%" width="150%" height="140%">
        <feDropShadow dx="4" dy="8" stdDeviation="10" floodColor="#6366f1" floodOpacity="0.15" />
      </filter>
      <filter id="coinShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="2" dy="4" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.3" />
      </filter>
    </defs>
  </svg>
);



/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */
const QuickEMIBanner = ({ onNavigate }) => {
  const { theme } = useSettings();
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #311042 100%)'
          : 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #e0e7ff 100%)',
        boxShadow: isDark
          ? '0 20px 40px -15px rgba(99,102,241,0.25), inset 0 1px 1px 0 rgba(255,255,255,0.05)'
          : '0 20px 40px -15px rgba(37,99,235,0.06), inset 0 1px 1px 0 rgba(255,255,255,0.6)',
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.08)',
      }}
    >
      {/* ── Grid Pattern overlay ── */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none mix-blend-overlay">
        <svg width="100%" height="100%">
          <pattern id="card-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#card-grid)" />
        </svg>
      </div>

      {/* ── Decorative glows ── */}
      <div
        className="absolute -top-12 -left-12 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-60"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(147,197,253,0.3) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-16 -right-16 w-44 h-44 rounded-full blur-2xl pointer-events-none opacity-60"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(244,114,182,0.2) 0%, transparent 70%)',
        }}
      />
 
      {/* ── Background sparkles ── */}
      {[
        { top: '8%',  left: '38%', size: 4 },
        { top: '22%', left: '52%', size: 3 },
        { top: '60%', left: '44%', size: 3 },
        { top: '80%', left: '58%', size: 2.5 },
        { top: '15%', left: '63%', size: 2.5 },
      ].map((s, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ top: s.top, left: s.left }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.2, 0.9] }}
          transition={{ duration: 2.4 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        >
          {/* 4-point star */}
          <svg width={s.size * 4} height={s.size * 4} viewBox="0 0 20 20" fill="none">
            <path
              d="M10 1 L11.2 8.8 L19 10 L11.2 11.2 L10 19 L8.8 11.2 L1 10 L8.8 8.8 Z"
              fill={isDark ? '#818cf8' : '#93c5fd'}
            />
          </svg>
        </motion.div>
      ))}
 
      {/* ── Content row ── */}
      <div className="relative z-10 flex items-center gap-3 p-4">
 
        {/* Left column */}
        <div className="flex-1 flex flex-col min-w-0">
 
          {/* Badge */}
          <div className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full mb-2"
            style={{
              background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(219,234,254,0.7)',
              border: '1px solid rgba(147,197,253,0.3)',
            }}
          >
            <Diamond size={8} className="text-blue-600 dark:text-blue-400" strokeWidth={2.5} fill="currentColor" />
            <span className="text-[8.5px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              QUICK FINANCE
            </span>
          </div>
 
          {/* Title */}
          <h2 className="text-xl font-black leading-tight text-gray-900 dark:text-white mb-1.5">
            Quick{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              EMI
            </span>
            {' '}Calculator
          </h2>
 
          {/* Subtitle */}
          <p className="text-[10.5px] text-gray-500 dark:text-gray-400 font-semibold leading-normal mb-3 max-w-[185px]">
            Professional-grade financial insights at your fingertips.
          </p>
 
          {/* CTA Button */}
          <motion.button
            id="banner-calculate-emi"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('QUICK_CALCULATOR')}
            className="self-start flex items-center gap-2 pl-4 pr-1 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest text-white"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              boxShadow: '0 6px 18px -4px rgba(37,99,235,0.4)',
            }}
          >
            Calculate EMI
            <span className="w-5.5 h-5.5 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <ArrowRight size={10} className="text-blue-600" strokeWidth={3} />
            </span>
          </motion.button>
        </div>
 
        {/* Right column – illustration */}
        <div className="relative flex-shrink-0 w-[110px] h-[130px]">
          <Illustration3D />
        </div>
      </div>
    </motion.div>
  );
};

export default QuickEMIBanner;
