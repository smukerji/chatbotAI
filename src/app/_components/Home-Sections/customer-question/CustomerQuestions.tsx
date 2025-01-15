import React from "react";
import "./customer-question.scss";
import Img1 from "../../../../../public/sections-images/customer-questions/image 57.png";
import Image from "next/image";
import Link from "next/link";

function CustomerQuestions() {
  return (
    <div className="customer-question-section">
      <div className="left">
        <h1 className="title">
          Resolve 90% of your customer questions with Torri AI Chatbot
        </h1>
        <p className="description">
          Build your own Torri bot with 1-click, embed it on your website and
          let it handle customer support, lead generation, engage with your
          users, and more. Train the AI chatbot with your own data.
        </p>

        <Link
          style={{ color: "white", textDecoration: "none" }}
          href="/account/register"
        >
          <button className="sign-up-btn">Register for Torri AI</button>
        </Link>
      </div>
      <div className="right">
        <Image src={Img1} alt="image" loading="lazy" />
      </div>
    </div>
  );
}

export default CustomerQuestions;
