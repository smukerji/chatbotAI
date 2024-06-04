import React from "react";
import PricingWrapper from "./_components/pricingWrapper";
import { generateMetadata } from "@/app/_helpers/pageSeo";

export const metadata = generateMetadata({
  title: "Torri.AI Pricing Plans | Build AI Chatbots with Ease",
  description:
    "Explore Torri.AI's pricing options for AI chatbot development. Choose from individual and agency plans, plus integration add-ons. Get started today!",
  canonical: "/home/pricing",
});

export default function Home() {
  return <PricingWrapper />;
}
