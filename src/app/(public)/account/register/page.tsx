import React, { Suspense } from "react";
import RegisterPage from "./_components/RegisterPage";
import ReactGoogleReCaptcha from "@/app/_components/ReactGoogleRecaptcha";

const Register = () => {
  return (
    <Suspense fallback={<div>login</div>}>
      <ReactGoogleReCaptcha>
        <RegisterPage />
      </ReactGoogleReCaptcha>
    </Suspense>
  );
};

export default Register;
