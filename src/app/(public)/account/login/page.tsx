"use client";
import { Button, Form, Input, message } from "antd";
import React from "react";
import "./login.css";
import Image from "next/image";
import { useUserService } from "../../../_services/useUserService";
import googlelogo from "../../../../../public/google-logo.svg";
import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";

function Login() {
  const { status } = useSession();

  if (status === "authenticated") {
    redirect("/");
  }

  const userService = useUserService();
  const onFinish = (values: any) => {
    userService.login(values?.username, values?.password).then(() => {
      window.location.reload(); // Refresh the page
    });
  };

  const onFinishFailed = (errorInfo: any) => {
    message.error(errorInfo.errorFields[0].errors[0]);
  };

  type FieldType = {
    username?: string;
    password?: string;
  };

  return (
    <div className="login-container">
      <center>
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            label="Email"
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <div className="login-register-conatiner">
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  width: "200px",
                  marginBottom: "10px",
                }}
              >
                Log in
              </Button>
              <hr />
              <Button
                type="primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "200px",
                  marginTop: "10px",
                }}
                onClick={() => {
                  signIn("google");
                }}
              >
                <span
                  style={{
                    justifyContent: "center",
                    display: "flex",
                    marginRight: "20px",
                  }}
                >
                  <Image src={googlelogo} alt=""></Image>
                </span>
                Sign in with Google
              </Button>
              <div className="link-to-signup">
                No account? <a href="/account/register">Sign up</a>
              </div>
            </div>
          </Form.Item>
        </Form>
      </center>
    </div>
  );
}

export default Login;
