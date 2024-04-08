import React from 'react';
import './changepassform.scss';
import { Button, Form, Input, Radio, Tag, Modal, Select, message } from 'antd';
import axios from 'axios';
import {
  OLD_PASS_CANNOT_EMPTY,
  PASSWORD_CHANGED_SUCCESS,
  PASSWORD_DOES_NOT_MATCH,
  PASS_CANNOT_EMPTY,
} from '@/app/_helpers/errorConstants';

function ChangePasswordForm({ setVisible, isGoogleLogin }: any) {
  const [form] = Form.useForm();
  console.log('isGoogleLogin', isGoogleLogin);

  const onFinish = async (value: any) => {
    console.log('value', value);

    const body = {
      oldPassword: value.oldPassword,
      newPassword: value.confirmPassword,
      isGoogleUser: isGoogleLogin,
    };

    axios
      .post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/account/user/details/change/password`,
        body
      )
      .then((res) => {
        console.log('response', res);

        message.success(res?.data?.message);
        setVisible(false);
      })
      .catch((error) => {
        console.log('error', error);

        message.error(error?.response?.data?.message);
      });
  };
  return (
    <>
      <div>
        <Form form={form} layout='vertical' onFinish={onFinish}>
          <Form.Item
            name={'oldPassword'}
            label='Old password'
            rules={[{ required: true, message: OLD_PASS_CANNOT_EMPTY }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name={'password'}
            label='New password'
            rules={[{ required: true, message: PASS_CANNOT_EMPTY }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name={'confirmPassword'}
            label='Confirm new password'
            rules={[
              { required: true, message: PASSWORD_DOES_NOT_MATCH },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(PASSWORD_DOES_NOT_MATCH));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <div className='btn-wrapper'>
              <Button className='cancel' onClick={() => setVisible(false)}>
                Cancel
              </Button>
              <Button
                htmlType='submit'
                // onClick={() => handleChangePassword}
              >
                Change Password
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </>
  );
}

export default ChangePasswordForm;
