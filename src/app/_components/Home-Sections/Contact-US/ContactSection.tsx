"use client";
import React, { useState } from "react";
import Image from "next/image";
import contactBGImg from "../../../../../public/sections-images/common/contact-us-bg.png";
import "./contact-section.scss";
import contact from "../../../../../public/sections-images/common/connect.svg";
import { Form, Input, message } from "antd";

function ContactSection() {
  const [form] = Form.useForm();

  const validateMessages = {
    required: "${label} is required!",
    types: {
      email: "${label} is not a valid email!",
      number: "${label} is not a valid number!",
    },
  };

  const onFinish = async (values: any) => {
    try {
      const result = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}api/contact-mail/api`,{
        method:'POST',
        body:JSON.stringify({values}),
        next: { revalidate: 0 },
      }) 
      const resp = await result.json()
      if(resp.status !== 200){
        message.error(resp.message)
      }
      else{
        message.success(resp.message)
      }
    } catch (error) {
      console.log("error sending mail.")
    }
  };

  return (
    <div className="contact-section" id="contact-us">
      {/* --------------------------left section------------------------------ */}
      <div className="left">
        <h1>Join the future of AI chatbots today with Lucifer.AI</h1>
        <p>
          We&rsquo;d love to talk about your right-now challenges and share our
          insights on how to conquer them with Lucifer.AI
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
          <Form
            form={form}
            onFinish={onFinish}
            layout="vertical"
            validateMessages={validateMessages}
          >
            <Form.Item name="name" rules={[{ required: true }]}>
              <Input placeholder="Name" />
            </Form.Item>
            <Form.Item
              name="mobile"
              rules={[
                {
                  required: true,
                  message: "Please input your mobile number!",
                },
              ]}
            >
              <Input placeholder="Mobile" />
            </Form.Item>
            <Form.Item name="email" rules={[{ type: "email", required: true }]}>
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item name="message" rules={[{ required: true }]}>
              <Input placeholder="Message" />
            </Form.Item>
            <Form.Item>
              <button className="submit-btn">Submit</button>
            </Form.Item>
          </Form>
        </div>
      </div>
      {/* --------------------------right section------------------------------ */}
      <div className="right">
        <Image src={contact} alt="contact-us-img" />
      </div>
    </div>
  );
}

export default ContactSection;
