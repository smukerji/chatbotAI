'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import loginBg from '../../../../../public/sections-images/common/contact-us-bg-cover.png';
import luciferIcon from '../../../../../public/svgs/lucifer-ai-logo.svg';
import { useUserService } from '../../../_services/useUserService';
import '../verify-email/verifyEmail.scss';
import { signIn, useSession } from 'next-auth/react';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin, message } from 'antd';
import jwt from 'jsonwebtoken';

function EmailVerified() {

  const userService = useUserService();
  const [loading, setLoading] = useState(false);
  const antIcon = <LoadingOutlined style={{ fontSize: 24, color: 'black', margin: '10px 0' }} spin />;
  


  const handleOk = async () => {
    const searchParams = new URLSearchParams(location.search);
    const jwtToken: any = searchParams.get('jwt');
    const decodedToken: any = jwt.decode(jwtToken);
    console.log(decodedToken.email);
    const email: string = decodedToken.email;
  
    await userService.verify(email).then((data: any) => {
      if (data) {
        if (data?.message) message.success(data?.message);
        else message.error(data);
      }
    });
  };

  useEffect(() => {handleOk()}, []);

  return (
    <div className='login-container'>
      <div className='right'>
        <Image
          src={luciferIcon}
          alt='lucifer-logo'
          onClick={() => (window.location.href = '/')}
          style={{ cursor: 'pointer' }}
        />
        <div className='login-form'>
          <h1>
            <span>Email Verified!</span>
          </h1>
          <p className='para'>
            <span>Your Email was successfully verified.</span>
          </p>

          <div className='login-register-cotainer'>
            <div>
              <button className='login-btn'>Get started</button>
              {loading && <Spin style={{ width: '20%' }} indicator={antIcon} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerified;
