import React, { useEffect, useState } from "react";
import { useUserService } from "../_services/useUserService";
import { signOut, useSession } from "next-auth/react";
import { useCookies } from "react-cookie";
import jwt from "jsonwebtoken";
import Header from "./Header/Header";
import { usePathname } from "next/navigation";

export default function AuthHeader() {
  const { data: session } = useSession();
  const userService = useUserService();
  const [cookies, setCookie, removeCookie] = useCookies([
    "userId",
    "authorization",
  ]); // Specify the cookie name here

  async function logout() {
    await userService.logout();
  }

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

  const pathName = usePathname(); //get the current path;

  const shouldShowHeader = isLoggedIn && !pathName?.includes("/home/");

  return <>{shouldShowHeader ? <Header /> : <></>}</>;
}

/**!SECTION
 * 
  const userId = cookies.userId;

  const isLoggedIn = session?.user || userId !== undefined;

  const pathName = usePathname();//get the current path;

  const shouldShowHeader = isLoggedIn && !pathName?.includes("/home/");


  return <>{shouldShowHeader ? <Header /> : <></>}</>;
 */
