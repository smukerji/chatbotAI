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

export default function PlanOne({
  setPlan,
  setPrice,
  price,
  enableOne,
  text,
  messages,
}: any) {
  const { status } = useSession();
  const router = useRouter();
  const [cookies, setCookie] = useCookies(["userId"]);
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
          <span className="plan-name plan-name-even">Individual Plan</span>
          <span className="plan-placeholder plan-placeholder-even">
            <span className="free-trial">For startups or personal use</span>
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
          <span className="btn-text">{text}</span>
        </button>
        {/* </Tooltip> */}
        <div className="plan-details">
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">1 Chatbot</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">{messages}</span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              10 website links allowed for training
            </span>
          </div>
          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              1,000,000 characters allowed for training
            </span>
          </div>

          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Choose GPT 3.5/4/4o
            </span>
          </div>

          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Embed on website</span>
          </div>

          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Lead form</span>
          </div>

          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Unlimited conversation history
            </span>
          </div>

          {/* <div className="plan-item">
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
          </div> */}

          {/* <div className="plan-item">
            <span className="plan-text-head plan-text-head-even">
              Integration{" "}
            </span>
          </div> */}
          {/* <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              Embed on unlimited websites
            </span>
          </div>

          <div className="plan-item">
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">
              View & Export Conversation History
            </span>
          </div>
          <div className="plan-item">
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
            <Image src={tickCircle} alt="no-svg" />
            <span className="plan-text  plan-text-even">Remove Branding</span>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={unTickCircle} alt="no-svg" />
              <span className="plan-text  plan-text-even plan-text-not">
                Share & Delete Bots
              </span>
            </div>
            <div className="coming-soon-even">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={unTickCircle} alt="no-svg" />
              <span className="plan-text  plan-text-even plan-text-not">
                Lead Collection
              </span>
            </div>
            <div className="coming-soon-even">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={unTickCircle} alt="no-svg" />
              <span className="plan-text  plan-text-even plan-text-not">
                Dashboard Analytics
              </span>
            </div>
            <div className="coming-soon-even">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={unTickCircle} alt="no-svg" />
              <span className="plan-text  plan-text-even plan-text-not">
                Multilingual Support with Auto Translation
              </span>
            </div>
            <div className="coming-soon-even">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={unTickCircle} alt="no-svg" />
              <span className="plan-text  plan-text-even plan-text-not">
                Duplicate Bots
              </span>
            </div>
            <div className="coming-soon-even">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={unTickCircle} alt="no-svg" />
              <span className="plan-text  plan-text-even plan-text-not">
                Role Based Access
              </span>
            </div>
            <div className="coming-soon-even">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={unTickCircle} alt="no-svg" />
              <span className="plan-text  plan-text-even plan-text-not">
                Team Collaboration
              </span>
            </div>
            <div className="coming-soon-even">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={unTickCircle} alt="no-svg" />
              <span className="plan-text  plan-text-even plan-text-not">
                Organizing Data Sources into Folder
              </span>
            </div>
            <div className="coming-soon-even">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={unTickCircle} alt="no-svg" />
              <span className="plan-text  plan-text-even plan-text-not">
                Content Summarization
              </span>
            </div>
            <div className="coming-soon-even">Coming soon</div>
          </div>
          <div className="plan-item-container">
            <div className="plan-item">
              <Image src={unTickCircle} alt="no-svg" />
              <span className="plan-text  plan-text-even plan-text-not">
                Chrome Extension
              </span>
            </div>
            <div className="coming-soon-even">Coming soon</div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
