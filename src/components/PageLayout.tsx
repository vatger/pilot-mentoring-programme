import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-wrapper">
      <Header />
      <main className="container">
        {children}
      </main>
      <Footer />
    </div>
  );
}
