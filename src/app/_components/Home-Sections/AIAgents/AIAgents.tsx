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
    title: "Sales Enablement",
    description:
      "Torri AI is intelligent to find answers for your for your research papers, and books. Upload a book and chat with it.",
    icon: img1,
  },
  {
    title: "Customer Service & Support",
    description:
      "Torri AI is intelligent to find answers for your for your research papers, and books. Upload a book and chat with it.",
    icon: img2,
  },
];
const agents2 = [
  {
    title: "Onboarding & HR",
    description:
      "Torri AI is intelligent to find answers for your for your research papers, and books. Upload a book and chat with it.",
    icon: img3,
  },
  {
    title: "eCommerce Experience",
    description:
      "Torri AI is intelligent to find answers for your for your research papers, and books. Upload a book and chat with it.",
    icon: img4,
  },
  {
    title: "Marketing Automation",
    description:
      "Torri AI is intelligent to find answers for your for your research papers, and books. Upload a book and chat with it.",
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
        Let your team focus on strategy. Let Torri handle the busywork.
      </p>

      <div className="agents-row agents-row-1">
        {agents1.map((agent, index) => (
          <div className="agent-card" key={index}>
            <div className="icon-wrapper">
              <div className="icon-glow" />
              <Image src={agent.icon} alt={agent.title} />
            </div>
            <h3 className="agent-title">{agent.title}</h3>
            <p className="agent-desc">{agent.description}</p>
          </div>
        ))}
      </div>

      <div className="agents-row agents-row-2">
        {agents2.map((agent, index) => (
          <div className="agent-card" key={index}>
            <div className="icon-wrapper">
              <div className="icon-glow" />
              <Image src={agent.icon} alt={agent.title} />
            </div>
            <h3 className="agent-title">{agent.title}</h3>
            <p className="agent-desc">{agent.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
