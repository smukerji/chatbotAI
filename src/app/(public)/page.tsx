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
import CustomerQuestions from "../_components/Home-Sections/customer-question/CustomerQuestions";
import HeroSection from "../_components/HeroSection/HeroSection";
import SecondaryHeader from "../_components/Secondary-Header/SecondaryHeader";
import FeaturesSection from "../_components/Features-Section/FeaturesSection";
import { generateMetadata } from "../_helpers/pageSeo";
import ReactGoogleReCaptcha from "../_components/ReactGoogleRecaptcha";

export const metadata = generateMetadata({ canonical: "/" });
function Home() {
  return (
    <>
      {/* <HeroHeader /> */}
      <SecondaryHeader />
      <HeroSection />
      {/* <ServiceSection /> */}
      <CustomerQuestions />
      <FeaturesSection />
      {/* <FacilitiesSection /> */}
      <IndustrySection />
      <ServicesOffered />
      <CompatibilitySection />
      {/* <Testimonials /> */}
      {/* <PlansSection /> */}
      {/* <FAQ /> */}
      <ReactGoogleReCaptcha>
        <ContactSection />
      </ReactGoogleReCaptcha>
      <Footer />
    </>
  );
}

export default Home;
