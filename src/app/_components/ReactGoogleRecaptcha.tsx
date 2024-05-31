"use client";
import React from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const ReactGoogleReCaptcha = ({ children }: { children: React.ReactNode }) => {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.RECAPTCHA_KEY ?? ""}>
      {children}
    </GoogleReCaptchaProvider>
  );
};

export default ReactGoogleReCaptcha;
