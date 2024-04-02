"use client";
import Image from "next/image";
import React, { useState } from "react";
import registerBg from "../../../../../public/sections-images/common/contact-us-bg-cover.png";
import luciferIcon from "../../../../../public/svgs/lucifer-ai-logo.svg";
import { message } from "antd";
import "../reset-password/reset-password.scss";
import axios from "axios";
import { useRouter } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();

  const [newPasswordMessage, setNewPasswordMessage] = useState("");
  const [newConfirmPasswordMessage, setNewConfirmPasswordMessage] =
    useState("");

  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");

  /// function to validate password
  const checkNewPassword = (e: any) => {
    let password: string = e?.target?.value;
    setNewPassword(password);
    setNewPasswordMessage("");
    // if (!password.length) {
    //   setNewPasswordMessage("Please enter your new password!");
    // } else {
    //   setNewPasswordMessage("");
    // }
  };

  /// function to validate password
  const checkNewConfirmPassword = (e: any) => {
    let password: string = e?.target?.value;
    setNewConfirmPassword(password);
    setNewConfirmPasswordMessage("");
    // if (!password.length) {
    //   setNewConfirmPasswordMessage("Please enter confirm password!");
    // } else {
    //   setNewConfirmPasswordMessage("");
    // }
  };

  /// validate the passwords
  async function resetPassword() {
    if (!newPassword.length) {
      setNewPasswordMessage("Please enter your new password!");
    }

    if (!newConfirmPassword.length) {
      setNewConfirmPasswordMessage("Please enter confirm password!");
    }

    if (newPassword != "" && newConfirmPassword != "") {
      if (newPassword !== newConfirmPassword) {
        message.error("Oops! Passwords doesn't match");
      } else {
        /// get the token from url
        const queryString = window.location.search;
        const params: any = new URLSearchParams(queryString);

        // Create an empty object to store the parameters
        const paramsObj: any = {};

        // Iterate over each parameter and store it in the object
        for (const [key, value] of params) {
          paramsObj[key] = value;
        }

        try {
          const response = await axios.post(
            "/api/account/reset-password/change",
            {
              token: paramsObj["token"],
              newPassword: newConfirmPassword,
            }
          );

          if (response.data.status == 400) {
            message.error(response.data.message);
          } else {
            message.success(response.data.message).then(() => {
              router.push("/account/login");
            });
          }
        } catch (error) {}
      }
    }
  }

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
                placeholder="Enter new Password"
                onChange={checkNewPassword}
              />
              <p
                style={{
                  color: "red",
                  margin: "5px 0 0 5px",
                }}
              >
                {newPasswordMessage}
              </p>
            </div>

            <div>
              <input
                type="text"
                placeholder="Confirm new Password"
                onChange={checkNewConfirmPassword}
              />
              <p
                style={{
                  color: "red",
                  margin: "5px 0 0 5px",
                }}
              >
                {newConfirmPasswordMessage}
              </p>
            </div>
          </div>

          <div className="login-register-cotainer">
            <div style={{ width: "fit-content" }}>
              <button
                className="register-btn"
                onClick={() => {
                  resetPassword();
                }}
              >
                Reset password
              </button>
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

export default ResetPasswordForm;
