import React from "react";
import "./ai-worker.scss";
import Image from "next/image";
import jacobImg from "../../../../../public/sections-images/digital-worker/1.png";
import alinaImg from "../../../../../public/sections-images/digital-worker/2.png";
import zaraImg from "../../../../../public/sections-images/digital-worker/3.png";
import speedLead from "../../../../../public/sections-images/digital-worker/user-cirlce-add.svg";
import inboundConversion from "../../../../../public/sections-images/digital-worker/message-add.svg";
import winRate from "../../../../../public/sections-images/digital-worker/cup.svg";

const workers = [
  {
    name: "Jacob",
    role: "Research Assistant (AI Chat)",
    img: jacobImg,
    description:
      "Automate sales conversations, qualify leads, and provide personalized recommendations—all with a human-like touch.",
  },
  {
    name: "Alina",
    role: "eCommerce Assistant (AI Chat)",
    img: alinaImg,
    description:
      "Automate eCommerce customer support, recommend products, and upsell — all powered by AI.",
  },
  {
    name: "Zara",
    role: "Onboard & HR Assistant (AI Chat)",
    img: zaraImg,
    description:
      "Streamline onboarding, answer HR FAQs, and assist employees with self-service support 24/7.",
  },
];

function AIWorker() {
  return (
    <section className="digital-workers">
      <div className="left-pane">
        <span className="badge">Digital Worker</span>
        <h2>
          The Future is <br /> Lifelike: AI That <br /> Feels Natural
        </h2>
        <p>
          We believe in a world where AI seamlessly integrates into our daily
          tasks—seeing, hearing, and collaborating just like humans. A natural
          human voice is the key to making AI assistants truly effective,
          ensuring smooth conversations, better engagement, and enhanced
          productivity.
        </p>
        <a href="#">Create Custom Agent →</a>
      </div>
      <div className="middle-pane">
        <div className="scroll-container">
          {workers.map((worker, i) => (
            <div className="card" key={i}>
              <div className="card-left">
                <Image src={worker.img} alt={worker.name} />
                <h3>
                  {worker.name}&nbsp;<span>| {worker.role}</span>
                </h3>
                <p>{worker.description}</p>
                <button>Try chat →</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="right-pane">
        <ul className="stats">
          <li>
            <Image src={speedLead} alt="Speed to lead" />
            <span>Speed to lead</span>
            <strong>&lt;20%</strong>
          </li>
          <li>
            <Image src={inboundConversion} alt="Inbound conversion" />
            <span>Inbound conversion %</span>
            <strong>+61%</strong>
          </li>
          <li>
            <Image src={winRate} alt="Win rate" />
            <span>Win rate</span>
            <strong>+3.5%</strong>
          </li>
        </ul>
      </div>
    </section>
  );
}

export default AIWorker;
