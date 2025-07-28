import '../styles/globals.css';
import type { Metadata } from 'next';
import BackgroundProvider from '@/components/BackgroundProvider';
import React, { useState, useEffect } from 'react';

export const metadata: Metadata = {
  title: 'VATSIM Germany PMP',
  description: 'Piloten-Mentoren-Programm von VATSIM Germany',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <BackgroundProvider>
        {children}
      </BackgroundProvider>
    </html>
  );
  // Background image logic moved inside the component
  const [backgroundImages, setBackgroundImages] = React.useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
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
    <html lang="de">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={backgroundStyle}>
        <div className="page-background-overlay"></div>
        {children}
      </body>
    </html>
  );
}
