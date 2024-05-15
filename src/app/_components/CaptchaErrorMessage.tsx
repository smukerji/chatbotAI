import React from 'react';

const CaptchaErrorMessage = ({
  captchaVerifyMessage,
}: {
  captchaVerifyMessage?: string;
}) => {
  if (captchaVerifyMessage) {
    return (
      <div
        className='ant-form-item-explain-error'
        style={{ color: '#ff4d4f', padding: '5px 5px 10px 0' }}
      >
        {captchaVerifyMessage}
      </div>
    );
  }
  return <div></div>;
};

export default CaptchaErrorMessage;
