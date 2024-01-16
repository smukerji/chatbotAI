import NextAuth, { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import HubspotProvider from "next-auth/providers/hubspot";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectDatabase } from "../../../../db";
import { cookies } from "next/headers";

const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(connectDatabase(), {
    databaseName: "sapahk-chatbot",
  }),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET!,
    }),
    HubspotProvider({
      clientId: process.env.NEXT_PUBLIC_HUBSPOT_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_HUBSPOT_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: process.env.NEXT_PUBLIC_HUBSPOT_CLIENT_SCOPES,
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "hubspot") {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, user, token }) {
      // cookies().set("profile-img", user.image!);
      // cookies().set("userId", user.id);

      session.accessToken = token.accessToken;
      cookies().set("profile-img", token.picture!);
      cookies().set("userId", token.sub!);
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
