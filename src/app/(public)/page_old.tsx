import ContactHeader from "../_components/Contact-Header/Contact-Header";
import Footer from "../_components/Footer/OldFooter";
import Header from "../_components/Header/Header";
import AIChatbotSection from "../_components/Home-Sections/Ai-Chatbot/AIChatbotSection";
import CompatibilitySection from "../_components/Home-Sections/Compatibility/OldCompatibilitySection";
import ContactSection from "../_components/Home-Sections/Contact-US/OldContactSection";
import FAQ from "../_components/Home-Sections/FAQ/OldFAQ";
import FacilitiesSection from "../_components/Home-Sections/Facilities/OldFacilitiesSection";
import IndustrySection from "../_components/Home-Sections/Industry/OldIndustrySection";
import PorcessSection from "../_components/Home-Sections/Process/PorcessSection";
import ServicesSection from "../_components/Home-Sections/Services/OldServicesSection";
import Testimonials from "../_components/Home-Sections/Testimonials/OldTestimonials";

export default function Home() {
  return (
    <>
      <AIChatbotSection />
      <PorcessSection />
      <FacilitiesSection />
      <IndustrySection />
      <div id="service">
        <ServicesSection />
      </div>
      <CompatibilitySection />
      <div id="testimonials">
        <Testimonials />
      </div>
      <FAQ />
      <div id="contact">
        <ContactSection />
      </div>
      <Footer />
    </>
  );
}
