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
      console.log("token", token);
      console.log("account", account);
      if (account?.provider === "hubspot") {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, user, token }) {
      // cookies().set("profile-img", user.image!);
      // cookies().set("userId", user.id);
      console.log("session", session);
      console.log("user", user);
      cookies().set("profile-img", token.picture!);
      cookies().set("userId", token.sub!);
      if (token?.provider === "hubspot") {
        cookies().set("provider", String(token.provider!));
        cookies().set("providerAccountId", String(token.providerAccountId!));
        cookies().set("haccessToken", String(token.accessToken!));
        cookies().set("hrefreshToken", String(token.refreshToken!));
        cookies().set("hexpiresAt", String(token.expiresAt!));
      }

      return Promise.resolve(session);
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
