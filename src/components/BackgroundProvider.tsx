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

  const intervalRef = useRef<number | null>(null);
  const imagesRef = useRef<string[]>([]);
  const [isReady, setIsReady] = useState(false);
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
            const imageFiles = ['1.PNG', '2.PNG', '3.PNG', '5.PNG', '6.PNG', '7.PNG', '8.PNG', '9.PNG'];
            const imageUrls = imageFiles.map(file => `/images/${file}`);
        // preload the image we want to start with, then show background to avoid flashes
        try {
          const saved = localStorage.getItem('backgroundIndex');
          const startIdx = saved !== null && !Number.isNaN(parseInt(saved, 10))
            ? Math.max(0, parseInt(saved, 10) % imageUrls.length)
            : 0;

          // set images state and ref immediately
          setBackgroundImages(imageUrls);
          imagesRef.current = imageUrls;

          // preload chosen image
          const img = new Image();
          img.src = imageUrls[startIdx];
          img.onload = () => {
            setCurrentImageIndex(startIdx);
            setIsReady(true);
          };
          img.onerror = () => {
            // still mark ready to avoid locking the UI
            setCurrentImageIndex(0);
            setIsReady(true);
          };
        } catch {
          // fallback
          setBackgroundImages(imageUrls);
          imagesRef.current = imageUrls;
          setCurrentImageIndex(0);
          setIsReady(true);
        }
      } else {
        setBackgroundImages([]);
        imagesRef.current = [];
        setIsReady(false);
      }
    };

    loadBackgroundImages();
    window.addEventListener('resize', loadBackgroundImages);

    // Start rotation once. Use numeric window timer id for clearInterval compatibility.
    if (intervalRef.current === null) {
      intervalRef.current = window.setInterval(() => {
        // only rotate when ready and images are available
        const imgs = imagesRef.current;
        if (!isReady || !imgs || imgs.length === 0) return;
        setCurrentImageIndex((prev) => {
          const next = (prev + 1) % imgs.length;
          try {
            localStorage.setItem('backgroundIndex', String(next));
          } catch {
            // ignore
          }
          return next;
        });
      }, 8000);
    }

    return () => {
      window.removeEventListener('resize', loadBackgroundImages);
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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
    // silently preload current image (no UI change)
    const img = new Image();
    img.src = url;
    // no onload handler needed — we don't change visibility here
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

    // Ensure two inner layers exist: .bg-base and .bg-top
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

    // helper to crossfade to a given image url (unchanged behavior)
    const crossfadeTo = (url: string, idx: number) => {
      if (!top || !base) return;
      if (transitioningRef.current) return; // don't overlap transitions
      transitioningRef.current = true;

      // preload image
      const img = new Image();
      img.src = url;
      img.onload = () => {
        // set top background to loaded image, then fade it in
        top!.style.backgroundImage = `url(${url})`;
        // ensure stacking
        top!.style.zIndex = '0';
        base!.style.zIndex = '-1';
        // start fade
        requestAnimationFrame(() => {
          top!.style.opacity = '1';
        });
        // after transition, move image to base and reset top
        const onEnd = () => {
          base!.style.backgroundImage = `url(${url})`;
          top!.style.opacity = '0';
          baseIdxRef.current = idx;
          transitioningRef.current = false;
          top!.removeEventListener('transitionend', onEnd);
          setIsReady(true);
        };
        top!.addEventListener('transitionend', onEnd);
      };
      img.onerror = () => {
        transitioningRef.current = false;
        setIsReady(true);
      };
    };

    // If we have backgroundImages and a desired index, ensure the persistent layers show the correct image
    if (backgroundImages.length > 0) {
      const idx = currentImageIndex % backgroundImages.length;
      const url = backgroundImages[idx];

      // check currently applied base url (normalize)
      const currentBase = (base.style.backgroundImage || '').replace(/^url\(("|')?/, '').replace(/("|')?\)$/, '');

      // If base already matches desired url, ensure element visible state follows isReady
      if (currentBase === url && base.style.opacity !== '1') {
        // make sure root & base are visible (no transition needed)
        try {
          const prevBaseTransition = base!.style.transition;
          const prevRootTransition = root!.style.transition;
          base!.style.transition = 'none';
          root!.style.transition = 'none';
          base!.style.opacity = '1';
          root!.style.opacity = '1';
          baseIdxRef.current = idx;
          setIsReady(true);
          // restore transitions shortly after
          setTimeout(() => {
            base!.style.transition = prevBaseTransition || '';
            root!.style.transition = prevRootTransition || '';
          }, 50);
        } catch {
          base!.style.opacity = '1';
          root!.style.opacity = '1';
          baseIdxRef.current = idx;
          setIsReady(true);
        }
      } else if (currentBase !== url) {
        // If the base is showing a different image (from previous navigation), hide it instantly,
        // preload the desired image, then set it without transition so no intermediate image flashes.
        try {
          // immediately hide visible layers without transition
          const prevBaseTransition = base!.style.transition;
          const prevRootTransition = root!.style.transition;
          base!.style.transition = 'none';
          top!.style.transition = 'none';
          root!.style.transition = 'none';
          base!.style.opacity = '0';
          top!.style.opacity = '0';
          root!.style.opacity = '0';

          // preload
          const img0 = new Image();
          img0.src = url;
          img0.onload = () => {
            // set base image and reveal root + base instantly (no fade)
            base!.style.backgroundImage = `url(${url})`;
            base!.style.opacity = '1';
            root!.style.opacity = '1';
            baseIdxRef.current = idx;
            setIsReady(true);

            // restore transitions shortly after so future crossfades work
            setTimeout(() => {
              base!.style.transition = prevBaseTransition || '';
              top!.style.transition = 'opacity 0.45s ease-in-out';
              root!.style.transition = prevRootTransition || '';
            }, 50);
          };
          img0.onerror = () => {
            // If preload fails, still reveal to avoid blocking UI
            base!.style.opacity = '1';
            root!.style.opacity = '1';
            baseIdxRef.current = idx;
            setIsReady(true);
            // restore transitions
            setTimeout(() => {
              base!.style.transition = prevBaseTransition || '';
              top!.style.transition = 'opacity 0.45s ease-in-out';
              root!.style.transition = prevRootTransition || '';
            }, 50);
          };
        } catch {
          // fallback: set directly
          base!.style.backgroundImage = `url(${url})`;
          base!.style.opacity = '1';
          root!.style.opacity = '1';
          baseIdxRef.current = idx;
          setIsReady(true);
        }
      }
    }

    // cleanup not required for these DOM nodes — they persist across navigations
  }, [backgroundStyle, isReady, backgroundImages, currentImageIndex]);

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
            ...backgroundStyle,
          }}
        />
      )}
      <div className="page-background-overlay" />
      {children}
    </div>
  );
}
