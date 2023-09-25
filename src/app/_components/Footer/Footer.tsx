import Image from "next/image";
import React from "react";
import Twitterimg from "../../../../public/svgs/twitter.svg";
import Linkedinimg from "../../../../public/svgs/linkedin.svg";
import Instagramimg from "../../../../public/svgs/instagram.svg";
import Facebookimg from "../../../../public/svgs/facebook.svg";
import BlackPhoneImg from "../../../../public/svgs/blackphone.svg";
import BlackPinImg from "../../../../public/svgs/blackpin.svg";
import BlackEnvelopImg from "../../../../public/svgs/blackenvelope.svg";
import RightArrow from "../../../../public/svgs/white-arrow-right.svg";

import "./footer.css";

function Footer() {
  return (
    <div className="footer-section">
      <div className="footer-container">
        {/*------------------------------------------description container----------------------------------------------*/}
        <div className="description-container">
          <div className="logo">
            <span>LUICIFER.</span>
            <span>AI</span>
          </div>

          <div className="description">
            Lorem ipsum dolor sit amet, consectetur ad consectetur adipiscing
            elit ut aliquam, purus. vLorem ipsum dolor sit amet, consectetur ad
            consectetur adipiscing elit ut aliquam, purus.Lorem ipsum dolor sit
            amet, consectetur ad consectetur adipiscing elit ut aliquam, purus.
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

        {/*------------------------------------------useful-links container----------------------------------------------*/}
        <div className="other-container">
          <h2>Usefull Links</h2>
          <ul>
            <li>
              <a href="">Home</a>
            </li>
            <li>
              <a href="">Service</a>
            </li>
            <li>
              <a href="">Testimonials</a>
            </li>
            <li>
              <a href="">Contact Us </a>
            </li>
            <li>
              <a href="">Cost Calculator </a>
            </li>
            <li>
              <a href="">Our locations</a>
            </li>
          </ul>
        </div>

        {/*------------------------------------------our-service container----------------------------------------------*/}
        <div className="other-container">
          <h2>Usefull Links</h2>
          <ul>
            <li>
              <a href="">Web AI CHATBOT Tool</a>
            </li>
            <li>
              <a href="">AI CHATBOT Remediation </a>
            </li>
            <li>
              <a href="">AI CHATBOT Monitoring</a>
            </li>
            <li>
              <a href="">Our philosophy and process</a>
            </li>
            <li>
              <a href="">Web AI CHATBOT Consulting</a>
            </li>
            <li>
              <a href="">Multimedia CHATBOT</a>
            </li>
          </ul>
        </div>

        {/*------------------------------------------contact-us container----------------------------------------------*/}
        <div className="other-container">
          <h2>Contact Us</h2>
          <ul>
            <li>
              <Image src={BlackPinImg} alt="black-pin-img" />
              <a href="">808 Platinum Avenue, Essex Baltimore, Odisha 21221</a>
            </li>
            <li>
              <Image src={BlackPhoneImg} alt="black-phone-img" />
              <a href="">503-928-0000</a>
            </li>
            <li>
              <Image src={BlackEnvelopImg} alt="black-envelop-img" />
              <a href="">info@aichatbot.com</a>
            </li>
            <li>
              <button className="get-direction-btn">
                Get directions
                <Image src={RightArrow} alt="right-arrow-img" />
              </button>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="copyright-section">Copyright © 2023 LUCIFER AI</div>
    </div>
  );
}

export default Footer;
