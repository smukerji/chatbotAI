import React from "react";
import Image from "next/image";
import quoteIcon from "../../../../../public/sections-images/testimonials-section/Quote.svg";
import authorIcon from "../../../../../public/sections-images/testimonials-section/Human.svg";
import "./testimonials.scss";

function Testimonials() {
  return (
    <div className="testimonials-section">
      {/* --------------------------top section------------------------------ */}
      <div className="top">
        <p>
          We are offering an accessible interface to website or other platforms.
        </p>
        <h1>Some of our testimonials</h1>
      </div>
      {/* --------------------------bottom section------------------------------ */}
      <div className="bottom">
        <div className="testimonial-container">
          <Image className="quote-img" src={quoteIcon} alt="quote-icon" />
          <p>
            You can and should set your own limits and clearly articulate them.
            This takes courage, but it is also liberating and empowering and
            often earns you new respect.
          </p>
          <div className="author-details">
            <Image src={authorIcon} alt="author-icon" />
            <div>
              <h4>Rosalind Brewer</h4>
              <p>CEO of Walgreens Boots Alliance</p>
            </div>
          </div>
        </div>

        <div className="testimonial-container">
          <Image className="quote-img" src={quoteIcon} alt="quote-icon" />
          <p>
            If what you are doing is not moving you towards your personal goals,
            then it’s moving you away from your personal goals
          </p>
          <div className="author-details">
            <Image src={authorIcon} alt="author-icon" />
            <div>
              <h4>Brian Tracy</h4>
              <p>Canadian motivational speaker</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Testimonials;
