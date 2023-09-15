"use client";
import Link from "next/link";
import "./globals.css";
import { Layout } from "antd";
import { SessionProvider } from "next-auth/react";
// import AuthBtn from "./_components/AuthBtn";
import dynamic from "next/dynamic";
const AuthBtn = dynamic(() => import('./_components/AuthBtn'), { ssr: false })
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { Header } = Layout;

  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Header>
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
          </Header>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
