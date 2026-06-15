import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Jobo Classes - Government Exam Preparation',
  description: 'Video courses, mock tests and notes for government exam preparation.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>
          <Navbar />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
