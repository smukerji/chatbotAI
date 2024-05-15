'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import loginBg from '../../../../../../public/sections-images/common/contact-us-bg-cover.png';
import luciferIcon from '../../../../../../public/svgs/lucifer-ai-logo.svg';
import googleIcon from '../../../../../../public/google-icon-blue.svg';
import githubIcon from '../../../../../../public/github-icon-blue.svg';
import openEyeIcon from '../../../../../../public/svgs/open-eye.svg';
import closeEyeIcon from '../../../../../../public/svgs/close-eye.svg';

import '../login.scss';
import { signIn, useSession } from 'next-auth/react';
import { LoadingOutlined } from '@ant-design/icons';
import { redirect } from 'next/navigation';
import { useUserService } from '../../../../_services/useUserService';
import { Spin, message } from 'antd';
import CaptchaErrorMessage from '@/app/_components/CaptchaErrorMessage';
import useVerifyReCaptcha from '@/app/_helpers/useVerifyRecaptcha';

function LoginPage() {
  const { handleReCaptchaVerify, captchaVerifyMessage } = useVerifyReCaptcha();
  /// email and password messages state
  const [emailMessage, setEmailMessage]: any = useState('');
  const [passwordMessage, setPasswordMessage]: any = useState('');
  const [showPassword, setShowPassword] = useState(false);
  /// email and password storing state
  const [email, setEmail]: any = useState(null);
  const [password, setPassword]: any = useState(null);

  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const antIcon = (
    <LoadingOutlined
      style={{ fontSize: 24, color: 'black', margin: '10px 0' }}
      spin
    />
  );
  if (status === 'authenticated') {
    const searchParams = new URLSearchParams(window.location.search);
    const key = searchParams.get('key');

    if (!key) {
      window.location.href = '/chatbot';
    } else {
      window.location.href = String(key);
    }
  }

  const userService = useUserService();
  /// when the form is submitted
  const login = async () => {
    /// check if anything is empty
    let isCaptchaVerify = await handleReCaptchaVerify();
    if (email == null) {
      setEmailMessage('Email required.');
      return;
    }

    if (password == null) {
      setPasswordMessage('Please input your password!');
      return;
    }
    if (isCaptchaVerify) {
      setLoading(true);
      userService.login(email, password).then((data: any) => {
        if (!data?.username) {
          message.error(data);
        } else {
          const searchParams = new URLSearchParams(window.location.search);
          const key = searchParams.get('key');
          message.info(`Welcome back ${data?.username}!`);
          if (key == null) {
            window.location.href = '/chatbot';
          } else {
            window.location.href = String(key);
          }

          // Replace the current history entry
          window.history.replaceState(null, '', window.location.href);
        }

        setLoading(false);
      });
    }
  };

  /// function to validate email
  const checkEmail = (e: any) => {
    let email: string = e?.target?.value.toLowerCase();
    if (email == '') {
      setEmailMessage('Please enter email');
      return;
    }
    setEmail(email);

    const pattern = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    //   message: "Invalid email address format",

    /// validate email
    const result = email?.match(pattern);

    if (!result) {
      setEmailMessage('Invalid email format.');
    } else {
      setEmailMessage('');
    }

    // const email.(pattern)
  };

  /// function to validate password
  const checkPassword = (e: any) => {
    let password: string = e?.target?.value;
    setPassword(password);

    if (!password.length) {
      setPasswordMessage('Password required.');
    } else {
      setPasswordMessage('');
    }
  };

  /// to toggle eye icon
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Google and Github signin method
  const handleSignIn = async (provider: string) => {
    try {
      await signIn(provider);
      // After successful sign-in, replace the current history entry
      window.history.replaceState(null, '', window.location.href);
    } catch (error) {
      console.error('Sign-in error:', error);
    }
  };

  return (
    <div className='login-container'>
      {/* --------------------------left section------------------------------ */}
      <div className='left'>
        <Image src={loginBg} alt='login-background' />
      </div>
      {/* --------------------------right section------------------------------ */}
      <div className='right'>
        <Image
          src={luciferIcon}
          alt='torri-logo'
          onClick={() => (window.location.href = '/')}
          style={{ cursor: 'pointer' }}
        />
        <div className='login-form'>
          <h1>
            <span>Welcome back!</span>
            <span>Glad to see you again!</span>
          </h1>

          <div className='input-container'>
            <div>
              <input
                type='text'
                placeholder='Enter your Email'
                onBlur={checkEmail}
                onKeyDown={(e) => {
                  if (e.key == 'Enter')
                    if (emailMessage == '' && passwordMessage == '') login();
                }}
              />
              <p
                style={{
                  color: 'red',
                  margin: '5px 0 0 5px',
                }}
              >
                {emailMessage}
              </p>
            </div>
            <div className='password-container'>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter your Password'
                onChange={checkPassword}
                onKeyDown={(e) => {
                  if (e.key == 'Enter')
                    if (emailMessage == '' && passwordMessage == '') login();
                }}
              />
              <Image
                className='eye-icon'
                src={showPassword ? openEyeIcon : closeEyeIcon}
                alt='eye-icon'
                width={24}
                height={24}
                onClick={togglePasswordVisibility}
              />
              <p
                style={{
                  color: 'red',
                  margin: '5px 0 0 5px',
                }}
              >
                {passwordMessage}
              </p>
            </div>
            <CaptchaErrorMessage captchaVerifyMessage={captchaVerifyMessage} />
            <a href='reset-password'>Forgot password?</a>
          </div>

          <div className='login-register-cotainer'>
            <div>
              <button
                className='login-btn'
                onClick={() => {
                  if (emailMessage == '' && passwordMessage == '') login();
                }}
              >
                Log In
              </button>
              {loading && <Spin style={{ width: '20%' }} indicator={antIcon} />}
            </div>

            <div className='section'>
              <label>Or Login with</label>

              <button onClick={() => handleSignIn('google')}>
                <Image src={googleIcon} alt='' />
                <span>Google</span>
              </button>

              <button onClick={() => handleSignIn('github')}>
                <Image src={githubIcon} alt='' />
                <span>Github</span>
              </button>
            </div>

            <div className='section'>
              <label>Don&rsquo;t have account?</label>

              <a href='/account/register'>Register Now</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
