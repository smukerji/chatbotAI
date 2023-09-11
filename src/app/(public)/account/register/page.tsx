"use client";
import { Button, Form, Input, message } from "antd";
import Link from "next/link";
import React from "react";
import "./register.css";
import { useUserService } from "../../../_services/useUserService";

function Register() {
  const userService = useUserService();

  const onFinish = async (values: any) => {
    await userService.register(values);
  };

  const onFinishFailed = (errorInfo: any) => {
    message.error(errorInfo.errorFields[0].errors[0]);
  };

  type FieldType = {
    username?: string;
    password?: string;
    email?: string;
  };

  return (
    <div className="register-container">
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
            label="Email"
            name="email"
            rules={[{ required: true, message: "Please input your email!" }]}
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
                Register
              </Button>
              <Link href="/account/login" className="btn btn-link">
                Already have an account? Login here
              </Link>
            </div>
          </Form.Item>
        </Form>
      </center>
    </div>
  );
}

export default Register;
