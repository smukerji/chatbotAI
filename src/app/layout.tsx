"use client";
import Link from "next/link";
import "./globals.css";
import { Layout } from "antd";
import { SessionProvider } from "next-auth/react";
// import AuthBtn from "./_components/AuthBtn";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import ContactHeader from "./_components/Contact-Header/Contact-Header";
import Header from "./_components/Header/Header";
const AuthBtn = dynamic(() => import("./_components/AuthBtn"), { ssr: false });
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { Header } = Layout;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Josefin+Sans&family=Poppins&family=Quicksand&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        <SessionProvider>
          {/* <ContactHeader />
          <Header /> */}
          {/* <Header>
            <span className="logo">
              <Link href={process.env.NEXT_PUBLIC_WEBSITE_URL + ""}>
                ChatbotAI
              </Link>
            </span>
            <div>
              <Link href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot`}>
                My Chatbots
              </Link>
              <AuthBtn />
            </div>
          </Header> */}
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
