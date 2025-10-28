'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function BackgroundProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  const imagesRef = useRef<string[]>([]);
  const preloadRef = useRef<HTMLImageElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isReadyRef = useRef(false);
  const [hasGlobalBg, setHasGlobalBg] = useState(false);
  const transitioningRef = useRef(false);
  const baseIdxRef = useRef<number>(0);
  const mountedRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    // detect if the persistent global-bg element already exists (client-only)
    try {
      setHasGlobalBg(!!document.getElementById('global-bg'));
    } catch {
      setHasGlobalBg(false);
    }
    // Set theme once
    try {
      const savedTheme = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);
    } catch {
      // ignore
    }

    // Load images depending on viewport width
    const loadBackgroundImages = () => {
      const isMobile = window.innerWidth < 768;

      if (!isMobile) {
            const imageFiles = ['1.PNG', '2.PNG', '3.PNG', '4.PNG', '5.PNG', '6.PNG', '7.PNG', '8.PNG', '9.PNG'];
            const imageUrls = imageFiles.map(file => `/images/${file}`);
        // choose one random image for this page load (do not rotate)
          try {
            const startIdx = Math.floor(Math.random() * imageUrls.length);

            // set images state and ref immediately
            setBackgroundImages(imageUrls);
            imagesRef.current = imageUrls;
            setCurrentImageIndex(startIdx);

            // preload chosen image only (so it displays immediately)
            try {
              if (preloadRef.current) {
                preloadRef.current.onload = null;
                preloadRef.current.onerror = null;
              }
            } catch {}
            const p = new Image();
            p.src = imageUrls[startIdx];
            p.onload = () => {
              setIsReady(true);
              isReadyRef.current = true;
            };
            p.onerror = () => {
              setIsReady(true);
              isReadyRef.current = true;
            };
            preloadRef.current = p;
          } catch {
            // fallback
            setBackgroundImages(imageUrls);
            imagesRef.current = imageUrls;
            setCurrentImageIndex(0);
            setIsReady(true);
            isReadyRef.current = true;
          }
      } else {
        setBackgroundImages([]);
        imagesRef.current = [];
        setIsReady(false);
        isReadyRef.current = false;
      }
    };

    loadBackgroundImages();
    window.addEventListener('resize', loadBackgroundImages);

    return () => {
      window.removeEventListener('resize', loadBackgroundImages);
      // cleanup preloaded image handlers
      try {
        if (preloadRef.current) {
          preloadRef.current.onload = null;
          preloadRef.current.onerror = null;
          preloadRef.current = null;
        }
      } catch {}
      // reset ready ref
      try { isReadyRef.current = false; } catch {}
    };
  }, []);

  // If saved index is larger than available images, clamp it when images change
  useEffect(() => {
    imagesRef.current = backgroundImages;
    if (backgroundImages.length === 0) return;
    setCurrentImageIndex((idx) => idx % backgroundImages.length);
  }, [backgroundImages]);

  // When the route changes, fade from the page background color into the image.
  useEffect(() => {
    // We intentionally do not change visibility or start a fade when the route changes.
    // That keeps the background fully untouched during navigation so animations and timing
    // are not affected. For safety, silently preload the current image if needed.
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    const imgs = imagesRef.current;
    if (!imgs || imgs.length === 0) return;

    const idx = currentImageIndex % imgs.length;
    const url = imgs[idx];
    // silently ensure current image is referenced so browser cache can serve it during navigation
    const p = preloadRef.current;
    if (p && p.src === url) {
      void p.src;
    } else {
      const img = new Image(); img.src = url; preloadRef.current = img;
    }
    return () => {
      // nothing to clean up for preloads
    };
  }, [pathname]);

  const backgroundStyle = backgroundImages.length > 0 && isReady
    ? {
        backgroundImage: `url(${backgroundImages[currentImageIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed' as const,
      }
    : {};
  // If a persistent global-bg element exists (created before hydration), update it directly
  useEffect(() => {
    const root = document.getElementById('global-bg');
    if (!root) return;

    // Ensure two inner layers exist: .bg-base and .bg-top (top kept for future fades)
    let base = root.querySelector<HTMLDivElement>('.bg-base');
    let top = root.querySelector<HTMLDivElement>('.bg-top');
    if (!base) {
      base = document.createElement('div');
      base.className = 'bg-base';
      Object.assign(base.style as any, {
        position: 'absolute', inset: '0', transition: 'none', opacity: '0',
        backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      });
      root.appendChild(base);
    }
    if (!top) {
      top = document.createElement('div');
      top.className = 'bg-top';
      Object.assign(top.style as any, {
        position: 'absolute', inset: '0', transition: 'opacity 0.45s ease-in-out', opacity: '0',
        backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      });
      root.appendChild(top);
    }

    // If we have backgroundImages and a desired index, set the base image once (no rotation)
    if (backgroundImages.length > 0) {
      const idx = currentImageIndex % backgroundImages.length;
      const url = backgroundImages[idx];

      try {
        const prevBaseTransition = base!.style.transition;
        const prevRootTransition = root!.style.transition;
        base!.style.transition = 'none';
        root!.style.transition = 'none';
        base!.style.backgroundImage = `url(${url})`;
        base!.style.opacity = '1';
        root!.style.opacity = '1';
        baseIdxRef.current = idx;
        setIsReady(true);
        isReadyRef.current = true;
        // restore transitions shortly after
        setTimeout(() => {
          base!.style.transition = prevBaseTransition || '';
          root!.style.transition = prevRootTransition || '';
        }, 50);
      } catch {
        base!.style.backgroundImage = `url(${url})`;
        base!.style.opacity = '1';
        root!.style.opacity = '1';
        baseIdxRef.current = idx;
        setIsReady(true);
        isReadyRef.current = true;
      }
    }

    // cleanup not required for these DOM nodes — they persist across navigations
  }, [backgroundImages, currentImageIndex]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* If global-bg exists it will show, otherwise render a local background div */}
      {!hasGlobalBg && (
        <div
          aria-hidden
          className="page-background"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -2,
            transition: 'opacity 0.45s ease-in-out, background-image 0.6s ease-in-out',
            opacity: isReady ? 1 : 0,
            backgroundImage: backgroundImages.length > 0 && isReady ? `url(${backgroundImages[currentImageIndex]})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed' as const,
          }}
        />
      )}
      <div className="page-background-overlay" />
      {children}
    </div>
  );
}
