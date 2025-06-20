"use client";
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import quoteIcon from "../../../../../public/sections-images/testimonials-section/Quote.svg";
import authorIcon from "../../../../../public/sections-images/testimonials-section/user.png";

import "./testimonials.scss";

const testimonialsData = [
  {
    quote:
      "Torri helped us respond to 95% of support tickets in real time. Our customers love the instant help — and our team has cut workload in half.",
    author: "Rocky",
    position: "General Manager, iChef Hong Kong",
  },
  {
    quote:
      "In just 3 weeks, our AI agent recovered $6.2K in abandoned carts — with personalized product nudges via WhatsApp and voice. It's a game changer.",
    author: "Sarah",
    position: "Founder, Bloom & Blush",
  },
  {
    quote:
      "We use Torri for order tracking and invoice automation. It integrated with our ERP in a day, and reduced manual errors by over 70%.",
    author: "Amir",
    position: "CTO, FleetKart Logistics",
  },
  {
    quote:
      "Our voice agent demo converted 18% of visitors in a week. It's like having a sales team working 24/7 without lifting a finger.”",
    author: "Jenna",
    position: "Head of Growth, StashThreads",
  },
  {
    quote:
      "Torri's AI agent handles 80% of our customer queries on WhatsApp. It's like having a personal assistant for every shopper.",
    author: "Alex",
    position: "Customer Experience Lead, ShopSmart",
  },
];

function Testimonials() {
  const scrollRef = useRef(null);
  useEffect(() => {
    const slider: any = scrollRef.current;
    if (!slider) return;

    let isDown = false;
    let startX: any;
    let scrollLeft: any;

    const handleMouseDown = (e: any) => {
      if (e.button !== 0) return; // Only respond to left-click
      isDown = true;
      slider.classList.add("dragging");
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      slider.classList.remove("dragging");
    };

    const handleMouseUp = () => {
      isDown = false;
      slider.classList.remove("dragging");
    };

    const handleMouseMove = (e: any) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      slider.scrollLeft = scrollLeft - walk;
    };

    const handleWheel = (e: any) => {
      e.preventDefault();
      slider.scrollLeft += e.deltaY;
    };

    slider.addEventListener("mousedown", handleMouseDown);
    slider.addEventListener("mouseleave", handleMouseLeave);
    slider.addEventListener("mouseup", handleMouseUp);
    slider.addEventListener("mousemove", handleMouseMove);
    slider.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      slider.removeEventListener("mousedown", handleMouseDown);
      slider.removeEventListener("mouseleave", handleMouseLeave);
      slider.removeEventListener("mouseup", handleMouseUp);
      slider.removeEventListener("mousemove", handleMouseMove);
      slider.removeEventListener("wheel", handleWheel);
    };
  }, []);
  return (
    // <div className="testimonials-section">
    //   {/* --------------------------top section------------------------------ */}
    //   <div className="top">
    //     <p>
    //       We are offering an accessible interface to website or other platforms.
    //     </p>
    //     <h1>Some of our testimonials</h1>
    //   </div>
    //   {/* --------------------------bottom section------------------------------ */}
    //   <div className="bottom">
    //     <div className="testimonial-container">
    //       <Image className="quote-img" src={quoteIcon} alt="quote-icon" />
    //       <p>
    //         You can and should set your own limits and clearly articulate them.
    //         This takes courage, but it is also liberating and empowering and
    //         often earns you new respect.
    //       </p>
    //       <div className="author-details">
    //         <Image src={authorIcon} alt="author-icon" />
    //         <div>
    //           <h4>Rosalind Brewer</h4>
    //           <p>CEO of Walgreens Boots Alliance</p>
    //         </div>
    //       </div>
    //     </div>

    //     <div className="testimonial-container">
    //       <Image className="quote-img" src={quoteIcon} alt="quote-icon" />
    //       <p>
    //         If what you are doing is not moving you towards your personal goals,
    //         then it’s moving you away from your personal goals
    //       </p>
    //       <div className="author-details">
    //         <Image src={authorIcon} alt="author-icon" />
    //         <div>
    //           <h4>Brian Tracy</h4>
    //           <p>Canadian motivational speaker</p>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>

    <section className="testimonials-section">
      <span className="badge">What client say?</span>
      <h2 className="testimonials-title">
        Don&apos;t Take Our Word for It — Take Theirs
      </h2>
      <p className="sub-heading">
        Real teams. Real results. From retail to logistics, these leaders turned
        AI into their secret weapon for faster growth, smoother ops, and better
        customer experiences.
      </p>
      <div className="testimonials-grid" ref={scrollRef}>
        {testimonialsData.map((testimonial, index) => (
          <div key={index} className="testimonial-card">
            <div className="testimonial-quote">
              <Image src={quoteIcon} alt="quote-icon" />
            </div>
            <p>{testimonial.quote}</p>
            <hr className="hr-line" />
            <div className="testimonial-user">
              <Image src={authorIcon} alt="User" className="user-avatar" />
              <div>
                <h4>{testimonial.author}</h4>
                <span>{testimonial.position}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
