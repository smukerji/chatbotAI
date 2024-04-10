'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import loginBg from '../../../../../public/sections-images/common/contact-us-bg-cover.png';
import luciferIcon from '../../../../../public/svgs/lucifer-ai-logo.svg';

import './verifyEmail.scss';
import { signIn, useSession } from 'next-auth/react';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin, message } from 'antd';
import axios from 'axios';

function VerifyEmail() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false);
  const antIcon = <LoadingOutlined style={{ fontSize: 24, color: 'black', margin: '10px 0' }} spin />;
  const handleClick = async () => {
    console.log("I AM HERE")
    const response = await axios.post("/api/account/resend", {
      email: email,
    });
    message.success(response.data.message)
  }
  
  useEffect(()=>{
    let email: any = localStorage.getItem('email')
    setEmail(email)
  }, [])
  
  return (
    <div className='verify-email-container'>
      {/* --------------------------left section------------------------------ */}
      <div className='left'>
        <Image src={loginBg} alt='login-background' />
      </div>
      {/* --------------------------right section------------------------------ */}
      <div className='right'>
        <Image
          src={luciferIcon}
          alt='lucifer-logo'
          onClick={() => (window.location.href = '/')}
          style={{ cursor: 'pointer' }}
        />
        <div className='verify-email-main'>
          <h1>
            <span>Verify your</span>
            <span>Email Address</span>
          </h1>
          <p className='para'>
            <span>We have sent a verification link to </span><span style={{color:'black', fontWeight: 'bold'}}>{email}</span><br/>
            <span>Click on the link to complete the verification process.</span>
          </p>


          <div className='resend-container'>
            <div>
              <button
                className='login-btn'
                onClick={handleClick}
              >
               Resend Email
              </button>
              {loading && <Spin style={{ width: '20%' }} indicator={antIcon} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
