"use client";
import { Button, Form, Input, message } from "antd";
import React from "react";
import "./login.css";
import Link from "next/link";
import { useUserService } from "../../../_services/useUserService";

function Login() {
  const userService = useUserService();
  const onFinish = (values: any) => {
    userService.login(values?.username, values?.password);
    // console.log("Success:", values);
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
            label="Username"
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
              <Button type="primary" htmlType="submit">
                Login
              </Button>
              <Link href="/account/register" className="btn btn-link">
                Create an account
              </Link>
            </div>
          </Form.Item>
        </Form>
      </center>
    </div>
  );
}

export default Login;
