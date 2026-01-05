'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Header() {

  const { data: session, status } = useSession();
  const [theme, setTheme] = useState('light');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManualToggle, setIsManualToggle] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showInternal, setShowInternal] = useState(false);
  const isManualToggleRef = useRef(isManualToggle);

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

    // Handle resize (reads latest manual-toggle flag from ref)
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && !isManualToggleRef.current) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 768) {
        setIsCollapsed(false);
        setIsManualToggle(false);
        isManualToggleRef.current = false;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
  isManualToggleRef.current = true;
  };

  const teams = (session?.user as any)?.teams || [];
  const userRole = (session?.user as any)?.role;
  
  // Role-based access determination
  const isAdmin = userRole === "ADMIN";
  const isLeitung = userRole === "PMP_LEITUNG";
  const isMentor = userRole === "MENTOR" || isLeitung || isAdmin;
  const isTrainee = userRole === "TRAINEE" || userRole === "PENDING_TRAINEE";
  const isPendingTrainee = userRole === "PENDING_TRAINEE";
  const isVisitor = userRole === "VISITOR";
  
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
        <div className="header">
          <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', gap: '8px', paddingTop: '15px', alignItems: 'center' }}>
            <button
              className="button"
              onClick={() => setShowInternal(true)}
            >
              Intern
            </button>
            <button 
              className={`dark-mode-toggle ${theme === 'dark' ? 'dark-active' : ''}`} 
              aria-label="Toggle Dark Mode"
              onClick={toggleTheme}
              style={{ marginLeft: 'auto', position: 'static', top: 'auto', right: 'auto' }}
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
          </div>
          <Link href="/" className="logo-link">
            <div className="logo">
              {/* background image chosen by CSS via [data-theme] */}
              <div className="logo-visual" role="img" aria-label="VATGer logo" />
            </div>
          </Link>
          <h1>Piloten-Mentoren-Programm</h1>
        </div>
        {showInternal ? (
          <div className="nav" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            {status === 'loading' && <p>Lade Session...</p>}
            {status !== 'loading' && !session && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <p style={{ margin: 0 }}>Interner Bereich</p>
                <button className="button" onClick={() => signIn('vatsim', { callbackUrl: '/trainings' })}>
                  Mit VATGER anmelden
                </button>
                <button className="button" onClick={() => setShowInternal(false)}>Zurück zur Hauptseite</button>
              </div>
            )}
            {session && (
              <>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <p style={{ margin: 0 }}>Angemeldet als {session.user?.name}</p>
                  <button className="button" onClick={() => signOut({ callbackUrl: '/' })}>Logout</button>
                  <button className="button" onClick={() => setShowInternal(false)}>Zurück zur Hauptseite</button>
                </div>
                
                {/* Internal Area Navigation - Role Based */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexDirection: 'column', alignItems: 'flex-start' }}>
                  {/* Admin & Leitung Links */}
                  {(isAdmin || isLeitung) && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <Link className="button" href="/admin">Admin Control Panel</Link>
                    </div>
                  )}
                  
                  {/* Mentor Links */}
                  {isMentor && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <Link className="button" href="/mentor/dashboard">Mentor Dashboard</Link>
                    </div>
                  )}
                  
                  {/* Trainee Links */}
                  {isTrainee && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {!isPendingTrainee && <Link className="button" href="/trainee/progress">My Training Progress</Link>}
                      {isPendingTrainee && <Link className="button" href="/anmeldung">Complete Registration</Link>}
                    </div>
                  )}
                  
                  {/* Visitor/Pending Trainee - Registration */}
                  {(isVisitor || isPendingTrainee) && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <Link className="button" href="/anmeldung">PMP Registration</Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          activeNavItem !== null && (
            <nav className="nav" aria-label="Hauptnavigation">
              <Link href="/" className={activeNavItem === '/' ? 'active' : ''}>Home</Link>
              <Link href="/pmp" className={activeNavItem === '/pmp' ? 'active' : ''}>PMP</Link>
              <Link href="/howto" className={activeNavItem === '/howto' ? 'active' : ''}>How to get started</Link>
              <Link href="/infos-fuer-piloten" className={activeNavItem === '/infos-fuer-piloten' ? 'active' : ''}>Infos für Piloten</Link>
              <Link href="/events" className={activeNavItem === '/events' ? 'active' : ''}>Online-Event</Link>
              <Link href="/anmeldung-forum" className={activeNavItem === '/anmeldung-forum' ? 'active' : ''}>Anmeldung</Link>
              <Link href="/mentorenbewerbung" className={activeNavItem === '/mentorenbewerbung' ? 'active' : ''}>Mentorenbewerbung</Link>
              <Link href="/kontakt" className={activeNavItem === '/kontakt' ? 'active' : ''}>Kontakt</Link>
            </nav>
          )
        )}
      </div>
    </>
  );
}

