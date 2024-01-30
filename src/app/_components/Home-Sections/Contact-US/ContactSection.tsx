import React from "react";
import Image from "next/image";
import contactBGImg from "../../../../../public/sections-images/common/contact-us-bg.png";
import "./contact-section.scss";

function ContactSection() {
  return (
    <div className="contact-section" id="contact-us">
      {/* --------------------------left section------------------------------ */}
      <div className="left">
        <h1>Let&rsquo;s Connect!</h1>
        <p>
          We&rsquo;d love to talk about your right-now challenges and share our
          insights on how to conquer them with Lucifer.AI
        </p>

        {/* --------------------------input container------------------------------ */}
        <div className="input-container">
          <input type="text" placeholder="Name" />
          <input type="text" placeholder="Mobile" />
          <input type="text" placeholder="Email" />
          <input type="text" placeholder="Message" />
          <button className="submit-btn">Submit</button>
        </div>
      </div>
      {/* --------------------------right section------------------------------ */}
      <div className="right">
        <Image src={contactBGImg} alt="contact-us-img" />
      </div>
    </div>
  );
}

export default ContactSection;
