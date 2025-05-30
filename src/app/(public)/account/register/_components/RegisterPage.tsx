"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import registerBg from "../../../../../../public/sections-images/common/contact-us-bg-cover.png";
import luciferIcon from "../../../../../../public/svgs/lucifer-ai-logo.svg";
import googleIcon from "../../../../../../public/google-icon-blue.svg";
import githubIcon from "../../../../../../public/github-icon-blue.svg";
import "../register.scss";
import { signIn, useSession } from "next-auth/react";
import { LoadingOutlined } from "@ant-design/icons";
import { redirect, useRouter } from "next/navigation";
import { useUserService } from "../../../../_services/useUserService";
import { Modal, Spin, message } from "antd";
import openEyeIcon from "../../../../../../public/svgs/open-eye.svg";
import closeEyeIcon from "../../../../../../public/svgs/close-eye.svg";
import useVerifyReCaptcha from "@/app/_helpers/useVerifyRecaptcha";
import CaptchaErrorMessage from "@/app/_components/CaptchaErrorMessage";

function RegisterPage() {
  const router = useRouter();
  const { handleReCaptchaVerify, captchaVerifyMessage } = useVerifyReCaptcha();
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const antIcon = (
    <LoadingOutlined
      style={{ fontSize: 24, color: "black", margin: "10px 0" }}
      spin
    />
  );

  useEffect(() => {
    if (status === "authenticated") {
      // redirect("/chatbot");
      // router.push("/chatbot");
      message.success("Registered Successfully").then(() => {
        window.location.href = "/chatbot";
      });
    }
  }, [status]);
  const userService = useUserService();

  /// when the form is submitted
  const register = async () => {
    let isCaptchaVerify = await handleReCaptchaVerify();
    /// check if anything is empty or not
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
    setIsModalOpen(true);
    if (isCaptchaVerify) {
      // setLoading(true);
      // await userService
      //   .register({
      //     username: `${firstName}_${lastName}`,
      //     email,
      //     password,
      //     id: "",
      //   })
      //   .then((data: any) => {
      //     if (data) {
      //       if (data?.message) message.success(data?.message);
      //       else message.error(data);
      //     }
      //     setLoading(false);
      //   });
    }
  };

  /// function to validate email
  const checkEmail = (e: any) => {
    let email: string = e?.target?.value.toLowerCase();
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

  const handleOk = async () => {
    setModelLoading(true);

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
        setModelLoading(false);
      });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // Google and Github signin method
  const handleSignIn = async (provider: string) => {
    try {
      window.history.replaceState(null, "", window.location.href);
      await signIn(provider);

      // After successful sign-in, replace the current history entry
    } catch (error) {
      console.error("Sign-in error:", error);
    }
  };

  return (
    <>
      <Modal
        title="Verify your email to sign up"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <div
            key="footer"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <button
              disabled={modelLoading}
              onClick={handleOk}
              style={{
                background: "blue",
                cursor: modelLoading ? "not-allowed" : "pointer",
                width: "138px",
                padding: "12px 16px",
                borderRadius: "12px",
                fontSize: "16px",
                color: "#FCFCFD",
                fontSizeAdjust: "20px",
                fontWeight: "600",
                border: "none",
              }}
              key="submit"
              className="ant-btn ant-btn-primary"
            >
              Verify
            </button>
            {modelLoading && (
              <Spin style={{ width: "100%" }} indicator={antIcon} />
            )}
            <p>
              Thank you for choosing us, we wish you a smooth communication
              journey.
            </p>
          </div>,
        ]}
        className="model"
        centered
        style={{
          width: "688px",
          gap: "24px",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <p>
          To complete the signup process, please click on the button below.
          Please note that by completing your signup you are agreeing to our{" "}
          <a>Term of Service</a> and <a>Privacy Policy</a>
        </p>
      </Modal>

      <div className="register-container">
        {/* --------------------------left section------------------------------ */}
        <div className="left">
          <Image src={registerBg} alt="register-background" />
        </div>
        {/* --------------------------right section------------------------------ */}
        <div className="right">
          <Image
            src={luciferIcon}
            alt="torri-logo"
            onClick={() => (window.location.href = "/")}
            style={{ cursor: "pointer" }}
          />
          <div className="register-form">
            <h1>
              <span>Welcome! </span>
              <span>Get Started</span>
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
            <CaptchaErrorMessage captchaVerifyMessage={captchaVerifyMessage} />
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

                <button onClick={() => handleSignIn("google")}>
                  <Image src={googleIcon} alt="" />
                  <span>Google</span>
                </button>

                <button onClick={() => handleSignIn("github")}>
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
    </>
  );
}

export default RegisterPage;
