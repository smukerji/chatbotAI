"use client";
import React from "react";
import Image from "next/image";
import "./contact-section.scss";
import contact from "../../../../../public/sections-images/common/connect.svg";
import { Form } from "antd";
import ZohoForm from "./zohoForm/ZohoForm";

function ContactSection() {
  const [form] = Form.useForm();

  // const validateMessages = {
  //   required: "${label} is required!",
  //   types: {
  //     email: "${label} is not a valid email!",
  //     number: "${label} is not a valid number!",
  //   },
  // };

  return (
    <div className="contact-section" id="contact-us">
      {/* --------------------------left section------------------------------ */}
      <div className="left">
        <h1>Join the future of AI Chatbots Today with Torri AI</h1>
        <p>
          We&rsquo;d love to talk about your right-now challenges and share our
          insights on how to conquer them with Torri AI.
        </p>

        {/* --------------------------input container------------------------------ */}
        {/* <div className='input-container'>
          <input type='text' placeholder='Name' />
          <input type='text' placeholder='Mobile' />
          <input type='text' placeholder='Email' />
          <input type='text' placeholder='Message' />
          <button className='submit-btn' 
          // onClick={sendMail}
          >Submit</button>
        </div> */}

        {/* ---------------------for input container (test) */}
        <div className="input-container">
          {" "}
          <ZohoForm />
        </div>
      </div>
      {/* --------------------------right section------------------------------ */}
      <div className="right">
        <Image src={contact} alt="contact-us-img" loading="lazy" />
      </div>
    </div>
  );
}

export default ContactSection;
