import React from "react";
import "./future-section.scss";

function FutureSection() {
  return (
    <>
      <section className="future-section">
        <div className="future-content">
          <h1>
            The Future Workforce Is Here.
            <br />
            Are You Ready?
          </h1>
          <button className="start-button">Start Free</button>
          <div className="future-links">
            <a href="#talk-to-ai">Talk to Our AI</a>
            <a href="#ecommerce-agent">Try eCommerce Agent</a>
          </div>
        </div>
      </section>
    </>
  );
}

export default FutureSection;
