import React from "react";
import "./terms.scss";
import SecondaryHeader from "../../_components/Secondary-Header/SecondaryHeader";
import Footer from "../../_components/Footer/Footer";
import { generateMetadata } from "@/app/_helpers/pageSeo";
import TermsPolicy from "@/app/_components/Terms/Terms";

export const metadata = generateMetadata({
  title: "Torri.AI Terms & Conditions | Legal Agreement",
  description:
    "Explore Torri.AI's Terms & Conditions. Understand the rules governing our AI chatbot service. Read and agree to the legal relationship.",
  canonical: "/terms",
});

function Terms() {
  return (
    <>
      <SecondaryHeader />
      <TermsPolicy />

      <Footer />
    </>
  );
}

export default Terms;
