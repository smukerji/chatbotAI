"use client";
import Image from "next/image";
import React, { useState } from "react";
import registerBg from "../../../../../public/sections-images/common/contact-us-bg-cover.png";
import luciferIcon from "../../../../../public/svgs/lucifer-ai-logo.svg";
import { Spin, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import "./reset-password.scss";
import axios from "axios";
import { useRouter } from "next/navigation";

function ResetPassword() {
  const router = useRouter();
  /// first name, last name, email and password messages state
  const [emailMessage, setEmailMessage]: any = useState("");
  /// first name, last name, email and password storing state
  const [email, setEmail]: any = useState(null);
  const [loading, setLoading] = useState(false);
  const antIcon = (
    <LoadingOutlined
      style={{ fontSize: 24, color: "black", margin: "10px 0" }}
      spin
    />
  );

  /// function to validate email
  const checkEmail = (e: any) => {
    let email: string = e?.target?.value;
    if (email == "") {
      setEmailMessage("Please enter email");
      return;
    }
    setEmail(email);

    const pattern = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;

    /// validate email
    const result = email?.match(pattern);

    if (!result) {
      setEmailMessage("Invalid email address format");
    } else {
      setEmailMessage("");
    }

    // const email.(pattern)
  };

  const sendPasswordResetEmail = async () => {
    if (emailMessage == "" && email) {
      try {
        const response = await axios.post("/api/account/reset-password", {
          email: email,
        });

        message.success(response.data.message).then(() => {
          router.push("/account/login");
        });
      } catch (error: any) {
        if (error?.response?.data?.message) {
          message.error(error?.response?.data?.message);
        } else {
          message.error(error?.message);
        }
      }
    }
  };

  return (
    <div className="register-container">
      {/* --------------------------left section------------------------------ */}
      <div className="left">
        <Image src={registerBg} alt="register-background" />
      </div>
      {/* --------------------------right section------------------------------ */}
      <div className="right">
        <Image
          src={luciferIcon}
          alt="lucifer-logo"
          onClick={() => (window.location.href = "/")}
          style={{ cursor: "pointer" }}
        />
        <div className="register-form">
          <h1>
            <span>Reset Password</span>
          </h1>

          <div className="reset-details">
            Enter your email to receive instructions on how to reset your
            password.
          </div>
          <div className="input-container">
            <div>
              <input
                type="text"
                placeholder="Enter your Email"
                onBlur={checkEmail}
              />
              <p
                style={{
                  color: "red",
                  margin: "5px 0 0 5px",
                }}
              >
                {emailMessage}
              </p>
            </div>
          </div>

          <div className="login-register-cotainer">
            <div style={{ width: "fit-content" }}>
              <button
                className="register-btn"
                onClick={() => {
                  sendPasswordResetEmail();
                }}
              >
                Reset password
              </button>
              {loading && (
                <Spin style={{ width: "100%" }} indicator={antIcon} />
              )}
            </div>

            <div className="section">
              <label>Remember your password?</label> <a href="login">Login</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
