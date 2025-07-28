'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [theme, setTheme] = useState('light');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManualToggle, setIsManualToggle] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('/');
  
  useEffect(() => {
    // Set initial theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Set initial collapsed state for mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsCollapsed(true);
    }
    
    // Set active nav item based on path
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    setActiveNavItem(path);
    
    // Handle resize
    const handleResize = () => {
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
      <div className="mobile-header-controls">
        <button 
          id="mobile-menu-toggle" 
          className={`mobile-menu-toggle ${isCollapsed ? 'menu-closed' : ''}`}
          aria-label="Toggle Navigation Menu"
          aria-expanded={!isCollapsed}
          onClick={toggleMenu}
        >
          <svg className="icon-plane" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path>
          </svg>
          <span className="sr-only">Toggle Menu</span>
        </button>
      </div>

      <div className={`header-container ${isCollapsed ? 'collapsed' : ''}`} id="header-container">
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
          <div className="logo" aria-label="VATSIM Germany Logo">VATSIM Germany</div>
          <h1>Piloten-Mentoren-Programm</h1>
        </div>
        <nav className="nav" aria-label="Hauptnavigation">
          <Link href="/" className={activeNavItem === '/' ? 'active' : ''}>Home</Link>
          <Link href="/teilnahme" className={activeNavItem === '/teilnahme' ? 'active' : ''}>Teilnahme</Link>
          <Link href="/events" className={activeNavItem === '/events' ? 'active' : ''}>Events</Link>
          <Link href="/howto" className={activeNavItem === '/howto' ? 'active' : ''}>How to get started</Link>
          <Link href="/kontakt" className={activeNavItem === '/kontakt' ? 'active' : ''}>Kontakt</Link>
        </nav>
      </div>
    </>
  );
}

function BackgroundSlider() {
  const [images, setImages] = useState<string[]>([]);
  
  useEffect(() => {
    const loadBackgroundImages = () => {
      const isMobile = window.innerWidth < 768;
      
      if (!isMobile && images.length === 0) {
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
        setImages(imageUrls);
      } else if (isMobile && images.length > 0) {
        setImages([]);
      }
    };
    
    loadBackgroundImages();
    window.addEventListener('resize', loadBackgroundImages);
    
    return () => {
      window.removeEventListener('resize', loadBackgroundImages);
    };
  }, [images.length]);
  
  return (
    <div className="background" id="background-slider" style={{ display: images.length > 0 ? 'block' : 'none' }}>
      <div className="slider-container" id="slider-container">
        {images.map((url, index) => (
          <img key={index} src={url} alt="Aircraft Background" className="slider-image" />
        ))}
      </div>
    </div>
  );
}
