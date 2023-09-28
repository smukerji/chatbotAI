"use client";
import { Button, Form, Input, Spin, message } from "antd";
import React, { useState } from "react";
import "./login.css";
import Image from "next/image";
import { useUserService } from "../../../_services/useUserService";
import googlelogo from "../../../../../public/google-logo.svg";
import githublogo from "../../../../../public/github-logo.svg";
import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { LoadingOutlined } from "@ant-design/icons";

function Login() {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const antIcon = (
    <LoadingOutlined
      style={{ fontSize: 24, color: "black", margin: "10px 0" }}
      spin
    />
  );

  if (status === "authenticated") {
    redirect("/");
  }

  const userService = useUserService();
  /// when the form is submitted
  const onFinish = (values: any) => {
    setLoading(true);
    userService.login(values?.username, values?.password).then((data: any) => {
      if (!data?.username) {
        message.error(data);
      } else {
        message.success(`Welcome back ${data?.username}`);
        window.location.reload(); // Refresh the page
      }
      setLoading(false);
    });
  };

  // const onFinishFailed = (errorInfo: any) => {
  //   message.error(errorInfo.errorFields[0].errors[0]);
  // };

  type FieldType = {
    username?: string;
    password?: string;
  };

  return (
    <div className="login-container">
      <h1 className="welcome-text">Welcome back! Glad to see you, Again!</h1>
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        layout="vertical"
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        // onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<FieldType>
          name="username"
          rules={[
            { required: true, message: "Please input your email!" },
            {
              pattern: /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
              message: "Invalid email address format",
            },
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item<FieldType>
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password placeholder="Enter your password" />
        </Form.Item>

        <p className="forgot-password-label">Forgot Password?</p>

        <div className="login-register-container">
          <Button
            className="login-btn"
            type="primary"
            htmlType="submit"
            style={{
              width: "191.46px",
              marginBottom: "10px",
            }}
          >
            Log in
          </Button>
          {loading && <Spin indicator={antIcon} />}
          <div className="login-with-text-container">
            <hr />
            <span className="login-with-text">Or Login with</span>
            <hr />
          </div>
          <div className="social-login-buttons">
            <Button
              type="primary"
              className="social-login-button"
              onClick={() => signIn("google")}
            >
              <Image src={googlelogo} alt="" />
            </Button>
            <Button
              type="primary"
              className="social-login-button"
              onClick={() => signIn("github")}
            >
              <Image src={githublogo} alt="" height={24} width={24} />
            </Button>
          </div>
          <div className="link-to-signup">
            Don’t have an account? <a href="/account/register">Register Now</a>
          </div>
        </div>
      </Form>
    </div>
  );

  // return (
  //   <div className="login-container">
  //     <div className="login-form-container">
  //       <h2 className="login-title">Login</h2>
  //       <Form
  //         name="basic"
  //         labelCol={{ span: 8 }}
  //         layout="vertical"
  //         wrapperCol={{ span: 16 }}
  //         style={{ maxWidth: 600 }}
  //         initialValues={{ remember: true }}
  //         onFinish={onFinish}
  //         // onFinishFailed={onFinishFailed}
  //         autoComplete="off"
  //       >
  //         <Form.Item<FieldType>
  //           label="Email"
  //           name="username"
  //           rules={[
  //             { required: true, message: "Please input your email!" },
  //             {
  //               pattern: /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
  //               message: "Invalid email address format",
  //             },
  //           ]}
  //         >
  //           <Input />
  //         </Form.Item>

  //         <Form.Item<FieldType>
  //           label="Password"
  //           name="password"
  //           rules={[{ required: true, message: "Please input your password!" }]}
  //         >
  //           <Input.Password />
  //         </Form.Item>

  //         <div className="login-register-container">
  //           <Button
  //             type="primary"
  //             htmlType="submit"
  //             style={{
  //               width: "191.46px",
  //               marginBottom: "10px",
  //             }}
  //           >
  //             Log in
  //           </Button>
  //           {loading && <Spin indicator={antIcon} />}
  //           <hr />
  //           <div className="social-login-buttons">
  //             <Button
  //               type="primary"
  //               className="social-login-button"
  //               onClick={() => signIn("google")}
  //             >
  //               <Image src={googlelogo} alt="" />
  //               Sign in with Google
  //             </Button>
  //             <Button
  //               type="primary"
  //               className="social-login-button"
  //               onClick={() => signIn("github")}
  //             >
  //               <Image src={githublogo} alt="" height={24} width={24} />
  //               Sign in with Github
  //             </Button>
  //           </div>
  //           <div className="link-to-signup">
  //             No account? <a href="/account/register">Sign up</a>
  //           </div>
  //         </div>
  //       </Form>
  //     </div>
  //   </div>
  // );
}

export default Login;
