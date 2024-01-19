import React, { useState } from "react";
import "./../chatInterface/chatInterface.scss";
import { Button, ColorPicker, Input } from "antd";
import DeleteIcon from "@/assets/svg/DeleteIcon";
import Icon from "@/app/_components/Icon/Icon";
import Image from "next/image";
import uploadIcon from "../../../../../../../../../public/create-chatbot-svgs/image-upload-icon.svg";
import ChatBotIcon from "../../../../../../../../../public/create-chatbot-svgs/ChatBotIcon.svg";
import like from "../../../../../../../../../public/svgs/like.svg";
import dislike from "../../../../../../../../../public/svgs/dislike.svg";
import ChatBubbleButton from "../../../../../../../../../public/create-chatbot-svgs/ChatBubbleButton.svg";

function ChatInterface() {
  const [userMessageColor, setUserMessageColor] = useState<string>("#fe632f");
  const [theme, setTheme] = useState<string>("Light");
  const [iconPlacement, setIconPlacement] = useState<string>("Left");
  const [displayName, setDisplayName] = useState<string>("Super Bot");
  const [initialMessage, setInitialMessage] = useState<string>(
    "Hello! What can I help you today?"
  );
  const [suggestedMessage, setSuggestedMessage] = useState<string>(
    "This is suggested message"
  );

  const [popupCount, setPopupCount] = useState<number>(10);

  // for reset input button

  const [initialMessageReset, setInitialMessageReset] = useState<string>(
    "Hello! What can I help you today?"
  );
  const [suggestedMessageReset, setSuggestedMessageReset] = useState<string>(
    "This is suggested message "
  );
  const [popupCountReset, setPopupCountReset] = useState<number>(10);

  const [userMessageColorReset, setUserMessageColorReset] =
    useState<string>("#fe632f");

  return (
    <div className="chat-interface-parent">
      <div className="training-container">
        {/* ----------- for form fillup */}
        <div className="training-left-container">
          <p className="note">Note: Applies when embedded on a website</p>

          <div className="initial-message-container">
            <p className="initial-message-text"> Initial Messages</p>
            <Button
              type="text"
              className="initial-message-button"
              onClick={(e) => {
                setInitialMessage(initialMessageReset);
              }}
            >
              Reset
            </Button>
          </div>

          <input
            className="input-container"
            defaultValue={initialMessage}
            value={initialMessage}
            onChange={(e) => {
              setInitialMessage(e.target.value);
            }}
          ></input>

          <p className="helper-text">Enter each message in a new line.</p>

          {/* ---------- for suggested */}
          <div className="initial-message-container">
            <p className="initial-message-text"> Suggested Messages</p>
            <Button
              type="text"
              className="initial-message-button"
              onClick={(e) => {
                setSuggestedMessage(suggestedMessageReset);
              }}
            >
              Reset
            </Button>
          </div>

          <input
            className="input-container"
            defaultValue={suggestedMessage}
            value={suggestedMessage}
            onChange={(e) => {
              setSuggestedMessage(e.target.value);
            }}
          ></input>

          <p className="helper-text">Enter each message in a new line.</p>
          {/* ------------for message placeholder */}
          <div className="message-container">
            <p className="message-placeholder">Message Placeholder</p>
            <input
              type="text"
              className="message-input"
              placeholder="Enter your message here"
            />
            <p className="message-helper-text">
              Enter each message in a new line.
            </p>
          </div>

          {/* --------------------Theme container----------------- */}
          <div className="theme-container">
            <p className="theme-title">Theme</p>
            <div className="theme-radio-container">
              <div className="theme-radio-group1">
                <input
                  type="radio"
                  name="Theme"
                  value="Light"
                  onChange={(e) => {
                    setTheme(e.target.value);
                  }}
                  checked={theme === "Light"}
                />
                <label htmlFor="Light">Light</label>
              </div>
              <div className="theme-radio-group2">
                <input
                  type="radio"
                  name="Theme"
                  value="Dark"
                  onChange={(e) => {
                    setTheme(e.target.value);
                  }}
                  checked={theme === "Dark"}
                />
                <label htmlFor="Dark">Dark</label>
              </div>
            </div>

            <p className="theme-helper-text">
              Enter each message in a new line.
            </p>
          </div>

          {/* --------------display-container */}
          <div className="display-container">
            <p className="display-text">Display name</p>
            <input
              type="text"
              className="display-iput"
              placeholder="Super Bot"
              onChange={(e) => {
                setDisplayName(e.target.value);
              }}
            />
          </div>

          {/* --------------update chat bot profile image */}

          <div className="update-chatbot-profile-pic">
            <p className="profile-pic-title">Update Chatbot Profile Picture</p>
            <div className="profile-image-container">
              <input type="file" />
              <Icon Icon={DeleteIcon} />
            </div>
          </div>

          {/* ------------user message color */}
          <div className="user-message-color">
            <div className="user-message-color-top">
              <p className="user-message-color-top-text">User Message Color</p>
              <Button
                type="text"
                className="user-message-color-top-btn"
                onClick={() => {
                  setUserMessageColor(userMessageColorReset);
                }}
              >
                Reset
              </Button>
            </div>
            <div className="user-message-color-bottom">
              <ColorPicker
                className="user-message-color-picker"
                defaultValue={userMessageColor}
                value={userMessageColor}
                onChange={(value, hex) => {
                  setUserMessageColor(hex);
                }}
              />
            </div>
          </div>

          {/* --------------update chat icon */}

          <div className="update-chat-icon-container">
            <p className="update-chat-icon-text">Update chat icon</p>
            <div className="update-chat-icon-image-container">
              <input type="image" />
              <Icon Icon={DeleteIcon} />
            </div>
          </div>

          {/* ----------for chat bubble */}
          <div className="chat-bubble-container">
            <p className="chat-bubble-title"> Chat Bubble Button Color </p>
            <ColorPicker
              className="chat-bubble-color-picker"
              onChange={(value, hex) => {}}
            />
          </div>

          {/* align chat bubble radion button */}
          <div className="chat-bubble-radion-container">
            <p className="chat-bubble-radio-text">Align Chat Bubble Button</p>
            <div className="chat-radio-container">
              <div className="chat-radio-group1">
                <input
                  type="radio"
                  name="chat"
                  value="Left"
                  onChange={(e) => {
                    setIconPlacement(e.target.value);
                  }}
                  checked={iconPlacement === "Left"}
                />
                <label htmlFor="Left">Left</label>
              </div>
              <div className="chat-radio-group2">
                <input
                  type="radio"
                  name="chat"
                  value="Right"
                  onChange={(e) => {
                    setIconPlacement(e.target.value);
                  }}
                  checked={iconPlacement === "Right"}
                />
                <label htmlFor="Right">Right</label>
              </div>
            </div>
          </div>

          {/* ----------auto show container */}
          <div className="auto-show-container">
            <div className="auto-show-container-title-section">
              <p className="auto-show-container-title-text">
                Auto show initial messages pop-ups after
              </p>
              <Button
                type="text"
                className="auto-show-btn"
                onClick={() => {
                  setPopupCount(Number(popupCountReset));
                }}
              >
                Reset
              </Button>
            </div>

            <input
              type="number"
              className="auto-show-input"
              defaultValue={popupCount}
              value={popupCount}
              onChange={(e) => {
                setPopupCount(Number(e.target.value));
              }}
            />

            <p className="auto-show-helper">Seconds (Negative to disabel)</p>
          </div>

          {/* ------------- save button */}
          <button className="save-btn">
            <p className="save-btn-text">Save</p>
          </button>
        </div>

        {/* -----------for chat bot */}
        <div className="training-right-container">
          <div
            className="chat-box-container"
            style={{ backgroundColor: theme === "Dark" ? "black" : "" }}
          >
            <div className="chat-box-header">
              <div className="chat-box-image-container">
                <Image src={ChatBotIcon} alt="chatBotIcon" />
              </div>
              <p
                className="chat-box-header-title"
                style={{ color: theme === "Dark" ? "white" : "" }}
              >
                {displayName}
              </p>
            </div>
            <div className="chat-box-body">
              {/* -----------------bots message-------------- */}
              <div className="message bot">
                <div
                  className="msg"
                  style={{
                    backgroundColor: theme === "Dark" ? "#353945" : "",
                    color: theme === "Dark" ? "#FCFCFD" : "",
                  }}
                >
                  {initialMessage}
                </div>
                <div className="like-icons">
                  <div className="like-img">
                    <Image src={like} alt="Like" />
                  </div>
                  <div className="like-img">
                    <Image src={dislike} alt="Dislike" />
                  </div>
                </div>
              </div>
              {/* -------------------user message */}
              <div className="message user">
                <div className="date">10/01/2024 16:30</div>
                <div
                  className="msg"
                  style={{ backgroundColor: userMessageColor }}
                >
                  What’s your name?
                </div>
              </div>
            </div>
            <div className="suggested-container">
              <div
                className="suggested-msg"
                style={{
                  backgroundColor: theme === "Dark" ? "#353945" : "",
                  color: theme === "Dark" ? "#FCFCFD" : "",
                }}
              >
                {suggestedMessage}
              </div>
              <div
                className="powered-by"
                style={{ color: theme === "Dark" ? "#B1B5C3" : "" }}
              >
                Powered by Lucifer.AI
              </div>
            </div>
            <div
              className="chat-box-footer"
              style={{ backgroundColor: theme === "Dark" ? "#353945" : "" }}
            >
              <input
                type="text"
                placeholder="Enter your message here"
                style={{ backgroundColor: theme === "Dark" ? "#353945" : "" }}
              />
              <span
                className="icon"
                style={{ backgroundColor: userMessageColor }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="vuesax/outline/send">
                    <g id="send">
                      <path
                        id="Vector"
                        d="M5.40995 21.7492C4.28995 21.7492 3.57995 21.3692 3.12995 20.9192C2.24995 20.0392 1.62995 18.1692 3.60995 14.1992L4.47995 12.4692C4.58995 12.2392 4.58995 11.7592 4.47995 11.5292L3.60995 9.79917C1.61995 5.82917 2.24995 3.94917 3.12995 3.07917C3.99995 2.19917 5.87995 1.56917 9.83995 3.55917L18.3999 7.83917C20.5299 8.89917 21.6999 10.3792 21.6999 11.9992C21.6999 13.6192 20.5299 15.0992 18.4099 16.1592L9.84995 20.4392C7.90995 21.4092 6.46995 21.7492 5.40995 21.7492ZM5.40995 3.74917C4.86995 3.74917 4.44995 3.87917 4.18995 4.13917C3.45995 4.85917 3.74995 6.72917 4.94995 9.11917L5.81995 10.8592C6.13995 11.5092 6.13995 12.4892 5.81995 13.1392L4.94995 14.8692C3.74995 17.2692 3.45995 19.1292 4.18995 19.8492C4.90995 20.5792 6.77995 20.2892 9.17995 19.0892L17.7399 14.8092C19.3099 14.0292 20.1999 12.9992 20.1999 11.9892C20.1999 10.9792 19.2999 9.94917 17.7299 9.16917L9.16995 4.89917C7.64995 4.13917 6.33995 3.74917 5.40995 3.74917Z"
                        fill="#fdfcfc"
                      />
                      <path
                        id="Vector_2"
                        d="M10.8399 12.75H5.43994C5.02994 12.75 4.68994 12.41 4.68994 12C4.68994 11.59 5.02994 11.25 5.43994 11.25H10.8399C11.2499 11.25 11.5899 11.59 11.5899 12C11.5899 12.41 11.2499 12.75 10.8399 12.75Z"
                        fill="#FCFCFD"
                      />
                    </g>
                  </g>
                </svg>
              </span>
            </div>
          </div>
          <div
            className="message-icon-container"
            style={{
              justifyContent: iconPlacement === "Right" ? "flex-end" : "",
            }}
          >
            <Image src={ChatBubbleButton} alt="chat-bubble" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
