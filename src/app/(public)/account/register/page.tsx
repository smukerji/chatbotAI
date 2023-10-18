"use client";
import { Button, Form, Input, Spin, message } from "antd";
import Image from "next/image";
import React, { useState } from "react";
import "./register.css";
import { useUserService } from "../../../_services/useUserService";
import googlelogo from "../../../../../public/google-logo.svg";
import githublogo from "../../../../../public/github-logo.svg";
import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { LoadingOutlined } from "@ant-design/icons";

function Register() {
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
  const onFinish = async (values: any) => {
    setLoading(true);
    await userService.register(values).then((data: any) => {
      if (data) {
        if (data?.message) message.success(data?.message);
        else message.error(data);
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
    email?: string;
  };

  return (
    <div className="register-container">
      <h1 className="register-title">Welcome! Glad to see you, here!</h1>
      <Form
        layout="vertical"
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        // onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<FieldType>
          name="username"
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input placeholder="Enter your username" />
        </Form.Item>

        <Form.Item<FieldType>
          name="email"
          rules={[
            { required: true, message: "Please input your email!" },
            {
              pattern: /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
              message: "Invalid email address format",
            },
          ]}
        >
          <Input placeholder="Enter you email" />
        </Form.Item>

        <Form.Item<FieldType>
          name="password"
          rules={[
            { required: true, message: "Please input your password!" },
            {
              pattern:
                /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
              message:
                "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@ $ ! % * ? &)",
            },
          ]}
        >
          <Input.Password placeholder="Enter your password" />
        </Form.Item>

        <div className="login-register-container">
          <Button
            className="register-btn"
            type="primary"
            htmlType="submit"
            style={{
              width: "191.46px",
              marginBottom: "10px",
            }}
          >
            Create account
          </Button>
          {loading && <Spin indicator={antIcon} />}
          {/* <hr />
          <div className="social-login-buttons">
            <Button
              type="primary"
              className="social-login-button"
              onClick={() => signIn("google")}
            >
              <Image src={googlelogo} alt="" />
              Sign up with Google
            </Button>
            <Button
              type="primary"
              className="social-login-button"
              onClick={() => signIn("github")}
            >
              <Image src={githublogo} alt="" height={24} width={24} />
              Sign up with Github
            </Button>
          </div> */}
          <div className="register-with-text-container">
            <hr />
            <span className="register-with-text">Or Register with</span>
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
          <div className="link-to-login">
            Already have an account? <a href="/account/login">Log in</a>
          </div>
        </div>
      </Form>
    </div>
  );

  // return (
  //   <div className="register-container">
  //     <div className="register-form-container">
  //       <h2 className="register-title">Create an Account</h2>
  //       <Form
  //         layout="vertical"
  //         name="basic"
  //         labelCol={{ span: 8 }}
  //         wrapperCol={{ span: 16 }}
  //         style={{ maxWidth: 600 }}
  //         initialValues={{ remember: true }}
  //         onFinish={onFinish}
  //         // onFinishFailed={onFinishFailed}
  //         autoComplete="off"
  //       >
  //         <Form.Item<FieldType>
  //           label="Username"
  //           name="username"
  //           rules={[{ required: true, message: "Please input your username!" }]}
  //         >
  //           <Input />
  //         </Form.Item>

  //         <Form.Item<FieldType>
  //           label="Email"
  //           name="email"
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
  //           rules={[
  //             { required: true, message: "Please input your password!" },
  //             {
  //               pattern:
  //                 /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
  //               message:
  //                 "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@ $ ! % * ? &)",
  //             },
  //           ]}
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
  //             Create account
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
  //               Sign up with Google
  //             </Button>
  //             <Button
  //               type="primary"
  //               className="social-login-button"
  //               onClick={() => signIn("github")}
  //             >
  //               <Image src={githublogo} alt="" height={24} width={24} />
  //               Sign up with Github
  //             </Button>
  //           </div>
  //           <div className="link-to-login">
  //             Have an account? <a href="/account/login">Log in</a>
  //           </div>
  //         </div>
  //       </Form>
  //     </div>
  //   </div>
  // );
}

export default Register;
