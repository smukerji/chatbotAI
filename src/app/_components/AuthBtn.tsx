import React, { useEffect, useState } from "react";
import { useUserService } from "../_services/useUserService";
import { signOut, useSession } from "next-auth/react";
import { useCookies } from "react-cookie";
import jwt from "jsonwebtoken";
import { useRouter } from "next/navigation";

export default function AuthBtn() {
  const { data: session } = useSession();
  const userService = useUserService();
  const router = useRouter();
  const [cookies, setCookie, removeCookie] = useCookies([
    "userId",
    "authorization",
  ]); // Specify the cookie name here

  async function logout() {
    await userService.logout();
  }

  /// check if the the user has an active session
  // useEffect(() => {
  //   // Make a request to the server to get the data you need
  //   const verifyJwt = async () => {
  //     await fetch("/api/account/verify-jwt").then(async (res) => {
  //       const data = await res.json();
  //       if (data?.message === "jwt expired") {
  //         window.location.reload();
  //       }
  //     });
  //   };
  //   verifyJwt();
  // }, []);

  const userId = cookies.userId;

  const isLoggedIn = session?.user || userId !== undefined;

  return (
    <>
      {/* <div
        className="login-signup"
        onClick={async (e) => {
          if (!isLoggedIn) {
            window.location.href = "/account/login";
          } else if (session?.user || userId) {
            logout();
            signOut();
          }
        }}
      >
        <span
          style={{
            fontWeight: "normal",
            color: "white",
            textDecoration: "none",
          }}
        >
          {isLoggedIn ? "Log out" : "Sign up / Login"}
        </span>
      </div> */}
      {isLoggedIn ? (
        <div
          className="try-free-btn"
          onClick={() => {
            window.location.href = "/chatbot";
            // router.push("/chatbot");
          }}
        >
          My Chatbots
        </div>
      ) : (
        <>
          <div
            className="login-btn"
            onClick={() => {
              const dataToSend = { key: window.location.pathname + window.location.hash };
              const queryString = new URLSearchParams(dataToSend).toString();
              window.location.href = `/account/login?${queryString}`;
            }}
          >
            Log In
          </div>

          <a href="/account/register" style={{ textDecoration: "none" }}>
            <div className="try-free-btn">Register for Free</div>
          </a>
        </>
      )}
    </>
  );
}
