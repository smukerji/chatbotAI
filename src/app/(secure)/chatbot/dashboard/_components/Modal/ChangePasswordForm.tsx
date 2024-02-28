import React from 'react';
import './changepassform.scss';
import { Button, Form, Input, Radio, Tag, Modal, Select, message } from 'antd';
import axios from 'axios';

function ChangePasswordForm({ setVisible }: any) {
  const [form] = Form.useForm();

  const onFinish = async (value: any) => {
    console.log('value', value);

    const userID = Number(window.localStorage.getItem('userId'));
    try {
      const response: any = await axios
        .put('server/api/passwordChange', {
          id: userID,
          ...value,
        })
        .then((res) => res?.data);

      if (response.error) {
        message.error(response.error);
      } else {
        message.success('Password Changed successfully!');
        setVisible(false);
      }
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <>
      <div>
        <Form form={form} layout='vertical' onFinish={onFinish}>
          <Form.Item name={'oldPassword'} label='Old password'>
            <Input.Password />
          </Form.Item>
          <Form.Item name={'password'} label='New password'>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name={'confirmPassword'}
            label='Confirm new password'
            rules={[
              { required: true, message: 'do not match password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('The new password that you entered do not match!')
                  );
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
