import React from "react";
import "./security.scss";
import { Switch } from "antd";

function Security() {
  const onChange = (checked: boolean) => {
    console.log(`switch to ${checked}`);
  };
  return (
    <div className="security-container">
      <div className="security-top-section">
        <div className="visibility-container">
          <p className="visiblity-container-heading">Visibilty</p>
          <select className="visibility-container-input-box">
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>
          <p className="visibility-container-para">
            <span>
              &apos;private&apos;: No one can access your chatbot except you
              (your account)
            </span>
            <br />
            <span>
              &apos;public&apos;: Other people can chat with your chatbot if you
              send them the link. You can also embed it on your website so your
              website visitors are able to use it.
            </span>
          </p>
        </div>
        <div className="horizontal-line">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="747"
            height="2"
            viewBox="0 0 747 2"
            fill="none"
          >
            <path d="M0 1H747" stroke="#E6E8EC" />
          </svg>
        </div>
        <div className="switch-container">
          <p className="switch-text">
            Only allow the iframe and widget on specific domains
          </p>
          <div className="switch">
            <Switch onChange={onChange} />
          </div>
        </div>
        <div className="horizontal-line">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="747"
            height="2"
            viewBox="0 0 747 2"
            fill="none"
          >
            <path d="M0 1H747" stroke="#E6E8EC" />
          </svg>
        </div>
        <div className="rating-container">
          <p className="rating-title">Rate Limiting</p>
          <p className="rating-desc">
            Limit the number of messages sent from one device on the Torri and
            chat bubble (this limit will not be applied to you on Torri,
            only on your website for your users to prevent abuse).
          </p>
          <div className="rating-bottom">
            <p className="rating-limit">Limit to only</p>
            <input type="number" defaultValue={20} />
            <p className="rating-msg">Message every</p>
            <input type="number" defaultValue={240} />
            <p className="rating-seconds">Seconds.</p>
          </div>
        </div>
        <div className="horizontal-line">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="747"
            height="2"
            viewBox="0 0 747 2"
            fill="none"
          >
            <path d="M0 1H747" stroke="#E6E8EC" />
          </svg>
        </div>
        <div className="limit-container">
          <p className="limit-title">
            Show this message to show when limit is hit
          </p>
          <input type="text" defaultValue="Too many messages in a row" />
        </div>
      </div>
      <button className="btn">
        <p>Save</p>
      </button>
    </div>
  );
}

export default Security;
