import React from "react";
import "./ai-workforce.scss";
import Image from "next/image";
import img1 from "../../../../../public/sections-images/ai-workforce/1.png";
import img2 from "../../../../../public/sections-images/ai-workforce/2.png";
import img3 from "../../../../../public/sections-images/ai-workforce/3.png";
import img4 from "../../../../../public/sections-images/ai-workforce/4.png";
import img5 from "../../../../../public/sections-images/ai-workforce/5.png";

const steps = [
  {
    title:
      "Pick a role: Sales, Support, HR, or Custom — choose the agent you need most.",
    image: img1,
  },
  {
    title:
      "Upload your content : Drop in docs, guides, FAQs, or web links. Torri learns instantly.",
    image: img2,
  },
  {
    title:
      "Customize tone & voice : Make it match your brand — from warm and friendly to sharp and expert.",
    image: img3,
  },
  {
    title:
      "Deploy anywhere :Add to your website, WhatsApp, app, or even your phone system.",
    image: img4,
  },
  {
    title:
      "Track & improve : See performance metrics. Train with feedback. Scale effortlessly.",
    image: img5,
  },
];
function AIWorkforce() {
  return (
    <>
      <section className="how-it-works">
        <span className="badge">How it works</span>
        <h2>Create Your Own AI Workforce in Minutes</h2>
        <p className="subtitle">Build Your AI Dream Team — No Code, No Delay</p>
        <div className="steps">
          {steps.map((step, index) => (
            <div className="step" key={index}>
              <div className="icon-wrapper">
                <Image src={step.image} alt={`Step ${index + 1}`} />
              </div>
              <p>{step.title}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default AIWorkforce;
