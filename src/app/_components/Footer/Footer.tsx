"use client";

import React, { useState } from "react";
import Image from "next/image";
import logoWhite from "../../../../public/svgs/lucifer-ai-logo-white.svg";
import bluePhone from "../../../../public/svgs/bluephone.svg";
import bluePin from "../../../../public/svgs/bluepin.svg";
import blueEnvelopImg from "../../../../public/svgs/bluesms.svg";
import Twitterimg from "../../../../public/svgs/twitter-icon-white.svg";
import Linkedinimg from "../../../../public/svgs/linkedin-icon-white.svg";
import Instagramimg from "../../../../public/svgs/instagram-icon-white.svg";
import Facebookimg from "../../../../public/svgs/facebook-icon-white.svg";
import "./footer.scss";
import SupportModal from "../../(secure)/chatbot/dashboard/_components/Modal/SupportModal";
import Link from "next/link";
import data from "../../_helpers/data/footer.json";
import Widget from "./Widget";

function Footer() {
  /// state for opening support modal
  const [openSupport, setOpenSupport] = useState(false);
  const { company, legal, quickLink } = data?.data || {};
  return (
    <div className="footer-section">
      <SupportModal
        openSupport={openSupport}
        setOpenSupport={setOpenSupport}
        centered={false}
      />
      <div className="footer-container">
        {/*------------------------------------------company address container----------------------------------------------*/}
        <div className="company-details-container">
          <Image src={logoWhite} alt="logo-white" loading="lazy" />
          <ul className="info">
            <li>
              <Image src={bluePin} alt="blue-pin-img" loading="lazy" />
              <Link href="#">
                Unit F, 18/F Wordtech centre. 95 How Ming Street, Kwun Tong,
                Hong Kong
              </Link>
            </li>
            <li>
              <Image src={bluePhone} alt="blue-phone-img" />
              <Link href="">+852 55 445532</Link>
            </li>
            <li>
              <Image src={blueEnvelopImg} alt="blue-envelop-img" />
              <Link
                href="https://mail.google.com/mail/?view=cm&fs=1&to=info@torri.ai"
                target="_blank"
                className="mail"
              >
                info@torri.ai
              </Link>
            </li>
          </ul>

          {/* <div className="social-media-icons-container"> */}
          {/* <ul className="social-media-icons-container">
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
          </ul> */}
        </div>
        {/* </div> */}

        {/*------------------------------------------company links container----------------------------------------------*/}
        <Widget
          title={company.title}
          list={company.list}
          setOpenSupport={setOpenSupport}
        />

        {/*------------------------------------------quick links container----------------------------------------------*/}
        <Widget
          title={quickLink.title}
          list={quickLink.list}
          setOpenSupport={setOpenSupport}
        />

        {/*------------------------------------------legal links container----------------------------------------------*/}
        <Widget
          title={legal.title}
          list={legal.list}
          setOpenSupport={setOpenSupport}
        />

        <div className="links-container">
          <select name="" id="" className="temp">
            <option value="english">English</option>
            <option value="chinese">Chinese</option>
          </select>
        </div>
      </div>

      <div className="copyright-section">
        Copyright © 2023 SAP Alliance & Creole Studios
      </div>
    </div>
  );
}

export default Footer;
