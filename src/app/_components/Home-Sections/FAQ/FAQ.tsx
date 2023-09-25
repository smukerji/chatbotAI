"use client";
import React, { useState } from "react";
import Image from "next/image";
import "./faq.css";
import Accordion from "./Accordion";
import FAQImg from "../../../../../public/sections-images/faq-section/faq-img.svg";

function FAQ() {
  const accordionData = [
    {
      title: "What is web/mobile app AI-chatbot?",
      content:
        "Lorem ipsum dolor sit amet, consectetur ad consectetur adipiscing elit ut aliquam, purus. Lorem ipsum dolor sit amet, consectetur ad consectetur adipiscing elit ut aliquam, purus.Lorem ipsum dolor sit amet, consectetur ad consectetur adipiscing elit ut aliquam, purus.",
    },
    {
      title: "What is web/mobile app AI-chatbot?",
      content:
        "Lorem ipsum dolor sit amet, consectetur ad consectetur adipiscing elit ut aliquam, purus. Lorem ipsum dolor sit amet, consectetur ad consectetur adipiscing elit ut aliquam, purus.Lorem ipsum dolor sit amet, consectetur ad consectetur adipiscing elit ut aliquam, purus.",
    },
    {
      title: "What is web/mobile app AI-chatbot?",
      content:
        "Lorem ipsum dolor sit amet, consectetur ad consectetur adipiscing elit ut aliquam, purus. Lorem ipsum dolor sit amet, consectetur ad consectetur adipiscing elit ut aliquam, purus.Lorem ipsum dolor sit amet, consectetur ad consectetur adipiscing elit ut aliquam, purus.",
    },
  ];

  const [openItemIndex, setOpenItemIndex]: any = useState(null);

  const handleItemClick = (index: number) => {
    if (index === openItemIndex) {
      setOpenItemIndex(null); // Close the clicked item if it's already open
    } else {
      setOpenItemIndex(index); // Open the clicked item
    }
  };
  return (
    <div className="faq-section-container">
      {/* ------------------------------left section------------------------------- */}
      <div className="left">
        <div className="faq-text">
          FAQ’S
          <div className="faq-welcome-text">FAQS AND ANSWERS</div>
        </div>

        {/* -------- faq-list --------- */}
        <div className="faq-list-container">
          {accordionData.map((item, index): any => {
            return (
              <>
                <Accordion
                  key={index}
                  title={item.title}
                  content={item.content}
                  isOpen={index === openItemIndex}
                  onClick={() => handleItemClick(index)}
                />
                <hr />
              </>
            );
          })}
        </div>
        <button className="contact-demo-button">Contact for demo</button>
      </div>

      {/* ------------------------------right section------------------------------- */}
      <div className="right">
        <Image src={FAQImg} alt="faq-section-image" />
      </div>
    </div>
  );
}

export default FAQ;
