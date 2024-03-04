"use client";
import React, { useContext, useEffect, useState } from "react";
import "./accForm.scss";
import { Button, Form, Input, Modal, message } from "antd";
import ChangePasswordForm from "@/app/(secure)/chatbot/dashboard/_components/Modal/ChangePasswordForm";
import { useCookies } from "react-cookie";
import { UserDetailsContext } from "@/app/_helpers/client/Context/UserDetailsContext";
import axios from "axios";
import { error } from "console";
import {
  EMPTY_FIRST_LAST_NAME,
  EMPTY_NAME,
} from "../../_helpers/errorConstants";

function AccountForm() {
  const [visible, setVisible] = useState(false);
  const [profileImg, setProfileImg] = useCookies(["profile-img"]);
  const [isGoogleLogin, setIsGoogleLogin] = useState(false);
  /// get userDetails context
  const userDetailContext: any = useContext(UserDetailsContext);
  const userDetails = userDetailContext?.userDetails;

  const onFinish = async (e: any) => {
    // console.log(value);
    e.preventDefault();

    if (
      (userDetails.firstName == "" || userDetails.lastName == "") &&
      !isGoogleLogin
    ) {
      message.error(EMPTY_FIRST_LAST_NAME);
      return;
    } else if (userDetails?.fullName == "" && isGoogleLogin) {
      message.error(EMPTY_NAME);
      return;
    }

    const body = {
      firstName: userDetails?.firstName,
      lastName: userDetails?.lastName,
      fullName: userDetails?.fullName,
      // email: userDetails?.fullName,
      isGoogleUser: isGoogleLogin,
    };

    axios
      .post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}/api/account/user/details/change`,
        body
      )
      .then((res) => {
        message.success(res?.data?.message);
      })
      .catch((error) => {
        message.error(error);
      });
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

        <form className="main-form-container">
          {isGoogleLogin ? (
            <div className="form-item w-50">
              <div className="form-items-direction">
                <label className="item-label" htmlFor="fullName">
                  Name
                </label>
                <input
                  placeholder="Enter your Name"
                  onChange={(e) => {
                    userDetailContext?.handleChange("fullName")(e.target.value);
                  }}
                  value={userDetails?.fullName}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="form-item w-45">
                {/* <Form.Item label='First Name' name={'firstName'} className=''> */}
                <div className="form-items-direction">
                  <label className="item-label" htmlFor="firstName">
                    First Name
                  </label>
                  <input
                    placeholder="Enter your First Name"
                    onChange={(e) => {
                      userDetailContext?.handleChange("firstName")(
                        e.target.value
                      );
                    }}
                    value={userDetails?.firstName}
                  />
                </div>
              </div>

              <div className="form-item w-45">
                {/* <Form.Item label='Last Name' name={'lastName'} className=''> */}
                <div className="form-items-direction">
                  <label className="item-label" htmlFor="lastName">
                    Last Name
                  </label>
                  <input
                    placeholder="Enter your Last Name"
                    onChange={(e) => {
                      userDetailContext?.handleChange("lastName")(
                        e.target.value
                      );
                    }}
                    value={userDetails?.lastName}
                  />
                </div>
                {/* </Form.Item> */}
              </div>
            </>
          )}

          <div className="form-item w-50 email">
            {/* <Form.Item label='Email' name={'email'} className='w-50 email'> */}
            <div className="form-items-direction">
              <label className="item-label email-label" htmlFor="">
                Email
              </label>
              <input
                placeholder="tuan@gmail.com"
                disabled={true}
                value={userDetails?.email}
              />
            </div>
            {/* </Form.Item> */}
          </div>

          <div className="form-item w-50 api-key">
            {/* <Form.Item label='API Key' name={'apikey'} className='w-50 api-key'> */}
            {/* <Input placeholder='tuan@gmail.com' /> */}
            <div className="form-items-direction">
              <label className="item-label" htmlFor="">
                API Key
              </label>
              <p className="api-key-text">Coming soon</p>
            </div>
            {/* </Form.Item> */}
          </div>

          {!isGoogleLogin && (
            <div className="form-item">
              {/* <Form.Item label='Password' className=''> */}
              {/* <Input placeholder='Password' /> */}
              <div className="form-items-direction">
                <label className="item-label" htmlFor="">
                  Password
                </label>
                <div
                  className="change-password"
                  onClick={() => setVisible(true)}
                >
                  Change Password
                </div>
              </div>
              {/* </Form.Item> */}
            </div>
          )}

          <div className="form-item">
            <div className="form-items-direction">
              <div className="audit-log">
                <p className="audit-log-label">Audit Log</p>
                <p className="audit-log-value">Coming soon</p>
              </div>
            </div>
          </div>

          <div>
            <div className="user-teams">
              <p className="user-teams-label">Users & Teams</p>
              <p className="user-teams-value">Coming soon</p>
            </div>
          </div>
          <div className="form-item w-50">
            {/* <Form.Item className='w-50'> */}
            <Button type="primary" htmlType="submit" onClick={onFinish}>
              Submit
            </Button>
            {/* </Form.Item> */}
          </div>
        </form>

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
          <ChangePasswordForm
            setVisible={setVisible}
            isGoogleLogin={isGoogleLogin}
          />
        </Modal>
      </div>
    </>
  );
}

export default AccountForm;
