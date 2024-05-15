import React from 'react';
import LoginPage from './_components/LoginPage';
import ReactGoogleReCaptcha from '@/app/_components/ReactGoogleRecaptcha';

const Login = () => {
  return (
    <ReactGoogleReCaptcha>
      <LoginPage />
    </ReactGoogleReCaptcha>
  );
};

export default Login;
