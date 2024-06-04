import React from "react";
import "../terms/terms.scss";
import SecondaryHeader from "../../_components/Secondary-Header/SecondaryHeader";
import Footer from "../../_components/Footer/Footer";
import { generateMetadata } from "@/app/_helpers/pageSeo";
import Privacy from "@/app/_components/Privacy/Privacy";

export const metadata = generateMetadata({
  title: "Torri.AI Privacy Policy | Data Use & Protection",
  description:
    "Understand how Torri.AI collects, uses, and protects your data. Learn about our Privacy Policy for the Service. Contact us for inquiries.",
  canonical: "/privacy",
});

function Terms() {
  return (
    <>
      <SecondaryHeader />
      <Privacy />

      <Footer />
    </>
  );
}

export default Terms;
