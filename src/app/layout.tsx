import '../styles/globals.css';
import type { Metadata } from 'next';
import BackgroundProvider from '@/components/BackgroundProvider';
import Script from 'next/script';

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
        {/* create a persistent background element before React hydrates to avoid flashes */}
        <Script id="init-global-bg" strategy="beforeInteractive">
          {`(function(){if(window.__globalBgInit)return;window.__globalBgInit=true;try{if(!document.getElementById('global-bg')){var d=document.createElement('div');d.id='global-bg';d.setAttribute('aria-hidden','true');d.style.position='fixed';d.style.inset='0';d.style.zIndex='-2';d.style.transition='opacity .45s ease-in-out, background-image .6s ease-in-out';d.style.opacity='0';d.style.pointerEvents='none';document.body.appendChild(d);} }catch(e){} })();`}
        </Script>
      </head>
      <body>
        <BackgroundProvider>{children}</BackgroundProvider>
      </body>
    </html>
  );
}
