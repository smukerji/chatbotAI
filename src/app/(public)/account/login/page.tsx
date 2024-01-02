"use client";
import React, { useState } from "react";
import Image from "next/image";
import loginBg from "../../../../../public/sections-images/common/contact-us-bg-cover.png";
import luciferIcon from "../../../../../public/svgs/lucifer-ai-logo.svg";
import googleIcon from "../../../../../public/google-icon-blue.svg";
import githubIcon from "../../../../../public/github-icon-blue.svg";
import "./login.scss";
import { signIn, useSession } from "next-auth/react";
import { LoadingOutlined } from "@ant-design/icons";
import { redirect } from "next/navigation";
import { useUserService } from "../../../_services/useUserService";
import { Spin, message } from "antd";

function Login() {
  /// email and password messages state
  const [emailMessage, setEmailMessage]: any = useState("");
  const [passwordMessage, setPasswordMessage]: any = useState("");

  /// email and password storing state
  const [email, setEmail]: any = useState(null);
  const [password, setPassword]: any = useState(null);

  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const antIcon = (
    <LoadingOutlined
      style={{ fontSize: 24, color: "black", margin: "10px 0" }}
      spin
    />
  );

  if (status === "authenticated") {
    redirect("/home");
  }

  const userService = useUserService();
  /// when the form is submitted
  const login = () => {
    /// check if anything is empty
    if (email == null) {
      setEmailMessage("Invalid email address format");
      return;
    }

    if (password == null) {
      setPasswordMessage("Please input your password!");
      return;
    }

    setLoading(true);
    userService.login(email, password).then((data: any) => {
      if (!data?.username) {
        message.error(data);
      } else {
        message.success(`Welcome back ${data?.username}`);
        window.location.reload(); // Refresh the page
      }
      setLoading(false);
    });
  };

  /// function to validate email
  const checkEmail = (e: any) => {
    let email: string = e?.target?.value;
    setEmail(email);

    const pattern = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    //   message: "Invalid email address format",

    /// validate email
    const result = email?.match(pattern);

    if (!result) {
      setEmailMessage("Invalid email address format");
    } else {
      setEmailMessage("");
    }

    // const email.(pattern)
  };

  /// function to validate password
  const checkPassword = (e: any) => {
    let password: string = e?.target?.value;
    setPassword(password);

    if (!password.length) {
      setPasswordMessage("Please input your password!");
    } else {
      setPasswordMessage("");
    }
  };
  return (
    <div className="login-container">
      {/* --------------------------left section------------------------------ */}
      <div className="left">
        <Image src={loginBg} alt="login-background" />
      </div>
      {/* --------------------------right section------------------------------ */}
      <div className="right">
        <Image src={luciferIcon} alt="lucifer-logo" />
        <div className="login-form">
          <h1>Welcome back! Glad to see you, Again!</h1>

          <div className="input-container">
            <div>
              <input
                type="text"
                placeholder="Enter your email"
                onChange={checkEmail}
              />
              <span>{emailMessage}</span>
            </div>
            <div>
              <input
                type="password"
                placeholder="Enter your password"
                onChange={checkPassword}
              />
              <span>{passwordMessage}</span>
            </div>
            <a href="">Forgot password?</a>
          </div>

          <div className="login-register-cotainer">
            <div>
              <button
                className="login-btn"
                onClick={() => {
                  if (emailMessage == "" && passwordMessage == "") login();
                }}
              >
                Log In
              </button>
              {loading && <Spin style={{ width: "20%" }} indicator={antIcon} />}
            </div>

            <div className="section">
              <label>Or Login with</label>

              <button onClick={() => signIn("google")}>
                <Image src={googleIcon} alt="" />
                <span>Google</span>
              </button>

              <button onClick={() => signIn("github")}>
                <Image src={githubIcon} alt="" />
                <span>Github</span>
              </button>
            </div>

            <div className="section">
              <label>Don&rsquo;t have account?</label>

              <a href="/account/register">Register Now</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
