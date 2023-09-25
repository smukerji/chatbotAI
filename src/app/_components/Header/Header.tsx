import React from "react";
import "./header.css";

function Header() {
  return (
    <>
      <div className="header-container">
        <div className="logo">
          <span>LUICIFER.</span>
          <span>AI</span>
        </div>
        <div className="navbar">
          <ul>
            <li>
              <a href="">Home</a>
            </li>

            <li>
              <a href="">Company</a>
            </li>

            <li>
              <a href="">Services</a>
            </li>

            <li>
              <a href="">Testimonials</a>
            </li>

            <li>
              <a href="">AI Chatbot</a>
            </li>

            <li>
              <a href="">Contact</a>
            </li>
          </ul>
        </div>
        <div className="login-signup">Sign up / Login</div>
      </div>
    </>
  );
}

export default Header;
