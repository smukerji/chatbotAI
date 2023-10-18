import React, { useState } from "react";
import Image from "next/image";
import PlusImg from "../../../../../public/sections-images/common/plus-bullet.svg";
import MinusImg from "../../../../../public/sections-images/common/minus-bullet.svg";

function Accordion({
  title,
  content,
  isOpen,
  onClick,
}: {
  title: string;
  content: string;
  isOpen: any;
  onClick: any;
}) {
  return (
    <div
      className={`accordion ${isOpen ? "open background" : ""} `}
      onClick={onClick}
    >
      <div className="accordion-header">
        <Image src={isOpen ? PlusImg : MinusImg} alt="faq-image" />
        <h3>{title}</h3>
      </div>
      {isOpen && <div className="accordion-content">{content}</div>}
    </div>
  );
}

export default Accordion;
