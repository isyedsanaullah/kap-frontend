// src/pages/CompanyProfile.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://kap-new-backend.vercel.app/api";

/* ── Business categories ─────────────────────────────────── */
const CATEGORIES = [
  {
    name: "Excavator Parts",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
      </svg>
    ),
    description: "Boom cylinders, bucket teeth, track links, rollers, and more"
  },
  {
    name: "Heavy Machinery",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    description: "Complete parts for loaders, dozers, cranes, and industrial equipment"
  },
  {
    name: "Hydraulic Components",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    description: "Pumps, valves, cylinders, hoses, seals, and hydraulic fittings"
  },
  {
    name: "Engine Components",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    description: "Filters, gaskets, turbochargers, injectors, and engine overhaul kits"
  },
  {
    name: "Construction Equipment",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    description: "Wear parts, ground engaging tools, and structural components"
  }
];

/* ── Format number with commas ───────────────────────────── */
const formatNumber = (n) => {
  if (n == null || isNaN(n)) return "0";
  return Number(n).toLocaleString("en-PK");
};

/* ── Format currency ─────────────────────────────────────── */
const formatCurrency = (n) => {
  if (n == null || isNaN(n) || n === 0) return "Rs. 0";
  return `Rs. ${Number(n).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
};

/* ── Animated counter hook ───────────────────────────────── */
const useCounter = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target || target <= 0) { setCount(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

/* ── Fallback static data if API or DB is unavailable ──── */
const FALLBACK_COMPANY_DATA = {
  companyName: "Karachi Auto Parts",
  shortcut: "KAP",
  ownerName: "Syed Latif Ullah Hairan",
  ownerImage: "https://res.cloudinary.com/dm1dxc98q/image/upload/v1786651866/WhatsApp_Image_2026-08-14_at_1.07.34_AM_fowbm9.jpg",
  logo: "https://res.cloudinary.com/dm1dxc98q/image/upload/v1767645526/company/logo.png",
  businessDescription: "Karachi Auto Parts (KAP) specializes in high-quality parts and components for excavators, heavy machinery, construction equipment, and related heavy equipment. We provide reliable components including hydraulic parts, engine components, undercarriage parts, and more to keep your heavy machinery operating at peak performance.",
  statistics: {
    customers: 150,
    products: 1200,
    averageDailySales: 450000
  }
};

/* ── Intersection Observer hook for scroll animations ── */
const useScrollAnimation = () => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return [ref, isVisible];
};

export default function CompanyProfile() {
  const [data, setData] = useState(FALLBACK_COMPANY_DATA);
  const [isFetchingStats, setIsFetchingStats] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const fetchCompany = async () => {
      try {
        const res = await axios.get(`${API_BASE}/profile/company/public`, { timeout: 3000 });
        if (isMounted && res.data && res.data.companyName) {
          setData({
            ...FALLBACK_COMPANY_DATA,
            ...res.data,
            logo: res.data.logo || FALLBACK_COMPANY_DATA.logo,
            ownerImage: res.data.ownerImage || FALLBACK_COMPANY_DATA.ownerImage,
            statistics: res.data.statistics || FALLBACK_COMPANY_DATA.statistics,
          });
        }
      } catch (err) {
        console.warn("[COMPANY] Public API timeout or unavailable — using static fallback profile");
      } finally {
        if (isMounted) setIsFetchingStats(false);
      }
    };
    fetchCompany();
    return () => { isMounted = false; };
  }, []);

  const customerCount = useCounter(data?.statistics?.customers || 0);
  const productCount = useCounter(data?.statistics?.products || 0);
  const avgSales = useCounter(data?.statistics?.averageDailySales || 0);

  const stats = [
    { label: "Trusted Customers", value: formatNumber(customerCount), raw: data?.statistics?.customers },
    { label: "Products Available", value: formatNumber(productCount), raw: data?.statistics?.products },
    { label: "Avg. Daily Sales", value: formatCurrency(avgSales), raw: data?.statistics?.averageDailySales },
  ];

  // Refs for scroll animations
  const [heroRef, heroVisible] = useScrollAnimation();
  const [statsRef, statsVisible] = useScrollAnimation();
  const [aboutRef, aboutVisible] = useScrollAnimation();
  const [categoriesRef, categoriesVisible] = useScrollAnimation();
  const [developerRef, developerVisible] = useScrollAnimation();

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-white overflow-x-hidden">
      {/* ══════════════════════════════════════════════════════
          ANIMATED BACKGROUND SVG
      ══════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute -top-1/2 -right-1/4 w-[120%] h-[120%] opacity-[0.04]" viewBox="0 0 1200 1200" fill="none">
          <circle cx="600" cy="600" r="500" stroke="url(#grad1)" strokeWidth="2" />
          <circle cx="600" cy="600" r="400" stroke="url(#grad1)" strokeWidth="1.5" strokeDasharray="8 12" />
          <circle cx="600" cy="600" r="300" stroke="url(#grad1)" strokeWidth="1" />
          <circle cx="600" cy="600" r="200" stroke="url(#grad1)" strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="600" cy="600" r="100" stroke="url(#grad1)" strokeWidth="0.5" />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
        </svg>
        <svg className="absolute -bottom-1/4 -left-1/4 w-[80%] h-[80%] opacity-[0.03]" viewBox="0 0 800 800">
          <path d="M0 400 Q200 200 400 400 T800 400" stroke="#6366F1" strokeWidth="1" fill="none" />
          <path d="M0 500 Q200 300 400 500 T800 500" stroke="#A855F7" strokeWidth="0.8" fill="none" />
          <path d="M0 300 Q200 500 400 300 T800 300" stroke="#6366F1" strokeWidth="0.8" fill="none" opacity="0.5" />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════
          TOP NAVIGATION BAR
      ══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-[#0A0B0F]/80 backdrop-blur-2xl border-b border-white/5 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          {data?.logo && (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center p-2 border border-white/5 group-hover:border-indigo-400/30 transition-all duration-500">
              <img src={data.logo} alt="KAP Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <div>
            <span className="font-bold text-xl text-white tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              {data?.shortcut || "KAP"}
            </span>
            <span className="hidden sm:inline ml-2 text-slate-500 text-sm font-light">
              | {data?.companyName || "Karachi Auto Parts"}
            </span>
          </div>
        </div>

        <div>
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="relative px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 flex items-center gap-2 overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>Dashboard</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/30 flex items-center gap-2 backdrop-blur-sm group"
            >
              <span>Sign In</span>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden py-16 sm:py-24 lg:py-32"
      >
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`
            flex flex-col items-center text-center space-y-6
            transition-all duration-1000 ease-out
            ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
          `}>
            {/* Logo with glow */}
            {data?.logo && (
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-2xl" />
                <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm flex items-center justify-center p-4 border border-white/10 shadow-2xl shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-500">
                  <img
                    src={data.logo}
                    alt={`${data.companyName || "KAP"} logo`}
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
              </div>
            )}

            {/* Company name */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[1.1]">
                <span className="bg-gradient-to-r from-white via-indigo-200/90 to-purple-300/80 bg-clip-text text-transparent">
                  {data?.companyName || "Karachi Auto Parts"}
                </span>
              </h1>
            </div>

            {/* Tagline */}
            <p className="max-w-2xl text-base sm:text-lg lg:text-xl text-slate-400 font-light leading-relaxed">
              Your trusted partner for premium excavator parts, heavy machinery components,
              and construction equipment — keeping your operations running at peak performance.
            </p>

            {/* Decorative divider with animated line */}
            <div className="relative w-32 h-1">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
            </div>

            {/* Animated SVG ornament */}
            <svg className="w-16 h-8 opacity-30" viewBox="0 0 64 32" fill="none">
              <path d="M2 16 L16 16 M32 16 L48 16" stroke="url(#ornament)" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="4" stroke="url(#ornament)" strokeWidth="1" />
              <circle cx="48" cy="16" r="4" stroke="url(#ornament)" strokeWidth="1" />
              <circle cx="32" cy="16" r="2" fill="url(#ornament)" />
              <defs>
                <linearGradient id="ornament" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#A855F7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATISTICS
      ══════════════════════════════════════════════════════ */}
      <section
        ref={statsRef}
        className="relative -mt-8 z-10 px-4 sm:px-6 lg:px-8 pb-8"
      >
        <div className={`
          max-w-5xl mx-auto
          transition-all duration-1000 ease-out delay-200
          ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
        `}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-6 text-center hover:border-indigo-400/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="relative text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-300 via-white to-purple-300 bg-clip-text text-transparent">
                  {isFetchingStats ? (
                    <span className="text-lg sm:text-xl font-medium text-slate-400 animate-pulse">Loading…</span>
                  ) : stat.raw > 0 ? (
                    stat.value
                  ) : (
                    "—"
                  )}
                </p>
                <p className="relative mt-2 text-sm text-slate-400 font-medium tracking-wide">{stat.label}</p>
                {stat.raw === 0 && (
                  <p className="relative mt-1 text-xs text-slate-600">No data yet</p>
                )}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400/10 to-purple-400/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ABOUT SECTION
      ══════════════════════════════════════════════════════ */}
      <section
        ref={aboutRef}
        className="py-16 sm:py-24 relative"
      >
        <div className={`
          max-w-6xl mx-auto px-4 sm:px-6 lg:px-8
          transition-all duration-1000 ease-out delay-300
          ${aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
        `}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Text */}
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-indigo-400 font-semibold text-sm uppercase tracking-[0.3em] flex items-center gap-3">
                  <span className="w-8 h-px bg-indigo-400/50" />
                  About Us
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  Built for{" "}
                  <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                    Heavy Machinery
                  </span>
                </h2>
              </div>
              <p className="text-slate-400 leading-relaxed text-base lg:text-lg">
                {data?.businessDescription ||
                  "Karachi Auto Parts (KAP) specializes in high-quality parts and components for excavators, heavy machinery, construction equipment, and related heavy equipment."}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Excavators", "Loaders", "Dozers", "Cranes", "Construction"].map((tag, i) => (
                  <span
                    key={tag}
                    className="px-4 py-1.5 text-xs font-medium text-slate-300 rounded-full border border-white/5 hover:border-indigo-400/30 transition-all duration-300 hover:bg-indigo-500/10"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Owner card */}
            <div className="w-full">
              <div className="group bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-6 space-y-4 shadow-2xl shadow-indigo-500/5 hover:border-indigo-400/20 transition-all duration-500 hover:-translate-y-1">
                <div>
                  {data?.ownerImage && (
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-2xl overflow-hidden border-2 border-indigo-400/30 shadow-lg shadow-indigo-500/20 mb-4 transition-transform duration-500 group-hover:scale-105">
                      <img
                        src={data.ownerImage}
                        alt={data.ownerName || "Owner"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.parentElement.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">
                      {data?.ownerName || "Syed Latif Ullah Hairan"}
                    </h3>
                    <p className="text-xs text-indigo-300 font-medium">Founder &amp; Proprietor</p>
                  </div>
                </div>
                <div>
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-3" />
                  <p className="text-xs text-slate-500 text-center leading-relaxed">
                    Leading {data?.companyName || "KAP"} with a commitment to quality parts
                    and trusted customer relationships.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════════════════ */}
      <section
        ref={categoriesRef}
        className="py-16 sm:py-24 relative bg-gradient-to-b from-transparent via-white/[0.02] to-transparent"
      >
        <div className={`
          max-w-6xl mx-auto px-4 sm:px-6 lg:px-8
          transition-all duration-1000 ease-out delay-400
          ${categoriesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
        `}>
          <div className="text-center space-y-3 mb-14">
            <p className="text-indigo-400 font-semibold text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3">
              <span className="w-8 h-px bg-indigo-400/50" />
              What We Offer
              <span className="w-8 h-px bg-indigo-400/50" />
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Product Categories</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-light">
              Comprehensive range of parts and components for all your heavy equipment needs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((cat, index) => (
              <div
                key={cat.name}
                className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-indigo-400/20 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-300 group-hover:text-indigo-200 group-hover:scale-110 transition-all duration-300 mb-4">
                  {cat.icon}
                </div>
                <h3 className="relative text-lg font-semibold text-white mb-2 group-hover:text-indigo-200 transition-colors">{cat.name}</h3>
                <p className="relative text-sm text-slate-500 leading-relaxed">{cat.description}</p>
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-400/5 to-transparent rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          DEVELOPER PROMOTION CARD - CLEAN & PROFESSIONAL
      ══════════════════════════════════════════════════════ */}
      <section
        ref={developerRef}
        className="py-16 sm:py-20 md:py-24 relative"
      >
        <div className={`
          max-w-4xl mx-auto px-4 sm:px-6 lg:px-8
          transition-all duration-1000 ease-out delay-500
          ${developerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
        `}>
          {/* Section label */}
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-purple-400 font-medium text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
              <span className="w-8 h-px bg-purple-400/30" />
              Development Services
              <span className="w-8 h-px bg-purple-400/30" />
            </p>
          </div>

          <div className="relative group">
            {/* Main card - clean, minimal, professional */}
            <div className="relative bg-gradient-to-br from-[#12132a] to-[#0a0b1a] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300">

              {/* Subtle decorative pattern */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-[0.02]">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(30deg, rgba(255,255,255,0.1) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.1) 87.5%),
                    linear-gradient(150deg, rgba(255,255,255,0.1) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.1) 87.5%)
                  `,
                  backgroundSize: '60px 120px',
                  backgroundPosition: '0 0, 0 0'
                }} />
              </div>

              <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                {/* Developer avatar */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                      <img
                        src="https://res.cloudinary.com/dm1dxc98q/image/upload/v1786736056/WhatsApp_Image_2026-08-15_at_12.32.44_AM_o6y5qb.jpg"
                        alt="Syed Sana Ullah - Full Stack Developer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Online status indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 rounded-full border-2 border-[#0a0b1a] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5 justify-center md:justify-start">
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Syed Sana Ullah
                    </h3>
                    <span className="px-2.5 py-0.5 text-[10px] font-medium text-purple-300 bg-purple-500/10 rounded-full border border-purple-500/20">
                      Full Stack Developer
                    </span>
                  </div>

                  <p className="text-slate-400 text-sm leading-relaxed mb-3 max-w-2xl mx-auto md:mx-0">
                    <span className="block text-white/80 font-medium text-base mb-1">
                      Custom systems & web applications
                    </span>
                    I build high-performance, production-ready solutions tailored to your business needs.
                  </p>

                  {/* Tech stack with REAL SVG icons */}
                  <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start mb-4">
                    {/* React */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium text-slate-300 bg-white/5 rounded-full border border-white/5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="2.5" fill="#61DAFB" />
                        <ellipse cx="12" cy="12" rx="8.5" ry="4.5" stroke="#61DAFB" strokeWidth="0.8" fill="none" />
                        <ellipse cx="12" cy="12" rx="8.5" ry="4.5" stroke="#61DAFB" strokeWidth="0.8" fill="none" transform="rotate(60 12 12)" />
                        <ellipse cx="12" cy="12" rx="8.5" ry="4.5" stroke="#61DAFB" strokeWidth="0.8" fill="none" transform="rotate(-60 12 12)" />
                      </svg>
                      React
                    </span>

                    {/* Next.js */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium text-slate-300 bg-white/5 rounded-full border border-white/5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#000" />
                        <path d="M16.5 16.5L9.5 9.5M9.5 16.5L16.5 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5" fill="none" />
                      </svg>
                      Next.js
                    </span>

                    {/* Node.js */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium text-slate-300 bg-white/5 rounded-full border border-white/5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" stroke="#68A063" strokeWidth="1.5" fill="none" />
                        <path d="M12 12v8.5M12 12l8.5-4.5M12 12l-8.5-4.5" stroke="#68A063" strokeWidth="1.5" />
                        <circle cx="12" cy="12" r="2" fill="#68A063" />
                      </svg>
                      Node.js
                    </span>

                    {/* PostgreSQL */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium text-slate-300 bg-white/5 rounded-full border border-white/5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#336791" strokeWidth="1.5" fill="none" />
                        <path d="M12 6v6l-3 3M12 12l3 3" stroke="#336791" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="12" cy="6" r="1.5" stroke="#336791" strokeWidth="1.5" fill="none" />
                      </svg>
                      PostgreSQL
                    </span>

                    {/* MongoDB */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium text-slate-300 bg-white/5 rounded-full border border-white/5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#4DB33D" strokeWidth="1.5" fill="none" />
                        <path d="M12 6L12 18M12 18L15 15M12 18L9 15" stroke="#4DB33D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      MongoDB
                    </span>

                    {/* Tailwind */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium text-slate-300 bg-white/5 rounded-full border border-white/5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#06B6D4" strokeWidth="1.5" fill="none" />
                        <path d="M7 12C7 9 9 7 12 7C15 7 16 9 17 9" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M17 12C17 15 15 17 12 17C9 17 8 15 7 15" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Tailwind
                    </span>

                    {/* AWS */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium text-slate-300 bg-white/5 rounded-full border border-white/5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#FF9900" strokeWidth="1.5" fill="none" />
                        <path d="M12 6L18 12L12 18L6 12L12 6" stroke="#FF9900" strokeWidth="1.5" fill="none" />
                        <path d="M12 9L15 12L12 15L9 12L12 9" stroke="#FF9900" strokeWidth="1.5" fill="none" />
                      </svg>
                      AWS
                    </span>
                  </div>

                  {/* CTA Buttons - clean design */}
                  <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                    <a
                      href="mailto:syyedsanaullah@gmail.com"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-200 shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      Email
                    </a>

                    <a
                      href="https://wa.me/923135013303"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all duration-200 shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.764.459 3.483 1.332 5.001L2 22l5.129-1.341c1.464.797 3.119 1.218 4.88 1.219h.005c5.507 0 9.99-4.479 9.991-9.987.001-2.668-1.034-5.177-2.92-7.063C17.202 2.943 14.686 2 12.012 2zm5.834 14.183c-.244.688-1.42 1.314-1.954 1.397-.502.078-1.155.115-3.665-.925-3.21-1.328-5.275-4.577-5.434-4.792-.16-.214-1.298-1.728-1.298-3.297 0-1.569.822-2.341 1.116-2.661.293-.321.64-.401.854-.401.214 0 .428.002.614.011.196.01.458-.074.717.548.267.641.91 2.222.99 2.382.08.16.134.348.027.562-.107.214-.16.348-.321.535-.16.187-.337.418-.481.562-.16.16-.327.334-.141.653.187.32 0 2.054 1.134 3.064 1.457 1.297 2.686 1.7 3.007 1.86.32.16.508.134.695-.08.187-.214.801-.935 1.015-1.256.214-.321.428-.267.721-.16.294.107 1.87.881 2.19 1.041.321.16.535.241.615.375.08.134.08.775-.164 1.463z" />
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Badge - clean */}
              <div className="absolute top-3 right-3">
                <div className="px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  Available
                </div>
              </div>

              {/* Compact stats - updated with correct values */}
              <div className="hidden sm:block relative mt-5 pt-4 border-t border-white/5">
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Experience</p>
                    <p className="text-sm font-semibold text-white">2+ Years</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Projects</p>
                    <p className="text-sm font-semibold text-white">5+</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Support</p>
                    <p className="text-sm font-semibold text-white">24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer className="py-8 border-t border-white/5 bg-[#0A0B0F]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {data?.logo && (
                <div className="w-8 h-8 opacity-40 flex items-center justify-center">
                  <img src={data.logo} alt="" className="w-full h-full object-contain" />
                </div>
              )}
              <span className="text-slate-600 text-sm font-light tracking-wide">
                {data?.companyName || "Karachi Auto Parts"} <span className="text-slate-700">({data?.shortcut || "KAP"})</span>
              </span>
            </div>
            <p className="text-slate-700 text-xs font-light tracking-wide">
              &copy; {new Date().getFullYear()} {data?.companyName || "Karachi Auto Parts"}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}