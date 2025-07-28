'use client';

import { useEffect, useState } from 'react';

export default function BackgroundProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Set up background images for desktop
    const loadBackgroundImages = () => {
      const isMobile = window.innerWidth < 768;
      
      if (!isMobile && backgroundImages.length === 0) {
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
        setBackgroundImages(imageUrls);
      } else if (isMobile && backgroundImages.length > 0) {
        setBackgroundImages([]);
      }
    };
    
    loadBackgroundImages();
    window.addEventListener('resize', loadBackgroundImages);
    
    // Background image rotation
    const rotateInterval = setInterval(() => {
      if (backgroundImages.length > 0) {
        setCurrentImageIndex((prevIndex) => 
          (prevIndex + 1) % backgroundImages.length
        );
      }
    }, 8000); // Change every 8 seconds
    
    return () => {
      window.removeEventListener('resize', loadBackgroundImages);
      clearInterval(rotateInterval);
    };
  }, [backgroundImages.length]);

  const backgroundStyle = backgroundImages.length > 0 
    ? { 
        backgroundImage: `url(${backgroundImages[currentImageIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } 
    : {};

  return (
    <body style={backgroundStyle}>
      <div className="page-background-overlay"></div>
      {children}
    </body>
  );
}
