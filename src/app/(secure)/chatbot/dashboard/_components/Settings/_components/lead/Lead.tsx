import React, { useState } from "react";
import "./lead.scss";
import { Button, Radio, Switch } from "antd";

function Lead() {
  const [value, setValue] = useState("");
  const onChange = (e: any) => {
    console.log("radio checked", e.target.value);
    setValue(e.target.value);
  };

  return (
    <>
      <div className="lead-container">
        <div
          style={{
            width: "100%",
            display: "flex",
            gap: "8px",
            flexDirection: "column",
          }}
        >
          <div className="title-container">
            <p className="title-message-text">Title</p>
            <Button
              type="text"
              className="title-message-button"
              onClick={(e) => {}}
            >
              Reset
            </Button>
          </div>

          <input
            type="text"
            className="title-input"
            placeholder="Let us know how to contact you"
            //   defaultValue={botSettings?.messagePlaceholder}
            //   onChange={(e) => {
            //     botSettingContext?.handleChange("messagePlaceholder")(
            //       e.target.value
            //     );
            //   }}
          />
        </div>

        <hr className="horizonal-line" />

        <div className="collect-user-detail">
          <p className="title">Collect User Detail</p>
          <p className="sub-title">
            Choose whether or not you want to collect the user details.
          </p>

          <div className="radio-btns">
            <Radio.Group onChange={onChange} value={value}>
              <div className="radio-btn" id="do-not-collect">
                <Radio value={"do-not-collect"}>
                  <div className="radio-info">
                    <p className="info-title">Do Not Collect</p>
                    <p className="info-subtitle">
                      We will not collect any user details at any moment
                    </p>
                  </div>
                </Radio>
              </div>

              <div className="radio-btn" id="collect">
                <Radio value={"collect"}>
                  <div className="radio-info">
                    <p className="info-title">Optional</p>
                    <p className="info-subtitle">
                      User should be able to chat by skipping the form
                    </p>
                  </div>
                </Radio>
              </div>

              <div className="radio-btn">
                <Radio value={"mandatory"}>
                  <div className="radio-info" id="mandatory">
                    <p className="info-title">Mandatory</p>
                    <p className="info-subtitle">
                      User has to enter their details before they can continue
                      chatting
                    </p>
                  </div>
                </Radio>
              </div>
            </Radio.Group>
          </div>
        </div>

        <hr className="horizonal-line" />

        <div className="leads-field">
          <p className="title">Lead Fields</p>
          <p className="sub-title">
            Choose what information you want to collect from visitors.
          </p>

          <div className="collect-detail">
            <div className="detail-field">
              <p>Name</p>
              <Switch />
            </div>

            <div className="detail-field">
              <p>Email Address</p>
              <Switch />
            </div>

            <div className="detail-field">
              <p>Phone Number</p>
              <Switch />
            </div>
          </div>
        </div>

        <Button type="primary" className="save-btn" onClick={(e) => {}}>
          Save
        </Button>
      </div>
    </>
  );
}

export default Lead;
