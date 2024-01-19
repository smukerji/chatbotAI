"use client";
import Link from "next/link";
import "./globals.css";
import { Layout } from "antd";
import { SessionProvider } from "next-auth/react";
// import AuthBtn from "./_components/AuthBtn";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import ContactHeader from "./_components/Contact-Header/Contact-Header";
import Header from "./_components/Header/Header";

// const AuthBtn = dynamic(() => import("./_components/AuthBtn"), { ssr: false });
const AuthHeader = dynamic(() => import("./_components/AuthHeader"), {
  ssr: false,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { Header } = Layout;
  const [path, setPath] = useState("");

  /// usestate to check whether to display header or not
  useEffect(() => {
    setPath(window.location.pathname);
  });

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
          {path !== "/" && <AuthHeader />}
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
