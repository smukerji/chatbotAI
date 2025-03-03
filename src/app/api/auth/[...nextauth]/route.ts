import NextAuth, { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "../../../../db";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { Adapter } from "next-auth/adapters";
import { emailService } from "../../../_services/emailService";
import {
  logo,
  registerationMail,
} from "../../../_helpers/emailImagesBase64Constants";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise!) as Adapter,
  //   session: {
  //     strategy: "jwt",
  //   },
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET!,
    }),
  ],

  events: {
    signIn: async (message) => {
      /// db connection

      let currentDate = new Date();
      let endDate = new Date();

      const db = (await clientPromise!).db();

      const starterPlan = await db
        .collection("plans")
        .findOne({ name: "individual" });

      const username: string[] = message.user.name?.split(" ")!;

      /// Check if planId is not already set
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(message.user.id) });

      if (!user.planId) {
        /// insert in users table too
        await db.collection("users").updateOne(
          { _id: new ObjectId(message.user.id) },
          {
            $set: {
              startDate: currentDate,
              endDate: endDate,
              planId: null,
              isWhatsapp: false,
              username:
                username[0] + `${username?.[1] ? "_" + username?.[1] : ""}`,
            },
          },
          {
            upsert: true,
          }
        );
      }

      const userId = message.user.id;
      /// set the user details
      // Check if a document with the given userId already exists
      const existingUser = await db
        .collection("user-details")
        .findOne({ userId: userId });

      // If no document exists for the given userId, insert a new one
      if (!existingUser) {
        await db.collection("user-details").insertOne({
          userId: userId,
          totalMessageCount: 0,
          messageLimit: 0,
          chatbotLimit: 0,
          trainingDataLimit: 0,
          websiteCrawlingLimit: "0",
          conversationHistory: "0",
          leads: "0",
          models: "",
        });
      }
    },

    createUser: async (message) => {
      const user = message.user;
      /// send the registration mail
      const temailService = emailService();
      await temailService.send(
        "registration-mail-template",
        [
          registerationMail.heroImage,
          registerationMail.avatarIcon,
          registerationMail.icon1,
          registerationMail.icon2,
          logo,
        ],
        user.email!,
        {
          name: user.name,
        }
      );
    },
  },

  callbacks: {
    async session({ session, user }: any) {
      cookies().set("profile-img", user.image!);
      cookies().set("userId", user.id);
      /// set the username
      if (user?.name) cookies().set("username", user?.name!);
      else if (user?.username) cookies().set("username", user?.username!);
      session.user.id = user.id;
      /// set the plan to identify if the uaer is new or not
      session.user.plan = user?.planId;
      return session;
    },
    // async signIn({ user, account, profile, email, credentials }) {
    //   /// db connection
    //   const db =  (await clientPromise!).db();

    //   /// get the starter plan ID
    //   const starterPlan = await db
    //     .collection("plans")
    //     .findOne({ name: "starter" });

    //   console.log(user);

    //   /// insert in users table too
    //   await db.collection("users").updateOne(
    //     { _id: user.id },
    //     {
    //       $set: {
    //         _id: user.id,
    //         username: user.name,
    //         email: user.email,
    //         planId: starterPlan?._id,
    //       },
    //     },
    //     {
    //       upsert: true,
    //     }
    //   );

    //   const isAllowedToSignIn = true;
    //   if (isAllowedToSignIn) {
    //     return true;
    //   } else {
    //     // Return false to display a default error message
    //     return false;
    //     // Or you can return a URL to redirect to:
    //     // return '/unauthorized'
    //   }
    // },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
