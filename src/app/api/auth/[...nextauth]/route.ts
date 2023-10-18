import NextAuth, { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectDatabase } from "../../../../db";
import { cookies } from "next/headers";

const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(connectDatabase(), {
    databaseName: "sapahk-chatbot",
  }),
  //   session: {
  //     strategy: "jwt",
  //   },
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async session({ session, user, token }) {
      cookies().set("userId", user.id);
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
