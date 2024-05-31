"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import LuciferLogo from "../../../../public/svgs/lucifer-ai-logo.svg";
import dynamic from "next/dynamic";
import "./secondary-header.scss";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AuthBtn = dynamic(() => import("../../_components/AuthBtn"), {
  ssr: false,
});

function SecondaryHeader() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null); // Define the type of menuRef
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    // Add event listener when menu is open
    if (menuOpen) {
      document.addEventListener("click", handleOutsideClick);
    } else {
      // Remove event listener when menu is closed
      document.removeEventListener("click", handleOutsideClick);
    }

    return () => {
      // Cleanup: remove event listener when component unmounts
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [menuOpen]);

  return (
    <div className="header-title-container">
      <Image
        className="logo"
        src={LuciferLogo}
        alt="img-logo"
        onClick={() => {
          router.push("/");
        }}
        style={{ cursor: "pointer" }}
      />

      <div className={`hamburger-menu-icon`} onClick={toggleMenu}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      <div ref={menuRef} className={`hamburger-menu ${menuOpen ? "open" : ""}`}>
        <div className={`navbar `}>
          <ul>
            <li
              onClick={() => {
                toggleMenu();
              }}
            >
              <Link href="/#features">Features</Link>
            </li>

            <li onClick={toggleMenu}>
              <Link href="/home/pricing">Pricing</Link>
            </li>

            <li
              onClick={() => {
                toggleMenu();
              }}
            >
              <Link href="/#service-offerings">Service Offerings</Link>
            </li>

            <li onClick={toggleMenu}>
              <a href="/blog">Blog</a>
            </li>
          </ul>
        </div>

        <div className="login-register-container">
          {/* If user is logged in display my Chatbot else try for free */}
          <AuthBtn />
        </div>
      </div>
    </div>
  );
}

export default SecondaryHeader;
