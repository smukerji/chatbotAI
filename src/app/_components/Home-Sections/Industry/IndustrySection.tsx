import React from "react";
import Image from "next/image";
import businessIcon from "../../../../../public/sections-images/industry-section/business-icon.webp";
import coinIcon from "../../../../../public/sections-images/industry-section/coin-icon.webp";
import educationIcon from "../../../../../public/sections-images/industry-section/education-icon.webp";
import healthcareIcon from "../../../../../public/sections-images/industry-section/healthcare-icon.webp";
import hotlesIcon from "../../../../../public/sections-images/industry-section/holtes-icon.webp";
import "./industry-section.scss";

export default function IndustrySection() {
  return (
    <>
      <div className="industry-section-container">
        {/* --------------------------left section------------------------------ */}
        <div className="left">
          <h1>AI Chatbot in the Industrial sector</h1>
          <p>
            Discover the future of conversational excellence with Torri AI
            chatbot, your intelligent AI chatbot companion. Elevate your online
            interactions with natural and intuitive conversations.
          </p>
        </div>

        {/* --------------------------right section------------------------------ */}
        <div className="right">
          {/* --------------------------left column------------------------------ */}
          <div className="column-1">
            <div className="empty-box">
              <Image
                src={healthcareIcon}
                alt="healthcare-icon"
                loading="lazy"
              />
              <h3>Healthcare And Wellness</h3>
              <p>
                Torri.AI is the AI chatbot that takes your digital presence to
                the next level
              </p>
            </div>
            <div className="filled-box">
              <Image
                src={healthcareIcon}
                alt="healthcare-icon"
                loading="lazy"
              />
              <h3>Healthcare And Wellness</h3>
              <p>
                No more long waits and queues for doctors. Use Torri AI chatbot
                to have your personal doctor integrated into your life.
              </p>
            </div>
            <div className="filled-box">
              <Image src={hotlesIcon} alt="hotels-icon" loading="lazy" />
              <h3>Hotels And Hospitality</h3>
              <p>
                Hassel free booking and customer support with Torri AI chatbot.
                Enhance the customer experience by having Torri AI as your 24/7
                hotel assistant.
              </p>
            </div>
            <div className="empty-box">
              <Image
                src={healthcareIcon}
                alt="healthcare-icon"
                loading="lazy"
              />
              <h3>Healthcare And Wellness</h3>
              <p>
                Torri.AI is the AI chatbot that takes your digital presence to
                the next level
              </p>
            </div>
          </div>

          {/* --------------------------right column------------------------------ */}
          <div className="column-2">
            <div className="empty-box">
              <Image
                src={healthcareIcon}
                alt="healthcare-icon"
                loading="lazy"
              />
              <h3>Healthcare And Wellness</h3>
              <p>
                No more long waits and queues for doctors. Use Torri.AI to have
                your personal doctor integrated into your life.
              </p>
            </div>
            <div className="filled-box">
              <Image src={educationIcon} alt="education-icon" loading="lazy" />
              <h3>Education And Institutes</h3>
              <p>
                Torri AI chatbot can be your teacher providing real-time
                feedback and assessment tools, simplifying creative learning,
                exam creation, and grading.
              </p>
            </div>
            <div className="filled-box">
              <Image src={businessIcon} alt="business-icon" loading="lazy" />
              <h3>Small Medium Business</h3>
              <p>
                Torri AI chatbot can help businesses to engage with their
                customers in a personalized conversation.
              </p>
            </div>
            <div className="filled-box">
              <Image src={coinIcon} alt="business-icon" loading="lazy" />
              <h3>Nonprofits or B2C</h3>
              <p>
                Make your assistant with Torri AI chatbot to support customer
                inquiries, internal training, FAQ distribution, etc.
              </p>
            </div>
            <div className="empty-box">
              <Image
                src={healthcareIcon}
                alt="healthcare-icon"
                loading="lazy"
              />
              <h3>Healthcare And Wellness</h3>
              <p>
                Torri.AI is the AI chatbot that takes your digital presence to
                the next level
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
