"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import luciferIcon from "../../../../../../public/svgs/lucifer-ai-logo.svg";
import { useUserService } from "../../../../_services/useUserService";
import "../emailVerified.scss";
import { signIn, useSession } from "next-auth/react";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin, message } from "antd";
import jwt from "jsonwebtoken";
import verified from "../../../../../../public/svgs/Group.svg";
import { redirect, useRouter } from "next/navigation";

function EmailVerified() {
  const userService = useUserService();
  const [loading, setLoading] = useState(false);
  const antIcon = (
    <LoadingOutlined
      style={{ fontSize: 24, color: "black", margin: "10px 0" }}
      spin
    />
  );
  const router = useRouter();

  const handleClick = async () => {
    router.push("/account/login");
    window.history.replaceState(null, "", window.location.href);
    // window.location.href = '/account/login';
  };

  const handleOk = async () => {
    const searchParams = new URLSearchParams(location.search);
    const jwtToken: any = searchParams.get("jwt");
    const decodedToken: any = jwt.decode(jwtToken);
    console.log(decodedToken.email);
    const email: string = decodedToken.email;

    await userService.verify(email).then((data: any) => {
      if (data) {
        if (data?.message) message.success(data?.message);
        else message.error(data);
      }
    });
  };

  useEffect(() => {
    handleOk();
  }, []);

  return (
    <div className="verify-container">
      <div className="verify-main">
        <Image
          src={luciferIcon}
          alt="torri-logo"
          onClick={() => (window.location.href = "/")}
          style={{ cursor: "pointer" }}
        />
        <div className="img-container">
          <Image
            src={verified}
            alt="img"
            onClick={() => (window.location.href = "/")}
            style={{ cursor: "pointer" }}
          />
        </div>
        <div className="description-verify">
          <h1>
            <span>Email Verified!</span>
          </h1>
          <p className="para">
            <span>Your Email was successfully verified.</span>
          </p>

          <div className="go-login-container">
            <button className="login-btn" onClick={handleClick}>
              <span className="btnText">Get started</span>
            </button>
            {loading && <Spin style={{ width: "20%" }} indicator={antIcon} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerified;
