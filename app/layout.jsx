import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Minerva Application Companion',
  description: 'A comprehensive web application to support prospective students in applying to Minerva University. Built by a current Minerva student.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
