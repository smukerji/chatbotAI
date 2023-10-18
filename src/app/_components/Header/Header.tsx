"use client";
import React from "react";
import "./header.css";
import dynamic from "next/dynamic";

const AuthBtn = dynamic(() => import("../AuthBtn"), { ssr: false });

function Header() {
  return (
    <>
      <div className="header-container">
        <div className="logo">
          <span>LUCIFER.</span>
          <span>AI</span>
        </div>
        <div className="navbar">
          <ul>
            <li>
              <a href="/">Home</a>
            </li>

            <li>
              <a href="/#service">Services</a>
            </li>

            <li>
              <a href="/#testimonials">Testimonials</a>
            </li>

            <li>
              <a href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot`}>
                AI Chatbot
              </a>
            </li>

            <li>
              <a href="/#contact">Contact</a>
            </li>
          </ul>
        </div>
        <AuthBtn />

        {/* neeed to chanhe here */}
        {/* <div className="login-signup">Sign up / Login</div> */}
      </div>
    </>
  );
}

export default Header;
