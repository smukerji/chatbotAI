import React, { Suspense } from "react";
import LoginPage from "./_components/LoginPage";
import ReactGoogleReCaptcha from "@/app/_components/ReactGoogleRecaptcha";

const Login = () => {
  return (
    // <Suspense fallback={<div>login</div>}>
    <ReactGoogleReCaptcha>
      <LoginPage />
    </ReactGoogleReCaptcha>
    // </Suspense>
  );
};

export default Login;
