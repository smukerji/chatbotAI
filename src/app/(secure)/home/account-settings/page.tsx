'use client';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import React from 'react';
import { useCookies } from 'react-cookie';
import './account.scss';
import AccountForm from '@/app/_components/Account-Form/AccountForm';

function AccountSettings() {
  const { status } = useSession();
  const [cookies, setCookie] = useCookies(['userId']);

  /// loading icon
  const antIcon = (
    <LoadingOutlined style={{ fontSize: 24, color: 'black' }} spin />
  );
  if (status === 'loading') {
    return (
      <center>
        <Spin indicator={antIcon} />
      </center>
    );
  } else if (status === 'authenticated' || cookies?.userId) {
    return (
      <>
        <div className='account-setting-container'>
          <p className='acc-setting-heading'>Account Settings</p>

          <AccountForm />
        </div>
      </>
    );
  } else if (status === 'unauthenticated') {
    redirect('/account/login');
  } else {
    return <></>;
  }
}

export default AccountSettings;
