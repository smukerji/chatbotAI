import React, { useEffect, useState } from "react";
import { useUserService } from "../_services/useUserService";
import { signOut, useSession } from "next-auth/react";
import { useCookies } from "react-cookie";
import jwt from "jsonwebtoken";

export default function AuthBtn() {
  const { data: session } = useSession();
  const userService = useUserService();
  const [cookies, setCookie, removeCookie] = useCookies([
    "userId",
    "authorization",
  ]); // Specify the cookie name here

  async function logout() {
    await userService.logout();
  }

  useEffect(() => {
    // Make a request to the server to get the data you need
    const verifyJwt = async () => {
      await fetch("/api/account/verify-jwt");
    };
    verifyJwt();
  }, []);

  const userId = cookies.userId;

  const isLoggedIn = session?.user || userId !== undefined;

  return (
    <>
      <div className="login-signup">
        <a
          href={!isLoggedIn ? "/account/login" : ""}
          style={{
            fontWeight: "normal",
            color: "white",
            textDecoration: "none",
          }}
          onClick={async (e) => {
            if (session?.user || userId) {
              logout();
              signOut();
            }
          }}
        >
          {isLoggedIn ? "Log out" : "Sign up / Login"}
        </a>
      </div>
    </>
  );
}
