"use client";
import Link from "next/link";
import "./globals.css";
import { Layout, Modal, Button } from "antd";
import { SessionProvider } from "next-auth/react";
import axios from "axios";
import { useCookies } from "react-cookie";
// import AuthBtn from "./_components/AuthBtn";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Header from "./_components/Header/Header";
import { UserDetailsDataProvider } from "./_helpers/client/Context/UserDetailsContext";
import "./layout.scss";

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
  const [cookies, setCookie] = useCookies(["userId"]);

  useEffect(() => {
    setPath(window.location.pathname);
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Josefin+Sans&family=Poppins&family=Quicksand&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>

      <body>
        <SessionProvider>
          <UserDetailsDataProvider>
            {path !== "/" &&
              path !== "/account/login" &&
              path !== "/account/register" &&
              path !== "/terms" &&
              path !== "/privacy" && <AuthHeader />}
            {children}

            {/* <Modal
              title='Upgrade Now to create new Chatbots!'
              open={isPlanNotification}
              onCancel={() => {}}
              footer={[
                <Button key='submit' type='primary' onClick={handleUpgradePlan}>
                  Upgrade Now
                </Button>,
              ]}
              closable={false}
              centered
              className='subscription-expire-popup'
              width={800}
            >
              <p>Upgrade now to access your chatbots!</p>
            </Modal> */}
          </UserDetailsDataProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
