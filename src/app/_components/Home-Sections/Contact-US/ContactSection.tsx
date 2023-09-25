import React from "react";
import "./contact-section.css";
import Image from "next/image";
import PhoneImg from "../../../../../public/svgs/whitephone.svg";
import PinImg from "../../../../../public/svgs/whitepin.svg";
import TimeImg from "../../../../../public/svgs/clock.svg";

function ContactSection() {
  return (
    <div className="contact-us-section-container">
      <div className="contact-text">Contact</div>
      <div className="contact-us-form">
        {/* ------------------------------left section------------------------------- */}
        <div className="left">
          <h3 className="welcome-text">Contact US</h3>
          <ul>
            <li>
              <>
                <Image src={PhoneImg} alt="phone-img" />
                +1-503-928-5984
              </>
            </li>

            <li>
              <Image src={PinImg} alt="pin-img" />
              121 Street Drive, Newyork 45478
            </li>

            <li>
              <Image src={TimeImg} alt="time-img" />
              MONDAY - SUNDAY
              <br />
              09:00am - 5:00pm
            </li>
          </ul>
        </div>

        {/* ------------------------------right section------------------------------- */}
        <div className="right">
          <div className="welcome-text">STAY IN CONTACT</div>
          <div className="form-title">Contact for demo</div>
          <div className="form-inputs">
            <input type="text" placeholder="NAME" />
            <input type="text" placeholder="MOBILE" />
            <input type="text" placeholder="EMAIL" />
            <textarea placeholder="MESSAGE" />
            <button >SUBMIT</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactSection;
