import React from "react";
import { useFetch } from "../_helpers/client/useFetch";
import { useRouter } from "next/navigation";

export { useUserService };
function useUserService(): IUserService {
  const fetch = useFetch();
  const router = useRouter();
  return {
    login: async (username, password) => {
      try {
        await fetch.post(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/account/login`,
          { username, password }
        );

        router.push("/");
      } catch (error: any) {
        console.log("Error while logging", error);
      }
    },
    logout: async () => {},
    register: async (user) => {
      try {
        await fetch.post(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/account/register`,
          user
        );
        router.push("account/login");
      } catch (error: any) {
        console.log("Error while registering user", error);
      }
    },
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
}
