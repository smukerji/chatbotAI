'use client';
import Link from 'next/link';
import './globals.css';
import { Layout, Modal, Button } from 'antd';
import { SessionProvider } from 'next-auth/react';
import axios from 'axios';
import { useCookies } from 'react-cookie';
// import AuthBtn from "./_components/AuthBtn";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Header from './_components/Header/Header';
import { UserDetailsDataProvider } from './_helpers/client/Context/UserDetailsContext';
import { useRouter, usePathname } from 'next/navigation';
import { useUserService } from './_services/useUserService';

// const AuthBtn = dynamic(() => import("./_components/AuthBtn"), { ssr: false });
const AuthHeader = dynamic(() => import('./_components/AuthHeader'), {
  ssr: false,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { Header } = Layout;
  const router = useRouter();
  const pathName = usePathname();
  const [path, setPath] = useState('');
  const userService = useUserService();
  const [cookies, setCookie] = useCookies(['userId']);
  const [isPlanNotification, setIsPlanNotification] = useState(false);
  const [user, setUser] = useState<any>(null);

  const getUser = async () => {
    if (
      !['/', '/account/login', '/account/register'].includes(pathName ?? '')
    ) {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/user?userId=${cookies.userId}`
      );

      setUser(response.data.user);
    }
  };

  useEffect(() => {
    getUser();
    setPath(window.location.pathname);
  }, []);

  const handleUpgradePlan = () => {
    router.push('/home/pricing');
    setIsPlanNotification(false);
  };

  const logout = async () => {
    await userService.logout();
    setIsPlanNotification(false);
    setUser(null);
    window.location.href = '/';
  };

  useEffect(() => {
    const planEndTimer = setInterval(() => {
      if (user) {
        const planEndDate = new Date(user?.endDate);

        if (new Date() > planEndDate && pathName !== '/home/pricing') {
          setIsPlanNotification(true);
        }
      }
    }, 1000);

    if (pathName === '/home/pricing') {
      setIsPlanNotification(false);
    }

    return () => clearInterval(planEndTimer);
  }, [user, pathName]);

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
          <UserDetailsDataProvider>
            {path !== '/' &&
              path !== '/account/login' &&
              path !== '/account/register' && <AuthHeader />}
            {children}

            <Modal
              title="Upgrade your plan"
              open={isPlanNotification}
              onCancel={logout}
              // footer={[
              //   <Button key="submit" type="primary" onClick={handleUpgradePlan}>
              //     UPGRADE
              //   </Button>,
              // ]}
              onOk={handleUpgradePlan}
              okText="Upgrade"
              cancelText="Logout"
              closable={false}
            >
              <p>
                Your plan is expired, please upgrade your plan to access
                chatbots
              </p>
            </Modal>
          </UserDetailsDataProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
