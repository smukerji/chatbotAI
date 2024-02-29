"use client";
import React, { useEffect, useState } from "react";
import "./accForm.scss";
import { Button, Form, Input, Modal } from "antd";
import ChangePasswordForm from "@/app/(secure)/chatbot/dashboard/_components/Modal/ChangePasswordForm";
import { useCookies } from "react-cookie";

function AccountForm() {
  const [visible, setVisible] = useState(false);
  const [profileImg, setProfileImg] = useCookies(["profile-img"]);
  const [isGoogleLogin, setIsGoogleLogin] = useState(false);
  console.log("profile-img", profileImg["profile-img"]);

  const onFinish = (value: any) => {
    console.log(value);
  };

  useEffect(() => {
    if (profileImg["profile-img"]) {
      setIsGoogleLogin(true);
    }
  }, []);
  return (
    <>
      <div className="account-form">
        <h2 className="account-form-heading">User profile</h2>

        <Form
          layout="vertical"
          onFinish={onFinish}
          className="main-form-container"
        >
          {isGoogleLogin ? (
            <div className="form-item">
              <Form.Item label="Name" name={"name"} className="w-50">
                <Input placeholder="Enter your Name" />
              </Form.Item>
            </div>
          ) : (
            <>
              <div className="form-item w-45">
                <Form.Item label="First Name" name={"firstName"} className="">
                  <Input placeholder="Enter your First Name" />
                </Form.Item>
              </div>

              <div className="form-item w-45">
                <Form.Item label="Last Name" name={"lastName"} className="">
                  <Input placeholder="Enter your Last Name" />
                </Form.Item>
              </div>
            </>
          )}

          <div className="form-item">
            <Form.Item label="Email" name={"email"} className="w-50 email">
              <Input placeholder="tuan@gmail.com" disabled={true} />
            </Form.Item>
          </div>

          <div className="form-item">
            <Form.Item label="API Key" name={"apikey"} className="w-50 api-key">
              {/* <Input placeholder='tuan@gmail.com' /> */}
              <p className="api-key-text">Coming soon</p>
            </Form.Item>
          </div>

          {!isGoogleLogin && (
            <div className="form-item">
              <Form.Item label="Password" className="">
                {/* <Input placeholder='Password' /> */}
                <div
                  className="change-password"
                  onClick={() => setVisible(true)}
                >
                  Change Password
                </div>
              </Form.Item>
            </div>
          )}

          <div className="form-item">
            <div className="audit-log">
              <p className="audit-log-label">Audit Log</p>
              <p className="audit-log-value">Coming soon</p>
            </div>
          </div>

          <div>
            <div className="user-teams">
              <p className="user-teams-label">Users & Teams</p>
              <p className="user-teams-value">Coming soon</p>
            </div>
          </div>
          <div className="form-item">
            <Form.Item className="w-50">
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </div>
        </Form>

        <Modal
          centered
          title="Change Password"
          open={visible}
          // onOk={this.handleOk}
          onCancel={() => setVisible(false)}
          closeIcon={false}
          className="change-password-modal"
          width={585}
          footer={false}
        >
          <ChangePasswordForm setVisible={setVisible} />
        </Modal>
      </div>
    </>
  );
}

export default AccountForm;
