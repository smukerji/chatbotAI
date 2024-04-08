"use client";
import React, { useState } from "react";
import Image from "next/image";
import registerBg from "../../../../../public/sections-images/common/contact-us-bg-cover.png";
import luciferIcon from "../../../../../public/svgs/lucifer-ai-logo.svg";
import googleIcon from "../../../../../public/google-icon-blue.svg";
import githubIcon from "../../../../../public/github-icon-blue.svg";
import "./register.scss";
import { signIn, useSession } from "next-auth/react";
import { LoadingOutlined } from "@ant-design/icons";
import { redirect, useRouter } from "next/navigation";
import { useUserService } from "../../../_services/useUserService";
import { Spin, message } from "antd";
import openEyeIcon from "../../../../../public/svgs/open-eye.svg";
import closeEyeIcon from "../../../../../public/svgs/close-eye.svg";

function Register() {
  const router = useRouter();

  /// irst name, last name, email and password messages state
  const [emailMessage, setEmailMessage]: any = useState("");
  const [passwordMessage, setPasswordMessage]: any = useState("");
  const [firstNameMessage, setFirstNameMessage]: any = useState("");
  const [lastNameMessage, setLastNameMessage]: any = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /// first name, last name, email and password storing state
  const [email, setEmail]: any = useState(null);
  const [password, setPassword]: any = useState(null);
  const [firstName, setFirstName]: any = useState(null);
  const [lastName, setLastName]: any = useState(null);

  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const antIcon = (
    <LoadingOutlined
      style={{ fontSize: 24, color: "black", margin: "10px 0" }}
      spin
    />
  );

  if (status === "authenticated") {
    // redirect("/chatbot");
    // router.push("/chatbot");
    window.location.href = "/chatbot";
  }
  const userService = useUserService();

  /// when the form is submitted
  const register = async () => {
    /// check if anything is empty
    if (firstName == null) {
      setFirstNameMessage("Please input your First Name!");
      return;
    }

    if (lastName == null) {
      setLastNameMessage("Please input your Last Name!");
      return;
    }

    if (email == null) {
      setEmailMessage("Invalid email address format");
      return;
    }

    if (password == null) {
      setPasswordMessage("Please input your password!");
      return;
    }
    setLoading(true);

    await userService
      .register({
        username: `${firstName}_${lastName}`,
        email,
        password,
        id: "",
      })
      .then((data: any) => {
        if (data) {
          if (data?.message) message.success(data?.message);
          else message.error(data);
        }
        setLoading(false);
      });
  };

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

  /// function to validate first name
  const checkFirstName = (e: any) => {
    let firstName: string = e?.target?.value;
    setFirstName(firstName);

    if (!firstName.length) {
      setFirstNameMessage("Please input your First Name!");
    } else {
      setFirstNameMessage("");
    }
  };

  /// function to validate last name
  const checklastName = (e: any) => {
    let lastName: string = e?.target?.value;
    setLastName(lastName);

    if (!lastName.length) {
      setLastNameMessage("Please input your Last Name!");
    } else {
      setLastNameMessage("");
    }
  };

  /// to toggle eye icon
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            <span>Welcome! </span>
            <span>Get Started for Free!</span>
          </h1>

          <div className="input-container">
            <div>
              <input
                type="text"
                placeholder="Enter your First Name"
                onChange={checkFirstName}
                onKeyDown={(e) => {
                  if (e.key == "Enter")
                    if (
                      emailMessage == "" &&
                      passwordMessage == "" &&
                      firstNameMessage == "" &&
                      lastNameMessage == ""
                    )
                      register();
                }}
              />
              <p
                style={{
                  color: "red",
                  margin: "5px 0 0 5px",
                }}
              >
                {firstNameMessage}
              </p>
            </div>
            <div>
              <input
                type="text"
                placeholder="Enter your Last Name"
                onChange={checklastName}
                onKeyDown={(e) => {
                  if (e.key == "Enter")
                    if (
                      emailMessage == "" &&
                      passwordMessage == "" &&
                      firstNameMessage == "" &&
                      lastNameMessage == ""
                    )
                      register();
                }}
              />
              <p
                style={{
                  color: "red",
                  margin: "5px 0 0 5px",
                }}
              >
                {lastNameMessage}
              </p>
            </div>
            <div>
              <input
                type="text"
                placeholder="Enter your Email"
                onBlur={checkEmail}
                onKeyDown={(e) => {
                  if (e.key == "Enter")
                    if (
                      emailMessage == "" &&
                      passwordMessage == "" &&
                      firstNameMessage == "" &&
                      lastNameMessage == ""
                    )
                      register();
                }}
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
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your Password"
                onChange={checkPassword}
                onKeyDown={(e) => {
                  if (e.key == "Enter")
                    if (
                      emailMessage == "" &&
                      passwordMessage == "" &&
                      firstNameMessage == "" &&
                      lastNameMessage == ""
                    )
                      register();
                }}
              />
              <Image
                className="eye-icon"
                src={showPassword ? openEyeIcon : closeEyeIcon}
                alt="eye-icon"
                width={24}
                height={24}
                onClick={togglePasswordVisibility}
              />
              <p
                style={{
                  color: "red",
                  margin: "5px 0 0 5px",
                }}
              >
                {passwordMessage}
              </p>
            </div>
          </div>

          <div className="login-register-cotainer">
            <div style={{ width: "fit-content" }}>
              <button
                className="register-btn"
                onClick={() => {
                  if (
                    emailMessage == "" &&
                    passwordMessage == "" &&
                    firstNameMessage == "" &&
                    lastNameMessage == ""
                  )
                    register();
                }}
              >
                Create Account
              </button>
              {loading && (
                <Spin style={{ width: "100%" }} indicator={antIcon} />
              )}
            </div>

            <div className="section">
              <label>Or Register with</label>

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
              <label>Already have an account?</label>

              <a href="/account/login">Log In</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
