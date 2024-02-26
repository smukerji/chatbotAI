import React from 'react';
import Image from 'next/image';
import logoWhite from '../../../../public/svgs/lucifer-ai-logo-white.svg';
import bluePhone from '../../../../public/svgs/bluephone.svg';
import bluePin from '../../../../public/svgs/bluepin.svg';
import blueEnvelopImg from '../../../../public/svgs/bluesms.svg';
import Twitterimg from '../../../../public/svgs/twitter-icon-white.svg';
import Linkedinimg from '../../../../public/svgs/linkedin-icon-white.svg';
import Instagramimg from '../../../../public/svgs/instagram-icon-white.svg';
import Facebookimg from '../../../../public/svgs/facebook-icon-white.svg';
import './footer.scss';

function Footer() {
  return (
    <div className='footer-section'>
      <div className='footer-container'>
        {/*------------------------------------------company address container----------------------------------------------*/}
        <div className='company-details-container'>
          <Image src={logoWhite} alt='logo-white' />
          <ul className='info'>
            <li>
              <Image src={bluePin} alt='blue-pin-img' />
              <a href=''>
                Unit F, 18/F Wordtech centre. 95 How Ming Street, Kwun Tong,
                Hong Kong
              </a>
            </li>
            <li>
              <Image src={bluePhone} alt='blue-phone-img' />
              <a href=''>+852 55 445532</a>
            </li>
            <li>
              <Image src={blueEnvelopImg} alt='blue-envelop-img' />
              <a href=''>info@sapahk.ai</a>
            </li>
          </ul>

          {/* <div className="social-media-icons-container"> */}
          <ul className='social-media-icons-container'>
            <li>
              <a href=''>
                <Image src={Twitterimg} alt={'twitter-image'} />
              </a>
            </li>
            <li>
              <a href=''>
                <Image src={Facebookimg} alt={'facebook-image'} />
              </a>
            </li>
            <li>
              <a href=''>
                <Image src={Instagramimg} alt={'instagram-image'} />
              </a>
            </li>
            <li>
              <a href=''>
                <Image src={Linkedinimg} alt={'linked-image'} />
              </a>
            </li>
          </ul>
        </div>
        {/* </div> */}

        {/*------------------------------------------company links container----------------------------------------------*/}
        <div className='links-container'>
          <h2>Company</h2>
          <ul>
            <li>
              <a href=''>About</a>
            </li>
            <li>
              <a href=''>Contact Us </a>
            </li>
            <li>
              <a href=''>News</a>
            </li>
            {/* <li>
              <a href="">Terms & Conditions</a>
            </li> */}
            <li>
              <a href='#contact-us'>Book a Demo</a>
            </li>
          </ul>
        </div>

        {/*------------------------------------------quick links container----------------------------------------------*/}
        <div className='links-container'>
          <h2>Quick Links</h2>
          <ul>
            <li>
              <a href=''>How It Works</a>
            </li>
            <li>
              <a href=''>API</a>
            </li>
            <li>
              <a href=''>Pricing</a>
            </li>
            <li>
              <a href=''>Support</a>
            </li>
          </ul>
        </div>

        {/*------------------------------------------legal links container----------------------------------------------*/}
        <div className='links-container'>
          <h2>Legal</h2>
          <ul>
            <li>
              <a href=''>Terms & Conditions</a>
            </li>
            <li>
              <a href=''>Privacy Policy</a>
            </li>
            <li>
              <a href=''>License</a>
            </li>
            <li>
              <a href=''>Security</a>
            </li>
          </ul>
        </div>

        <div className='links-container'>
          <select name='' id='' className='temp'>
            <option value='english'>English</option>
            <option value='chinese'>Chinese</option>
          </select>
        </div>
      </div>

      <div className='copyright-section'>Copyright © 2023 SAP Alliance</div>
    </div>
  );
}

export default Footer;
