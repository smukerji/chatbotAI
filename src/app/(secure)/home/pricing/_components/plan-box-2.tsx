import React, { useState, useEffect, useDebugValue } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import "../../pricing/stripe.scss";
import Image from "next/image";
import tickCircle from "../../../../../../public/svgs/tick-circle.svg";
import unTickCircle from "../../../../../../public/svgs/untick-circle.svg";
import line from "../../../../../../public/svgs/Vector 2189.svg";
import { number } from "joi";
import { useCookies } from "react-cookie";
import CryptoJS from "crypto-js";

export default function PlanTwo({
  setPlan,
  price,
  setPrice,
  prePrice,
  enableTwo,
  text,
  messages,
}: any) {
  const { status } = useSession();
  const [cookies, setCookie] = useCookies(["userId"]);
  const router = useRouter();

  const changePlan = async () => {
    if (cookies?.userId) {
      if (price == 89) {
        const fPrice = price - prePrice;
        const a = CryptoJS.AES.encrypt(
          JSON.stringify(fPrice),
          "xyz"
        ).toString();
        const data = encodeURIComponent(a);
        router.push(`/home/pricing/checkout/${2}?a=${data}`);
      } else {
        const fPrice = price - prePrice;
        const a = CryptoJS.AES.encrypt(
          JSON.stringify(fPrice),
          "xyz"
        ).toString();
        const data = encodeURIComponent(a);
        router.push(`/home/pricing/checkout/${4}?a=${data}`);
      }
    } else {
      router.push("/account/login");
    }
  };

  return (
    <div className="plan-box">
      <div className="plan-plan">
        <div className="plan-name-price">
          <span className="plan-name">Agency Plan</span>
          <span className="plan-placeholder">
            For small and medium businesses
          </span>
        </div>
        <div className="plan-price-container">
          <div className="plan-price-frame">
            <span className="price-sign">$</span>
            <span className="price-number">{price - prePrice}</span>
          </div>
        </div>
      </div>
      <div className="plan-container-list">
        <button className="pay-btn" disabled={true}>
          <span className="btn-text">Coming Soon</span>
        </button>
        <div className="plan-details">
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">5 Chatbots</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">{messages}</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Unlimited website links allowed for training
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              1,000,000 characters allowed for training
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Choose GPT 3.5/4/4o</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Embed on website</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Lead form</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Unlimited conversation history</span>
          </div>

          {/* <div className="plan-item">
            <span className="plan-text-head ">Allowed Training Data</span>
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
          <div className="plan-item horizontal-line-2">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Excel & CSV</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Embed on unlimited websites</span>
          </div>

          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              View & Export Conversation History
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Optional Collect Leads</span>
          </div>

          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">
              Limited Support (reply within 7 days)
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Customize Chatbot’s Personality</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Choose GPT-4</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Setting Tone of the Bot</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Feedback Learning</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text">Remove Branding</span>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text">Share & Delete Bots</span>
            </div>
            <div className="coming-soon">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text">Lead Collection</span>
            </div>
            <div className="coming-soon">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text">Dashboard Analytics</span>
            </div>
            <div className="coming-soon">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text">
                Multilingual Support with Auto Translation
              </span>
            </div>
            <div className="coming-soon">Coming soon</div>
          </div>

          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text">Duplicate Bots</span>
            </div>
            <div className="coming-soon">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text">Role Based Access</span>
            </div>
            <div className="coming-soon">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text">Team Collaboration</span>
            </div>
            <div className="coming-soon">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text">
                Organizing Data Sources into Folder
              </span>
            </div>
            <div className="coming-soon">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text">Content Summarization</span>
            </div>
            <div className="coming-soon">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text">Chrome Extension</span>
            </div>
            <div className="coming-soon">Coming soon</div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
