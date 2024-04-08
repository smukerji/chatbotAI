import React from 'react';
import './hero-section.scss';
import Image from 'next/image';
import smsIcon from '../../../../public/svgs/sms.svg';
import HeaderImage from '../../../../public/sections-images/header-background/Group1.png';

function HeroSection() {
  return (
    <>
      <div className='hero-section-container'>
        <h1 className='title'>
          Seamless Support Starts Here: AI-Powered Solutions for Every Customer
          Query
        </h1>

        <p className='description'>
          Elevate your customer service experience to new heights by empowering
          your audience with the instant, reliable answers they seek, any time
          of the day. Lucifer AI scans your website, help center or other
          sources to provide quick and accurate AI-generated answers to customer
          questions.
        </p>

        <div className='request-demo-email-container'>
          <div className='email-input'>
            {/* <Image src={smsIcon} alt='sms-icon' /> */}
            <input type='text' placeholder='Enter your email' />
          </div>
          <a
            style={{ color: 'white', textDecoration: 'none' }}
            href='#contact-us'
          >
            <button className='request-demo-btn'>Book a Demo</button>
          </a>
        </div>
        <p className='free-trial'>Free 7-day trial No credit card required</p>

        <div className='grp-img'>
          <Image src={HeaderImage} alt='image' />
        </div>
      </div>
    </>
  );
}

export default HeroSection;
