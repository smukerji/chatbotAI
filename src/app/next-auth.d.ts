import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    isNewUser?: boolean;
  }
  interface Session {
    isNewUser?: boolean;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isNewUser?: boolean;
    };
  }
}