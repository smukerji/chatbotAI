"use client";
import React, { useRef, useEffect } from "react";
import "./ai-worker.scss";
import Image from "next/image";
import jacobImg from "../../../../../public/sections-images/digital-worker/1.png";
import alinaImg from "../../../../../public/sections-images/digital-worker/2.png";
import zaraImg from "../../../../../public/sections-images/digital-worker/3.png";
import speedLead from "../../../../../public/sections-images/digital-worker/user-cirlce-add.svg";
import inboundConversion from "../../../../../public/sections-images/digital-worker/message-add.svg";
import winRate from "../../../../../public/sections-images/digital-worker/cup.svg";
import { useRouter } from "next/navigation";

const JACOB_ASSISTANT_ID = process.env.NEXT_PUBLIC_JACOB_ASSISTANT_ID;
const ALINA_ASSISTANT_ID = process.env.NEXT_PUBLIC_ALINA_ASSISTANT_ID;
const ZARA_ASSISTANT_ID = process.env.NEXT_PUBLIC_ZARA_ASSISTANT_ID;

const workers = [
  {
    name: "Jacob",
    role: "Research Assistant (AI Chat)",
    img: jacobImg,
    description:
      "Jacob is your always-on research assistant, built to scan, summarize, and respond with speed and precision. Whether you're doing competitive analysis, preparing reports, or brainstorming content, Jacob connects the dots faster than any intern ever could.",
    id: JACOB_ASSISTANT_ID,
    btnText: "Chat with Jacob →",
  },
  {
    name: "Alina",
    role: "eCommerce Advisor (Voice AI + Shopify)",
    img: alinaImg,
    description:
      "Alina is your eCommerce powerhouse — guiding shoppers with tailored product advice, handling queries, recovering carts, and even closing voice-based sales. She's fully integrated with Shopify and speaks like your best salesperson.",
    id: ALINA_ASSISTANT_ID,
    btnText: "Talk to Alina →",
  },
  {
    name: "Zara",
    role: "HR Copilot (Internal Knowledge Bot)",
    img: zaraImg,
    description:
      "From “How many annual leaves do I have?” to “Where's the reimbursement form?” — Zara has the answers. She handles your team's everyday HR queries, policy explanations, and onboarding steps with empathy and clarity.",
    id: ZARA_ASSISTANT_ID,
    btnText: "Chat with Zara →",
  },
];

function AIWorker() {
  const router = useRouter();
  const digitalWorkersRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const digitalWorkers = digitalWorkersRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!digitalWorkers || !scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      if (!scrollContainer.contains(e.target as Node)) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isScrollingDown = e.deltaY > 0;
        const isScrollingUp = e.deltaY < 0;
        const atTop = scrollTop === 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

        // Only prevent default if not at the edge in the scroll direction
        if ((isScrollingDown && !atBottom) || (isScrollingUp && !atTop)) {
          scrollContainer.scrollTop += e.deltaY * 4;
          e.preventDefault();
        }
        // If at edge, let event bubble to allow main page scroll
      }
    };
    digitalWorkers.addEventListener("wheel", onWheel, { passive: false });
    return () => digitalWorkers.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <section className="digital-workers" ref={digitalWorkersRef}>
      <div className="left-pane">
        <span className="badge">Digital Worker</span>
        <h2>The Future is Lifelike: Meet Your Human-Smart AI Workers</h2>
        <p>
          Seamless, scalable, and shockingly human. These AI agents don’t just
          answer — they understand, adapt, and elevate how your business works.
        </p>
        <a href="#">Create Your First AI Worker →</a>
      </div>
      <div className="middle-pane">
        <div className="scroll-container" ref={scrollContainerRef}>
          {workers.map((worker, i) => (
            <div className="card" key={i}>
              <div className="card-left">
                <Image src={worker.img} alt={worker.name} />
                <h3>
                  {worker.name}&nbsp;<span>| {worker.role}</span>
                </h3>
                <p>{worker.description}</p>
                <button
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    router.push(
                      `/home/chat?agent=${worker.name.toLowerCase()}&assistantId=${
                        worker.id
                      }`
                    )
                  }
                >
                  {worker.btnText}
                </button>
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
