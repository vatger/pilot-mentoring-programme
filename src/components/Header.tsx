'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {

  const [theme, setTheme] = useState('light');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManualToggle, setIsManualToggle] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    // Set initial theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Set initial collapsed state for mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsCollapsed(true);
    }

    // Set initial mobile state
    setIsMobile(window.innerWidth < 768);

    // Set active nav item based on path
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    setActiveNavItem(path);

    // Handle resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && !isManualToggle) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 768) {
        setIsCollapsed(false);
        setIsManualToggle(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isManualToggle]);

  if (!isHydrated || shouldRedirect) {
    return null;
  }
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  const toggleMenu = () => {
    setIsCollapsed(!isCollapsed);
    setIsManualToggle(true);
  };
  
  return (
    <>
      {isMobile && (
        <div className="mobile-header-controls">
          <button 
            id="mobile-menu-toggle" 
            className={`mobile-menu-toggle ${isCollapsed ? 'menu-closed' : ''}`}
            aria-label="Toggle Navigation Menu"
            aria-expanded={!isCollapsed}
            onClick={toggleMenu}
          >
            <svg className="icon-plane" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#fff" stroke="currentColor" strokeWidth="2">
              <path d="M10.18 9" />
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V21l2-1 2 1v-7.5z" />
            </svg>
            <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
              Toggle Menu
            </span>
          </button>
        </div>
      )}
      <div className={`header-container ${isCollapsed ? 'collapsed' : ''}`} id="header-container">
        <BackgroundSlider />
        <div className="header">
          <button 
            className={`dark-mode-toggle ${theme === 'dark' ? 'dark-active' : ''}`} 
            aria-label="Toggle Dark Mode"
            onClick={toggleTheme}
          >
            <svg className="icon-moon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            <svg className="icon-sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <span className="toggle-text">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
            <div className="logo">
            {/* background image chosen by CSS via [data-theme] */}
            <div className="logo-visual" role="img" aria-label="VATGer logo" />
           </div>
          <h1>Piloten-Mentoren-Programm</h1>
        </div>
        {activeNavItem !== null && (
          <nav className="nav" aria-label="Hauptnavigation">
            <Link href="/" className={activeNavItem === '/' ? 'active' : ''}>Home</Link>
            <Link href="/teilnahme" className={activeNavItem === '/teilnahme' ? 'active' : ''}>Teilnahme</Link>
            <Link href="/events" className={activeNavItem === '/events' ? 'active' : ''}>Events</Link>
            <Link href="/howto" className={activeNavItem === '/howto' ? 'active' : ''}>How to get started</Link>
            <Link href="/kontakt" className={activeNavItem === '/kontakt' ? 'active' : ''}>Kontakt</Link>
            <Link href="/anmeldung" className={activeNavItem === '/anmeldung' ? 'active' : ''}>Anmeldung</Link>
          </nav>
        )}
      </div>
    </>
  );
}

