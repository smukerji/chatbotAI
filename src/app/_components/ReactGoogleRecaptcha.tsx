"use client";
import React from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const ReactGoogleReCaptcha = ({ children }: { children: React.ReactNode }) => {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey="6Ldi49wpAAAAAIsSAtfJu7KD2oGAxdFzw-ViZi2K"
      scriptProps={{ defer: true, appendTo: "head" }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
};

export default ReactGoogleReCaptcha;
