import React, { useState, useEffect, useDebugValue } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import '../../pricing/stripe.scss';
import Image from 'next/image';
import tickCircle from '../../../../../../public/svgs/tick-circle.svg';
import unTickCircle from '../../../../../../public/svgs/untick-circle.svg';
import line from '../../../../../../public/svgs/Vector 2189.svg';
import { number } from 'joi';

export default function PlanTwo({ setPlan, price ,setPrice, prePrice}: any) {
  const { status } = useSession();
  const router = useRouter();

  const changePlan = async () => {
    if (status === 'authenticated') {
      setPrice(Number(price) - Number(prePrice))
      console.log(prePrice)
      setPlan(2);
    }
  };

  return (
    <div className="plan-box">
      <div className="plan-plan">
        <div className="plan-name-price">
          <span className="plan-name">Agency Plan</span>
          <span className="plan-placeholder">
            Have a go and test your superpowers
          </span>
        </div>
        <div className="plan-price-container">
          <div className="plan-price-frame">
            <span className="price-sign">$</span>
            <span className="price-number">{price}</span>
          </div>
        </div>
      </div>
      <div className="plan-container-list">
        <button className="pay-btn" disabled={true}>
          <span className="btn-text">Coming soon ...</span>
        </button>
        <div className="plan-details">
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">5 chatbots</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              2k messages / chatBot / month
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Limit to 20 links to train/chatbot
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Limit to 1000k characters to train /chatbot
            </span>
          </div>
          <Image src={line} alt="no image" />
          <div className="plan-item">
            <span className="plan-text-head ">
              Allowed Training Data
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Links</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Pdf</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Doc</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Txt</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Q&A</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Excel & CSV</span>
          </div>
          <Image src={line} alt="no image" />
          <div className="plan-item">
            <span className="plan-text-head">
              Integration{' '}
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Embed on unlimited websites
            </span>
          </div>
          <Image src={line} alt="no image" />
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              View Conversation History
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Optional Collect Leads
            </span>
          </div>
          <Image src={line} alt="no image" />
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Limited Support (reply within 7 days)
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Customize Chatbot’s Personality
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Choose GPT-4</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Setting Tone of the Bot
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Feedback Learning</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Dashboard Analytics
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Multilingual Support with Auto Translation
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Affliliation/API Access
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Remove Branding</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Duplicate Bots</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Share & Delete Bots
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Role Based Access</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Team Collaboration</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Organizing Data Sources into Folder
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Content Summarization
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Chrome Extension</span>
          </div>
        </div>
      </div>
    </div>
  );
}