function BackgroundSlider() {
  const imageUrls = [
    'https://cdn.pmp.hosting201623.ae912.netcup.net/1.PNG',
    'https://cdn.pmp.hosting201623.ae912.netcup.net/2.PNG',
    'https://cdn.pmp.hosting201623.ae912.netcup.net/3.PNG',
    'https://cdn.pmp.hosting201623.ae912.netcup.net/5.PNG',
    'https://cdn.pmp.hosting201623.ae912.netcup.net/6.PNG',
    'https://cdn.pmp.hosting201623.ae912.netcup.net/7.PNG',
    'https://cdn.pmp.hosting201623.ae912.netcup.net/8.PNG',
    'https://cdn.pmp.hosting201623.ae912.netcup.net/9.PNG'
  ];

  const [isMounted, setIsMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [backgroundVisible, setBackgroundVisible] = useState(false);
  const [loaded, setLoaded] = useState<boolean[]>(() => new Array(imageUrls.length).fill(false));
  const [canAutoplay, setCanAutoplay] = useState(false);

  // shorter, still smooth
  const TRANSITION_DURATION = 1.6; // seconds (shorter fade)
  const TRANSITION_MS = TRANSITION_DURATION * 1000;
  const AUTOPLAY_MS = 24000; // images stay longer

  // preload + decode images and mark loaded state
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    imageUrls.forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      imgs.push(img);

      const markLoaded = () => setLoaded(prev => {
        if (prev[idx]) return prev;
        const copy = prev.slice(); copy[idx] = true; return copy;
      });

      img.onload = () => markLoaded();
      img.onerror = () => markLoaded(); // don't block on failures

      // try decode (better chance image is ready when used)
      if ((img as any).decode) {
        (img as any).decode().then(markLoaded).catch(() => {});
      }
    });

    // safety: after 5s allow autoplay even if not all images loaded
    const safety = setTimeout(() => setCanAutoplay(true), 5000);

    return () => {
      clearTimeout(safety);
      imgs.forEach(i => { i.onload = null; i.onerror = null; });
    };
  }, []);

  // enable autoplay when at least two images are ready (current + next)
  useEffect(() => {
    const ready = loaded.filter(Boolean).length;
    if (ready >= 2) setCanAutoplay(true);
  }, [loaded]);

  // restore index from localStorage and mark mounted
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('backgroundImageIndex');
    const idx = stored ? Math.max(0, Math.min(imageUrls.length - 1, parseInt(stored, 10))) : 0;
    setCurrentIndex(isNaN(idx) ? 0 : idx);
    setIsMounted(true);
  }, []);

  // show/hide on mobile
  useEffect(() => {
    const handle = () => setBackgroundVisible(window.innerWidth >= 768);
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // autoplay crossfade: only start when backgroundVisible && canAutoplay
  useEffect(() => {
    if (!backgroundVisible || !canAutoplay) return;
    const id = setInterval(() => {
      setCurrentIndex(i => {
        const next = (i + 1) % imageUrls.length;
        setPrevIndex(i); // keep previous for overlap
        try { localStorage.setItem('backgroundImageIndex', String(next)); } catch(e) {}
        return next;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [backgroundVisible, canAutoplay]);

  // clear prevIndex after the transition has completed
  useEffect(() => {
    if (prevIndex === null) return;
    const t = setTimeout(() => setPrevIndex(null), TRANSITION_MS + 400);
    return () => clearTimeout(t);
  }, [prevIndex]);

  if (!isMounted) return null;

  const imgStyle: React.CSSProperties = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', willChange: 'opacity', pointerEvents: 'none' };
  // render previous above the current during the fade so it occludes while fading out
  const prevImgStyle = { ...imgStyle, zIndex: 2 } as React.CSSProperties;
  const curImgStyle = { ...imgStyle, zIndex: 1 } as React.CSSProperties;

  return (
    <div
      className="background"
      id="background-slider"
      aria-hidden={!backgroundVisible}
    >
      <div className="slider-container" id="slider-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        {backgroundVisible && (
          <>
            {prevIndex !== null && (
              <motion.img
                key={`prev-${prevIndex}`}
                src={imageUrls[prevIndex]}
                alt={`Aircraft Background ${prevIndex + 1}`}
                className="slider-image"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: TRANSITION_DURATION, ease: 'easeInOut' }}
                style={prevImgStyle}
                onLoad={() => {
                  setLoaded(prev => { const copy = prev.slice(); copy[prevIndex] = true; return copy; });
                }}
              />
            )}

            <motion.img
              key={`cur-${currentIndex}`}
              src={imageUrls[currentIndex]}
              alt={`Aircraft Background ${currentIndex + 1}`}
              className="slider-image"
              initial={{ opacity: 0 }}
              // keep the current image fully opaque; dimming is handled by the overlay
              animate={{ opacity: 1 }}
              transition={{ duration: TRANSITION_DURATION, ease: 'easeInOut' }}
              style={curImgStyle}
              onLoad={() => {
                setLoaded(prev => { const copy = prev.slice(); copy[currentIndex] = true; return copy; });
              }}
            />
            {/* overlay that darkens images without changing their opacity (prevents bleed-through) */}
            <div
              className="slider-overlay"
              aria-hidden
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            />
          </>
        )}
      </div>
    </div>
  );
}

