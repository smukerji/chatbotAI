import React, { useState, useEffect, useDebugValue } from "react";
import axios from "axios";
import "../../pricing/stripe.scss";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import tickCircle from "../../../../../../public/svgs/tick-circle-white.svg";
import unTickCircle from "../../../../../../public/svgs/tick-circle -blue.svg";
import line from "../../../../../../public/svgs/Vector 2189.svg";
import { useCookies } from "react-cookie";
import { Tooltip } from "antd";

export default function PlanOne({ setPlan, setPrice, price, enableOne }: any) {
  const { status } = useSession();
  const router = useRouter();
  const [cookies, setCookie] = useCookies(["userId"]);
  console.log(cookies);
  const changePlan = async () => {
    if (cookies?.userId) {
      if (price == 15) {
        router.push(`/home/pricing/checkout/${1}`);
      } else {
        router.push(`/home/pricing/checkout/${3}`);
      }
    } else {
      router.push("/account/login");
    }
  };
  return (
    <div className="plan-box plan-box-even">
      <div className="plan-plan">
        <div className="plan-name-price">
          <span className="plan-name plan-name-even">individual</span>
          <span className="plan-placeholder plan-placeholder-even">
            Start your <span className="free-trial">7-day free trial</span>
          </span>
        </div>
        <div className="plan-price-container">
          <div className="plan-price-frame">
            <span className="price-sign price-sign-even">$</span>
            <span className="price-number price-number-even">{price}</span>
          </div>
        </div>
      </div>
      <div className="plan-container-list">
        {/* <Tooltip
          placement='bottom'
          title={enableOne ? 'Already have plan' : 'undefined'}
        > */}
        <button
          className="pay-btn plan1"
          onClick={changePlan}
          disabled={enableOne}
          title={enableOne ? "Already have plan" : undefined}
        >
          <span className="btn-text">Start 7-day trial</span>
        </button>
        {/* </Tooltip> */}
        <div className="plan-details">
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">1 chatbots</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              2k messages / month
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Limit to 10 links to train/chatbot
            </span>
          </div>
          <div className="plan-item horizontal-line">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Limit to 1000k characters to train /chatbot
            </span>
          </div>

          <div className="plan-item">
            <span className="plan-text-head plan-text-head-even">
              Allowed Training Data
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Links</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Pdf</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Doc</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Txt</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Q&A</span>
          </div>
          <div className="plan-item horizontal-line">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Excel & CSV</span>
          </div>

          <div className="plan-item">
            <span className="plan-text-head plan-text-head-even">
              Integration{" "}
            </span>
          </div>
          <div className="plan-item horizontal-line">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Embed on unlimited websites
            </span>
          </div>

          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              View Conversation History
            </span>
          </div>
          <div className="plan-item horizontal-line">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Optional Collect Leads
            </span>
          </div>

          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Limited Support (reply within 7 days)
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Customize Chatbot’s Personality
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Choose GPT-4</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Setting Tone of the Bot
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Feedback Learning</span>
          </div>
          <div className="plan-item">
            <Image src={unTickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Dashboard Analytics
            </span>
          </div>
          <div className="plan-item">
            <Image src={unTickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Multilingual Support with Auto Translation
            </span>
          </div>
          <div className="plan-item">
            <Image src={unTickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Affliliation/API Access
            </span>
          </div>
          <div className="plan-item">
            <Image src={unTickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Remove Branding</span>
          </div>
          <div className="plan-item">
            <Image src={unTickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Duplicate Bots</span>
          </div>
          <div className="plan-item">
            <Image src={unTickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Share & Delete Bots
            </span>
          </div>
          <div className="plan-item">
            <Image src={unTickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Role Based Access</span>
          </div>
          <div className="plan-item">
            <Image src={unTickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Team Collaboration
            </span>
          </div>
          <div className="plan-item">
            <Image src={unTickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Organizing Data Sources into Folder
            </span>
          </div>
          <div className="plan-item">
            <Image src={unTickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Content Summarization
            </span>
          </div>
          <div className="plan-item">
            <Image src={unTickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Chrome Extension</span>
          </div>
        </div>
      </div>
    </div>
  );
}
