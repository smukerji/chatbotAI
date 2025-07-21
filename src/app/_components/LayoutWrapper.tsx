"use client";

import { SessionProvider } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { UserDetailsDataProvider } from "../_helpers/client/Context/UserDetailsContext";
import { useCookies } from "react-cookie";
import dynamic from "next/dynamic";

const AuthHeader = dynamic(() => import("./AuthHeader"), {
  ssr: false,
});

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const [path, setPath] = useState("");

  const [cookies, setCookie] = useCookies(["userId"]);

  useEffect(() => {
    setPath(window.location.pathname);
  }, []);

  return (
    <SessionProvider>
      <UserDetailsDataProvider>
        {path !== "/" &&
          path !== "/account/login" &&
          path !== "/account/register" &&
          path !== "/terms" &&
          path !== "/privacy" &&
          !path.match(/^\/blog/) && <AuthHeader />}
        {children}
      </UserDetailsDataProvider>
    </SessionProvider>
  );
};

export default LayoutWrapper;


