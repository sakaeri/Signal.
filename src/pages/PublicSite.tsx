import { LanguageProvider } from '../i18n/LanguageContext';
import { BookingProvider } from '../context/BookingContext';
import { SiteDataProvider } from '../context/SiteDataContext';
import Nav from '../components/Nav';
import Hero from '../components/Hero';
import Events from '../components/Events';
import About from '../components/About';
import Journey from '../components/Journey';
import Faq from '../components/Faq';
import ApplyForm from '../components/ApplyForm';
import Footer from '../components/Footer';

export default function PublicSite() {
  return (
    <LanguageProvider>
      <SiteDataProvider>
        <BookingProvider>
          <div id="top">
            <Nav />
            <Hero />
            <Events />
            <About />
            <Journey />
            <Faq />
            <ApplyForm />
            <Footer />
          </div>
        </BookingProvider>
      </SiteDataProvider>
    </LanguageProvider>
  );
}
