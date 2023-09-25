import React from "react";
import Image from "next/image";
import Clockimg from "../../../../public/svgs/clock.svg";
import Phoneimg from "../../../../public/svgs/phone.svg";
import Pinimg from "../../../../public/svgs/pin.svg";
import Twitterimg from "../../../../public/svgs/twitter.svg";
import Linkedinimg from "../../../../public/svgs/linkedin.svg";
import Instagramimg from "../../../../public/svgs/instagram.svg";
import Facebookimg from "../../../../public/svgs/facebook.svg";

import "./contact-header.css";

function ContactHeader() {
  return (
    <>
      <div className="contact-header-container">
        <div className="contact-info">
          <ul>
            <li>
              <Image src={Clockimg} alt={"clock-image"} />
            </li>
            <li>Mon – Fri: (9 AM – 5 PM) </li>
            <li>
              <Image src={Phoneimg} alt={"phone-image"} />{" "}
            </li>
            <li>895 569 0000</li>
            <li>
              <Image src={Pinimg} alt={"pin-image"} />{" "}
            </li>
            <li>Hong Kong</li>
          </ul>
        </div>
        <div className="social-media-icons-container">
          <ul>
            <li>
              <a href="">
                <Image src={Twitterimg} alt={"twitter-image"} />
              </a>
            </li>
            <li>
              <a href="">
                <Image src={Facebookimg} alt={"facebook-image"} />
              </a>
            </li>
            <li>
              <a href="">
                <Image src={Instagramimg} alt={"instagram-image"} />
              </a>
            </li>
            <li>
              <a href="">
                <Image src={Linkedinimg} alt={"linked-image"} />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default ContactHeader;
