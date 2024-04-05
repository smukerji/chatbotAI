"use client";
import React, { useState } from "react";
import Image from "next/image";
import LuciferLogo from "../../../../public/svgs/lucifer-ai-logo.svg";
import dynamic from "next/dynamic";
import "./secondary-header.scss";
import { useRouter } from "next/navigation";

const AuthBtn = dynamic(() => import('../../_components/AuthBtn'), {
  ssr: false,
});

function SecondaryHeader() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  return (
    <div className='header-title-container'>
      <Image
        className='logo'
        src={LuciferLogo}
        alt='img-logo'
        onClick={() => {
          router.push('/');
        }}
        style={{ cursor: 'pointer' }}
      />

      <div className={`hamburger-menu-icon`} onClick={toggleMenu}>
        <div className='bar'></div>
        <div className='bar'></div>
        <div className='bar'></div>
      </div>

      <div className={`hamburger-menu ${menuOpen ? 'open' : ''}`}>
        <div className={`navbar `}>
          <ul>
            <li onClick={toggleMenu}>
              <a href="/#features">Features</a>
            </li>

            <li onClick={toggleMenu}>
              <a href="/home/pricing">Pricing</a>
            </li>

            <li onClick={toggleMenu}>
              <a href="/#service-offerings">Service Offerings</a>
            </li>
          </ul>
        </div>

        <div className='login-register-container'>
            {/* If user is logged in display my Chatbot else try for free */}
          <AuthBtn />
        </div>
      </div>
    </div>
  );
}

export default SecondaryHeader;
