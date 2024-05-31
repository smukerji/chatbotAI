"use client";
import React, { Suspense } from "react";
import EmailVerified from "./_component/EmailVerify";

function EmailPage() {
  return (
    <Suspense fallback={<div>loading error</div>}>
      <EmailVerified />
    </Suspense>
  );
}
export default EmailPage;
