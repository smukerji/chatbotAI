import ContactHeader from "../_components/Contact-Header/Contact-Header";
import Footer from "../_components/Footer/Footer";
import Header from "../_components/Header/Header";
import AIChatbotSection from "../_components/Home-Sections/Ai-Chatbot/AIChatbotSection";
import CompatibilitySection from "../_components/Home-Sections/Compatibility/CompatibilitySection";
import ContactSection from "../_components/Home-Sections/Contact-US/ContactSection";
import FAQ from "../_components/Home-Sections/FAQ/FAQ";
import FacilitiesSection from "../_components/Home-Sections/Facilities/FacilitiesSection";
import IndustrySection from "../_components/Home-Sections/Industry/IndustrySection";
import PorcessSection from "../_components/Home-Sections/Process/PorcessSection";
import ServicesSection from "../_components/Home-Sections/Services/ServicesSection";
import Testimonials from "../_components/Testimonials/Testimonials";

export default function Home() {
  return (
    <>
      <AIChatbotSection />
      <PorcessSection />
      <FacilitiesSection />
      <IndustrySection />
      <ServicesSection />
      <CompatibilitySection /> 
      <Testimonials />
      {/* responsive almost done till 1200px*/}
      <FAQ />
      <ContactSection />
      <Footer />
    </>
  );
}
