import NextAuth, { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectDatabase } from "../../../../db";
import { cookies } from "next/headers";
import { Adapter } from "next-auth/adapters";

const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(connectDatabase(), {
    databaseName: "sapahk-chatbot",
  }) as Adapter,
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
      cookies().set("profile-img", user.image!);
      cookies().set("userId", user.id);
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      /// db connection
      const db = (await connectDatabase()).db();

      /// get the starter plan ID
      const starterPlan = await db
        .collection("plans")
        .findOne({ name: "starter" });

      /// insert in users table too
      await db.collection("users").updateOne(
        { _id: user.id },
        {
          $set: {
            _id: user.id,
            username: user.name,
            email: user.email,
            planId: starterPlan?._id,
          },
        },
        {
          upsert: true,
        }
      );

      const isAllowedToSignIn = true;
      if (isAllowedToSignIn) {
        return true;
      } else {
        // Return false to display a default error message
        return false;
        // Or you can return a URL to redirect to:
        // return '/unauthorized'
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
