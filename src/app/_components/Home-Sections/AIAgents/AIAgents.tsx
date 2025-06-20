import React from "react";
import "./ai-agents.scss";
import Image from "next/image";
import img1 from "../../../../../public/sections-images/ai-agents/1.png";
import img2 from "../../../../../public/sections-images/ai-agents/2.png";
import img3 from "../../../../../public/sections-images/ai-agents/3.png";
import img4 from "../../../../../public/sections-images/ai-agents/4.png";
import img5 from "../../../../../public/sections-images/ai-agents/5.png";

const agents1 = [
  {
    title1: `Sales Enablement`,
    title2: "Sell Smarter, Not Harder",
    description:
      "Equip your sales team with an AI assistant that handles lead qualification, follow-ups, and product explanations — so your reps can close faster and smarter.",
    icon: img1,
  },
  {
    title1: "Customer Service & Support",
    title2: "Delight Customers, 24/7",
    description:
      "Never miss a ticket or lose a lead again. Torri handles FAQs, complaints, and live escalations with empathy and speed — across web, WhatsApp, and voice.",
    icon: img2,
  },
];
const agents2 = [
  {
    title1: "Onboarding & HR",
    title2: "Automate Internal Answers Instantly",
    description:
      "From HR policies to IT onboarding and invoice lookups, Torri handles it all — freeing your team from repetitive questions.",
    icon: img3,
  },
  {
    title1: "eCommerce Experience",
    title2: "Turn Browsers Into Buyers",
    description:
      "Give your shoppers a voice-powered, chat-friendly assistant that helps them find the right product, compare options, and check out — all without human delay.",
    icon: img4,
  },
  {
    title1: "Marketing Automation",
    title2: "Content That Writes Itself",
    description:
      "Let Torri generate blog posts, emails, landing pages, and social captions from your data and insights. Consistent messaging, lower cost, faster execution.",
    icon: img5,
  },
];

export default function AiAgents() {
  return (
    <section className="ai-agents-section">
      <h5 className="sub-heading">AI Across Every Function</h5>
      <h2 className="main-heading">
        AI Agents for Every Corner <br /> of Your Business
      </h2>
      <p className="section-desc">
        Whether you run a startup or a scale-up, Torri integrates like a digital
        teammate — trained to support your team across sales, support, HR,
        marketing, and more. Plug it in. Power up.
      </p>

      <div className="agents-row agents-row-1">
        {agents1.map((agent, index) => (
          <div className="agent-card row-1" key={index}>
            <div className="icon-wrapper">
              <div className="icon-glow" />
              <Image src={agent.icon} alt={agent.title1} />
            </div>
            <h3 className="agent-title">{agent.title1}</h3>
            <h3 className="agent-title">{agent.title2}</h3>

            <p className="agent-desc">{agent.description}</p>
          </div>
        ))}
      </div>

      <div className="agents-row agents-row-2">
        {agents2.map((agent, index) => (
          <div className="agent-card row-2" key={index}>
            <div className="icon-wrapper">
              <div className="icon-glow" />
              <Image src={agent.icon} alt={agent.title1} />
            </div>
            <h3 className="agent-title">{agent.title1}</h3>
            <h3 className="agent-title">{agent.title2}</h3>
            <p className="agent-desc">{agent.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
