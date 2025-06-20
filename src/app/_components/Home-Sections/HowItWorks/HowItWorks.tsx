"use client";
import React from "react";
import { Button, Typography, Row, Col, Tag } from "antd";
import cartIcon from "../../../../../public/sections-images/how-it-works/shopping-cart.svg";
import userIcon from "../../../../../public/sections-images/how-it-works/profile-circle.svg";
import questionIcon from "../../../../../public/sections-images/how-it-works/message-question.svg";
import moneyIcon from "../../../../../public/sections-images/how-it-works/money-send.svg";
import heartIcon from "../../../../../public/sections-images/how-it-works/like.svg";
import bagHappy from "../../../../../public/sections-images/how-it-works/bag-happy.svg";
import refreshIcon from "../../../../../public/sections-images/how-it-works/refresh.svg";
import micIcon from "../../../../../public/sections-images/how-it-works/microphone-2.svg";

const { Title, Paragraph } = Typography;
import "./how-it-works.scss";
import Image from "next/image";
import { useRouter } from "next/navigation";

const features = [
  {
    icon1: bagHappy,
    icon2: userIcon,
    title: "Tailored Buying Journeys, Every Time",
    description:
      "No more guessing what your customers want. Torri guides each shopper with personalized picks, bundles, and expert-style recommendations — like a smart concierge in your store, but better.",
  },
  {
    icon1: questionIcon,
    icon2: heartIcon,
    title: "Instant Answers That Build Trust",
    description:
      "“What size fits me?” “Is this in stock?” Torri answers those questions in seconds — reducing doubts, removing friction, and helping your customers feel confident enough to click “buy.”",
  },
  {
    icon1: cartIcon,
    icon2: refreshIcon,
    title: "Bring Back Lost Carts — Automatically",
    description: `We've all abandoned a cart before. Torri gently follows up with the right nudge — whether it's a reminder, a discount, or a quick question — all done automatically through voice or chat.`,
  },
  {
    icon1: moneyIcon,
    icon2: micIcon,
    title: "Talk. Shop. Done.",
    description:
      "Shopping with voice is no longer science fiction. With Torri, customers can find products, ask about them, and even check out — all by talking. It's fast, easy, and surprisingly delightful.",
  },
];

function HowItWorks() {
  const router = useRouter();
  return (
    <>
      <div className="how-it-works">
        <div className="hero">
          <span className="badge">How It Works</span>
          <Title level={2} className="hero-title">
            The AI Salesperson That Converts While You Sleep
          </Title>
          <Paragraph className="hero-subtitle">
            Imagine having a sales expert on your team who never takes a break,
            answers every question, and knows exactly what each customer needs.
            That&apos;s what Torri does — in chat and voice — 24/7.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            className="try-agent-button"
            onClick={() =>
              router.push(
                "/home/chat?agent=alina&assistantId=asst_hBQgfWqUb7ppxKa9K0bGYyjq"
              )
            }
          >
            Try eCommerce Agent
          </Button>
        </div>

        <Row gutter={[24, 24]} className="feature-grid">
          {features.map((feature, index) => (
            <Col xs={24} md={12} key={index}>
              <div className="feature-card">
                <div className="feature-icon">
                  <div className="background-circle" />
                  <div className="icon-wrapper-1">
                    <Image src={feature.icon1} alt="icon1" className="icon1" />
                  </div>
                  <div className="icon-wrapper-2">
                    <Image src={feature.icon2} alt="icon2" className="icon2" />
                  </div>
                </div>
                <Title level={5}>{feature.title}</Title>
                <Paragraph>{feature.description}</Paragraph>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </>
  );
}

export default HowItWorks;
