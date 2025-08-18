import React from "react";
import { useFetch } from "../_helpers/client/useFetch";
import { useRouter, useSearchParams } from "next/navigation";

export { useUserService };
function useUserService(): IUserService {
  const fetch = useFetch();
  const router = useRouter();
  const searchParams = useSearchParams();
  return {
    login: async (username, password) => {
      try {
        const user = await fetch.post(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/account/login`,
          { username, password }
        );

        // debugger;

        // get return url from query parameters or default to '/home'
        const returnUrl = searchParams?.get("returnUrl") || "/chatbot";
        router.push(process.env.NEXT_PUBLIC_WEBSITE_URL + returnUrl);
        return user;
      } catch (error: any) {
        console.log("Error while logging", error);
        return error;
      }
    },
    logout: async () => {
      await fetch.post("/api/account/logout");
      router.push("/account/login");
    },
    register: async (user) => {
      try {
        const data = await fetch.post(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/account/register`,
          user
        );
        localStorage.setItem('email', user.email);
        router.push("/account/verify-email");
        return data;
      } catch (error: any) {
        console.log("Error while registering user", error);
        return error;
      }
    },   
    verify: async (email) => {
      try{
        const data = await fetch.post(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/account/verify-email`,
          email
        );
        return data;
      }
      catch(error: any){
        console.log("Error while verify user", error);
        return error;
      }
    }
  };
}

/// interfaces
interface IUser {
  id: string;
  email: string;
  password: string;
  username: string;
}

interface IUserService {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (user: IUser) => Promise<void>;
  verify: (email:string)=>Promise<void>;
}
