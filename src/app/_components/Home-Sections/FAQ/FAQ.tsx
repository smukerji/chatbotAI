"use client";
import React, { useState } from "react";
import "./faq.scss";
import Image from "next/image";
import featherIcon from "../../../../../public/svgs/Feather Icon.svg";

const FAQ = () => {
  const [activeIndex, setActiveIndex]: any = useState(null);

  const questions = [
    "What is web/mobile app AI-chatbot?",
    "What is web/mobile app AI-chatbot?",
    "Does “ai chatbot” apply to more than the look of a website?",
  ];

  const answers = [
    "Website scraping is a method of extracting data from websites. It involves the use of bots or scripts to systematically download web pages, extract specific data, and save it for later analysis or processing.",
    "We are offering an accessible interface to website or other platforms.",
    "We offer accessible interfaces by creating an accessible platform where users can interact with websites or other platforms without worrying about technical limitations. We have made the interface easy to use, which ensures that users can efficiently navigate and interact with the data they need.",
  ];

  const toggleAccordion = (index: number) => {
    if (activeIndex === index) {
      setActiveIndex(null);
    } else {
      setActiveIndex(index);
    }
  };

  return (
    <div className="faq-section">
      {/* --------------------------left section------------------------------ */}
      <div className="left">
        <h1>How It Works</h1>
        <p>
          We are offering an accessible interface to website or other platforms.
        </p>
      </div>

      {/* --------------------------right section------------------------------ */}
      <div className="right">
        {questions.map((question, index) => (
          <div
            className={`accordion ${activeIndex === index ? "active" : ""}`}
            key={index}
          >
            <button
              className="accordion-btn"
              onClick={() => toggleAccordion(index)}
            >
              {question}
              <Image src={featherIcon} alt="feather-icon" />
            </button>
            <div className="accordion-content">{answers[index]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
