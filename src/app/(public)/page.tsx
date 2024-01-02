import React from "react";
import HeroHeader from "../_components/Hero-Header/HeroHeader";
import ServiceSection from "../_components/Home-Sections/Services/ServiceSection";
import FacilitiesSection from "../_components/Home-Sections/Facilities/FacilitiesSection";
import IndustrySection from "../_components/Home-Sections/Industry/IndustrySection";
import ServicesOffered from "../_components/Home-Sections/Services-Offered/ServicesOffered";
import CompatibilitySection from "../_components/Home-Sections/Compatibility/CompatibilitySection";
import Testimonials from "../_components/Home-Sections/Testimonials/Testimonials";
import PlansSection from "../_components/Home-Sections/Plans-Section/PlansSection";
import FAQ from "../_components/Home-Sections/FAQ/FAQ";
import ContactSection from "../_components/Home-Sections/Contact-US/ContactSection";
import Footer from "../_components/Footer/Footer";

function Home() {
  return (
    <>
      <HeroHeader />
      <ServiceSection />
      <FacilitiesSection />
      <IndustrySection />
      <ServicesOffered />
      <CompatibilitySection />
      <Testimonials />
      <PlansSection />
      <FAQ />
      <ContactSection />
      <Footer />
    </>
  );
}

export default Home;
