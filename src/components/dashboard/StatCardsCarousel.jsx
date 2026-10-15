// src/components/dashboard/StatCardsCarousel.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function StatCardsCarousel({ stats = {}, profitMargin = 0 }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const dragStartXRef = useRef(0);
  const currentDragOffsetRef = useRef(0);
  const isPointerDownRef = useRef(false);

  const fmt = (v) => (Number(v) || 0).toLocaleString();

  // Define comprehensive, professional statistics cards with custom SVG icons
  const cards = [
    {
      id: "sales-value",
      label: "Total Sales Value",
      badge: "Gross Revenue",
      value: `PKR ${fmt(stats.totalSalesValue)}`,
      detail: "Accumulated volume in period",
      route: "/sales",
      actionText: "View Sales",
      theme: {
        gradient: "from-blue-600 via-indigo-600 to-cyan-500",
        badgeBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/50",
        iconBg: "bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40",
        accentLine: "from-blue-500 to-indigo-500",
        glow: "hover:shadow-blue-500/10",
        dotColor: "bg-blue-500",
      },
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "net-profit",
      label: "Net Profit",
      badge: "Operating Margin",
      value: `PKR ${fmt(stats.netProfit)}`,
      detail: "Clean profit after deductions",
      route: "/analytics/profit",
      actionText: "View Profit",
      theme: {
        gradient: "from-emerald-600 via-teal-600 to-green-500",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50",
        iconBg: "bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40",
        accentLine: "from-emerald-500 to-teal-500",
        glow: "hover:shadow-emerald-500/10",
        dotColor: "bg-emerald-500",
      },
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      ),
    },
    {
      id: "total-due",
      label: "Total Due",
      badge: "Outstanding",
      value: `PKR ${fmt(stats.totalDue)}`,
      detail: "Receivables awaiting payment",
      route: "/due-reminders",
      actionText: "Check Due",
      theme: {
        gradient: "from-amber-600 via-orange-600 to-yellow-500",
        badgeBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50",
        iconBg: "bg-gradient-to-br from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40",
        accentLine: "from-amber-500 to-orange-500",
        glow: "hover:shadow-amber-500/10",
        dotColor: "bg-amber-500",
      },
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
    },
    {
      id: "profit-margin",
      label: "Profit Margin",
      badge: "Efficiency",
      value: `${profitMargin}%`,
      detail: "Net profit over gross revenue",
      route: "/analytics/profit",
      actionText: "Profit Analytics",
      theme: {
        gradient: "from-purple-600 via-violet-600 to-fuchsia-500",
        badgeBg: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/50",
        iconBg: "bg-gradient-to-br from-purple-500/15 to-violet-500/15 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40",
        accentLine: "from-purple-500 to-violet-500",
        glow: "hover:shadow-purple-500/10",
        dotColor: "bg-purple-500",
      },
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.25 2.25L15 6" />
        </svg>
      ),
    },
    {
      id: "total-orders",
      label: "Total Sales Count",
      badge: "Invoices",
      value: `${fmt(stats.totalSalesCount || 0)}`,
      detail: "Orders recorded in period",
      route: "/sales",
      actionText: "View Orders",
      theme: {
        gradient: "from-cyan-600 via-sky-600 to-blue-500",
        badgeBg: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/50",
        iconBg: "bg-gradient-to-br from-cyan-500/15 to-sky-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/40",
        accentLine: "from-cyan-500 to-sky-500",
        glow: "hover:shadow-cyan-500/10",
        dotColor: "bg-cyan-500",
      },
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      id: "inventory-value",
      label: "Inventory Value",
      badge: "Stock Assets",
      value: `PKR ${fmt(stats.inventoryValue)}`,
      detail: "Stock on-hand asset worth",
      route: "/stock",
      actionText: "Stock Details",
      theme: {
        gradient: "from-rose-600 via-pink-600 to-red-500",
        badgeBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50",
        iconBg: "bg-gradient-to-br from-rose-500/15 to-pink-500/15 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40",
        accentLine: "from-rose-500 to-pink-500",
        glow: "hover:shadow-rose-500/10",
        dotColor: "bg-rose-500",
      },
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      id: "catalog-products",
      label: "Catalog Products",
      badge: "Inventory SKUs",
      value: `${fmt(stats.totalProducts || 0)}`,
      detail: "Active products in catalog",
      route: "/products",
      actionText: "Products List",
      theme: {
        gradient: "from-indigo-600 via-blue-600 to-sky-500",
        badgeBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/50",
        iconBg: "bg-gradient-to-br from-indigo-500/15 to-blue-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40",
        accentLine: "from-indigo-500 to-blue-500",
        glow: "hover:shadow-indigo-500/10",
        dotColor: "bg-indigo-500",
      },
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
    },
    {
      id: "customers",
      label: "Registered Customers",
      badge: "Client Network",
      value: `${fmt(stats.totalCustomers || 0)}`,
      detail: "Active client accounts",
      route: "/customers",
      actionText: "View Clients",
      theme: {
        gradient: "from-emerald-600 via-teal-600 to-cyan-500",
        badgeBg: "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/50",
        iconBg: "bg-gradient-to-br from-teal-500/15 to-emerald-500/15 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/40",
        accentLine: "from-teal-500 to-emerald-500",
        glow: "hover:shadow-teal-500/10",
        dotColor: "bg-teal-500",
      },
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  // Measure container and update visible cards count
  const updateLayout = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    setContainerWidth(width);

    if (width < 640) {
      setCardsPerView(1); // Mobile: strictly 1 card at a time, centered
    } else if (width < 1024) {
      setCardsPerView(2); // Tablet: 2 cards at a time
    } else {
      setCardsPerView(3); // Desktop: strictly 3 cards at a time, evenly spaced
    }
  }, []);

  useEffect(() => {
    updateLayout();
    const handleResize = () => updateLayout();
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => updateLayout());
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [updateLayout]);

  const maxIndex = Math.max(0, cards.length - cardsPerView);

  // Keep index within bounds if cardsPerView changes
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  // Precise navigation methods
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const handleGoTo = (index) => {
    const target = Math.min(Math.max(0, index), maxIndex);
    setCurrentIndex(target);
  };

  // Auto-advance every 5 seconds, looping seamlessly back to 0
  useEffect(() => {
    if (isPaused || isDragging || maxIndex === 0) return;

    const timer = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, isDragging, maxIndex, handleNext]);

  // Drag & Swipe gesture handlers (touch and mouse)
  const onPointerDown = (clientX) => {
    isPointerDownRef.current = true;
    dragStartXRef.current = clientX;
    currentDragOffsetRef.current = 0;
    setIsDragging(true);
    setIsPaused(true);
  };

  const onPointerMove = (clientX) => {
    if (!isPointerDownRef.current) return;
    const diff = clientX - dragStartXRef.current;
    // Bound the drag distance to prevent extreme stretching
    currentDragOffsetRef.current = diff;
    setDragOffset(diff);
  };

  const onPointerUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    const threshold = 48; // minimum drag distance in px to switch card
    const finalOffset = currentDragOffsetRef.current;

    if (finalOffset < -threshold) {
      // Swiped Left -> Next Card
      handleNext();
    } else if (finalOffset > threshold) {
      // Swiped Right -> Prev Card
      handlePrev();
    }

    setDragOffset(0);
    currentDragOffsetRef.current = 0;

    // Small delay before unpausing auto-advance
    setTimeout(() => {
      setIsPaused(false);
    }, 600);
  };

  // Touch event listeners
  const handleTouchStart = (e) => {
    if (e.touches.length > 0) onPointerDown(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length > 0) onPointerMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    onPointerUp();
  };

  // Mouse event listeners for drag-to-slide on desktop/laptop
  const handleMouseDown = (e) => {
    // Only drag with left mouse click
    if (e.button !== 0) return;
    onPointerDown(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (isPointerDownRef.current) {
      onPointerMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    onPointerUp();
  };

  const handleMouseLeave = () => {
    if (isPointerDownRef.current) {
      onPointerUp();
    }
    setIsPaused(false);
  };

  // Gap between cards
  const gap = cardsPerView === 1 ? 16 : 20;

  // Calculate card width and exact translateX so cards snap perfectly into position
  const cardWidth = containerWidth > 0
    ? (containerWidth - (cardsPerView - 1) * gap) / cardsPerView
    : 0;

  const currentTranslateX = -(currentIndex * (cardWidth + gap)) + dragOffset;

  return (
    <section
      aria-label="Dashboard Statistics Carousel"
      className="w-full relative group/carousel select-none focus:outline-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Carousel Top Controls Bar ── */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isPaused ? "bg-amber-400" : "bg-emerald-500 animate-pulse"}`} />
            <span>Key Metrics</span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
            {cardsPerView === 1 ? "Swipe or use arrows" : "3 cards at a time • Auto-advances every 5s"}
          </span>
        </div>

        {/* Navigation Buttons (Top/Corner Controls) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 hidden xs:inline mr-1">
            {String(currentIndex + 1).padStart(2, "0")} / {String(maxIndex + 1).padStart(2, "0")}
          </span>

          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous statistics card"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next statistics card"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Carousel Viewport Container ── */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Floating Side Left Button (Desktop/Tablet) */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous slide"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/90 dark:border-gray-700/90 shadow-lg text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 active:scale-95 opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Floating Side Right Button (Desktop/Tablet) */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next slide"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/90 dark:border-gray-700/90 shadow-lg text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 active:scale-95 opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* ── Sliding Track ── */}
        <div
          className="flex will-change-transform py-1.5"
          style={{
            transform: `translate3d(${currentTranslateX}px, 0, 0)`,
            transition: isDragging
              ? "none"
              : "transform 480ms cubic-bezier(0.16, 1, 0.3, 1)",
            gap: `${gap}px`,
          }}
        >
          {cards.map((card, idx) => {
            const isVisible =
              idx >= currentIndex && idx < currentIndex + cardsPerView;

            return (
              <div
                key={card.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${card.label}: ${card.value}`}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                style={{
                  width: `${cardWidth}px`,
                }}
              >
                <div
                  className={`relative flex flex-col justify-between h-[185px] sm:h-[195px] p-5 rounded-2xl bg-white dark:bg-gray-800/95 border border-gray-200/90 dark:border-gray-700/80 shadow-sm hover:shadow-xl ${card.theme.glow} transition-all duration-300 overflow-hidden group/card`}
                >
                  {/* Top Ambient Glow / Accent Bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.theme.accentLine}`}
                  />

                  {/* Card Header: Category Badge + Professional SVG Icon */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${card.theme.badgeBg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${card.theme.dotColor}`} />
                          {card.badge}
                        </span>
                      </div>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-2 truncate">
                        {card.label}
                      </h3>
                    </div>

                    {/* SVG Icon with Glass-morphic Container */}
                    <div
                      className={`p-2.5 rounded-xl ${card.theme.iconBg} flex-shrink-0 group-hover/card:scale-110 transition-transform duration-300 shadow-sm`}
                    >
                      {card.icon}
                    </div>
                  </div>

                  {/* Card Body: Metric Value */}
                  <div className="my-auto pt-1">
                    <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-gray-900 dark:text-white font-mono leading-none truncate">
                      {card.value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 truncate">
                      {card.detail}
                    </p>
                  </div>

                  {/* Card Footer: Navigation link & Action */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                      {isVisible ? "Active" : "Overview"}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(card.route);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group/btn transition-colors"
                    >
                      <span>{card.actionText}</span>
                      <svg
                        className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Carousel Bottom Indicators & Timer Progress ── */}
      <div className="flex flex-col items-center gap-2 mt-3.5">
        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: maxIndex + 1 }).map((_, dotIdx) => {
            const isActive = dotIdx === currentIndex;
            return (
              <button
                key={dotIdx}
                type="button"
                onClick={() => handleGoTo(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                  isActive
                    ? "w-7 bg-blue-600 dark:bg-blue-500 shadow-sm"
                    : "w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
                }`}
              />
            );
          })}
        </div>

        {/* 5-second Auto-advance indicator bar */}
        <div className="w-24 sm:w-32 h-1 bg-gray-200/80 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            key={`${currentIndex}-${isPaused}`}
            className={`h-full bg-blue-500/80 rounded-full ${
              isPaused
                ? "w-0"
                : "w-full animate-[statProgress_5s_linear_infinite]"
            }`}
          />
        </div>
      </div>
    </section>
  );
}
