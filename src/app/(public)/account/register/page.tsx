import React from 'react';
import RegisterPage from './_components/RegisterPage';
import ReactGoogleReCaptcha from '@/app/_components/ReactGoogleRecaptcha';

const Register = () => {
  return (
    <ReactGoogleReCaptcha>
      <RegisterPage />
    </ReactGoogleReCaptcha>
  );
};

export default Register;
