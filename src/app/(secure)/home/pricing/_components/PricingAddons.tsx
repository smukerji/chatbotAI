import Image from "next/image";
import React from "react";
import zoho from "../../../../../../public/zoho.webp";
import whatsapp from "../../../../../../public/whatsapp.webp";
import telegram from "../../../../../../public/telegram.webp";
import hubspot from "../../../../../../public/hubspot.webp";
import slack from "../../../../../../public/slack.svg";

function PricingAddons() {
  return (
    <>
      <div>
        <p className="add-ons-head">Add-ons</p>
        <div className="add-ons-container add-ons-new-container">
          <div className="add-ons-left">
            <div className="add-ons-integration">
              <span className="integration-head integration-title">
                Integration Options
              </span>
              <div className="integration-list">
                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image
                      src={whatsapp}
                      alt="no image"
                      style={{ width: "40px", height: "40px" }}
                    />
                    <div className="integration">
                      <p className="integration-name">Whatsapp</p>
                      <p className="price">
                        $7 <span>per month</span>
                      </p>
                    </div>
                  </div>
                  <button
                    className="app-integration-price-btn"
                    //   disabled={whatsappDisable || !enableOne}
                    //   title={
                    //     telegramDisable || !enableOne ? NOTVALIDPLAN : undefined
                    //   }
                    //   onClick={WhatsappAddOn}
                  >
                    <span className="app-integration-price-btn-text">
                      Get Add-on
                    </span>
                  </button>
                </div>
                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image
                      src={telegram}
                      alt="no image"
                      style={{ width: "40px", height: "40px" }}
                    />
                    <div className="integration">
                      <p className="integration-name">Telegram</p>
                      <p className="price">
                        $7 <span>per month</span>
                      </p>
                    </div>
                  </div>
                  <button
                    className="app-integration-price-btn"
                    //   disabled={telegramDisable || !enableOne}
                    //   onClick={TelegramAddOn}
                    //   title={
                    //     telegramDisable || !enableOne ? NOTVALIDPLAN : undefined
                    //   }
                  >
                    <span className="app-integration-price-btn-text">
                      Get Add-on
                    </span>
                  </button>
                  {/* <div className="app-integration-price coming-soon">
                      Coming soon
                    </div> */}
                </div>
                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image src={slack} height={40} width={40} alt="no image" />
                    <div className="integration">
                      <p className="integration-name">Slack</p>
                      <p className="price">
                        $7 <span>per month</span>
                      </p>
                    </div>
                  </div>
                  {/* <div className='app-integration-price coming-soon'>Coming soon</div> */}
                  <button
                    className="app-integration-price-btn"
                    //   disabled={slackDisable || !enableOne}
                    //   title={
                    //     slackDisable || !enableOne ? NOTVALIDPLAN : undefined
                    //   }
                    //   onClick={slackAddOn}
                  >
                    <span className="app-integration-price-btn-text">
                      Get Add-on
                    </span>
                  </button>
                </div>

                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image
                      src={hubspot}
                      height={40}
                      width={40}
                      alt="no image"
                    />
                    <p className="integration-name">Instagram</p>
                  </div>
                  {/* <button
                      className='app-integration-price-btn'
                      disabled={hubspotDisable || !enableOne}
                      onClick={HubspotAddOn}
                    >
                      <span className='app-integration-price-btn-text'>Get for $7 USD</span>
                    </button> */}
                  <div className="app-integration-price coming-soon">
                    Coming soon
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="add-ons-right">
            <div className="add-ons-integration">
              {/* <p className="integration-head">Messaging Per Chatbot</p> */}
              <div className="integration-list">
                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image
                      src={hubspot}
                      height={40}
                      width={40}
                      alt="no image"
                    />
                    <p className="integration-name">Instagram</p>
                  </div>
                  {/* <button
                      className='app-integration-price-btn'
                      disabled={hubspotDisable || !enableOne}
                      onClick={HubspotAddOn}
                    >
                      <span className='app-integration-price-btn-text'>Get for $7 USD</span>
                    </button> */}
                  <div className="app-integration-price coming-soon">
                    Coming soon
                  </div>
                </div>

                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image
                      src={hubspot}
                      height={40}
                      width={40}
                      alt="no image"
                    />
                    <p className="integration-name">Instagram</p>
                  </div>
                  {/* <button
                      className='app-integration-price-btn'
                      disabled={hubspotDisable || !enableOne}
                      onClick={HubspotAddOn}
                    >
                      <span className='app-integration-price-btn-text'>Get for $7 USD</span>
                    </button> */}
                  <div className="app-integration-price coming-soon">
                    Coming soon
                  </div>
                </div>

                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image
                      src={hubspot}
                      height={40}
                      width={40}
                      alt="no image"
                    />
                    <p className="integration-name">Instagram</p>
                  </div>
                  {/* <button
                      className='app-integration-price-btn'
                      disabled={hubspotDisable || !enableOne}
                      onClick={HubspotAddOn}
                    >
                      <span className='app-integration-price-btn-text'>Get for $7 USD</span>
                    </button> */}
                  <div className="app-integration-price coming-soon">
                    Coming soon
                  </div>
                </div>

                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image
                      src={hubspot}
                      height={40}
                      width={40}
                      alt="no image"
                    />
                    <p className="integration-name">Instagram</p>
                  </div>
                  {/* <button
                      className='app-integration-price-btn'
                      disabled={hubspotDisable || !enableOne}
                      onClick={HubspotAddOn}
                    >
                      <span className='app-integration-price-btn-text'>Get for $7 USD</span>
                    </button> */}
                  <div className="app-integration-price coming-soon">
                    Coming soon
                  </div>
                </div>

                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image
                      src={hubspot}
                      height={40}
                      width={40}
                      alt="no image"
                    />
                    <p className="integration-name">Instagram</p>
                  </div>
                  {/* <button
                      className='app-integration-price-btn'
                      disabled={hubspotDisable || !enableOne}
                      onClick={HubspotAddOn}
                    >
                      <span className='app-integration-price-btn-text'>Get for $7 USD</span>
                    </button> */}
                  <div className="app-integration-price coming-soon">
                    Coming soon
                  </div>
                </div>

                {/* <div className="app-integration">
                  <div className="integration-name-container">
                    <p className="integration-name">5K Messages</p>
                  </div>
                  <button
                    className="app-integration-price-btn"
                    //   disabled={enableOne ? false : true}
                    //   onClick={MessageAddOn}
                    //   title={enableOne ? undefined : NOTVALIDPLAN}
                  >
                    <span className="app-integration-price-btn-text">
                      Get for $5 USD
                    </span>
                  </button>
                </div>
                <div className="app-integration">
                  <div className="integration-name-container">
                    <p className="integration-name">10K Messages</p>
                  </div>
                  <button
                    className="app-integration-price-btn"
                    //   disabled={enableOne ? false : true}
                    //   onClick={MessageAddOnAdvance}
                    //   title={enableOne ? undefined : NOTVALIDPLAN}
                  >
                    <span className="app-integration-price-btn-text">
                      Get for $8 USD
                    </span>
                  </button>
                </div> */}
              </div>
              {/* <button
                  className="btn-add-ons"
                  onClick={MessageAddOn}
                  disabled={enableOne ? false : true}
                  title={enableOne ? undefined : "Please purchase plan first"}
                >
                  <span className="btn-text">Get Add-on</span>
                </button> */}
            </div>
            {/* <div className="add-ons-integration">
              <p className="integration-head">Training Data</p>
              <div className="integration-list">
                <div className="app-integration">
                  <div className="integration-name-container">
                    <p className="integration-name">1M Characters</p>
                  </div>
                  <button
                    className="app-integration-price-btn"
                   
                  >
                    <span className="app-integration-price-btn-text">
                      Get for $5 USD
                    </span>
                  </button>
                </div>
              </div>
              
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
}

export default PricingAddons;
