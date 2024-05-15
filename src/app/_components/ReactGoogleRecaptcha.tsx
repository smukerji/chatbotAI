'use client';
import React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const ReactGoogleReCaptcha = ({ children }: { children: React.ReactNode }) => {
  return (
    <GoogleReCaptchaProvider reCaptchaKey='6Lf2E9wpAAAAABZ_PYDsZZLpr2uPSmXjJDlQv8oX'>
      {children}
    </GoogleReCaptchaProvider>
  );
};

export default ReactGoogleReCaptcha;
