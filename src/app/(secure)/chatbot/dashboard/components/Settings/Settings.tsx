import React, { useContext } from "react";
import { CreateBotContext } from "../../../../../_helpers/client/Context/CreateBotContext";
import Icon from "../../../../../_components/Icon/Icon";

function Settings() {
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// check which setting tab is active
  const chabotSettings = botDetails?.chabotSettings;
  return (
    <div className="settings-container">
      {/*------------------------------------------top-section----------------------------------------------*/}
      <div className="top">
        {/*------------------------------------------header----------------------------------------------*/}
        <div className="sources-header">
          {/*------------------------------------------options-container----------------------------------------------*/}
          <ul className="options-container">
            <li
              className={`${chabotSettings === "document" ? "active" : ""}`}
              value={"document"}
              onClick={() =>
                botContext?.handleChange("chabotSettings")("document")
              }
            >
              {/* <Icon Icon={DocumentIcon} /> */}
              <h3>Document</h3>
            </li>
            <li
              className={`${chabotSettings === "text" ? "active" : ""}`}
              value={"text"}
              onClick={() => botContext?.handleChange("chabotSettings")("text")}
            >
              {/* <Icon Icon={TextIcon} /> */}
              <h3>Text</h3>
            </li>
            <li
              className={`${chabotSettings === "qa" ? "active" : ""}`}
              value={"qa"}
              onClick={() => botContext?.handleChange("chabotSettings")("qa")}
            >
              {/* <Icon Icon={QAIcon} /> */}
              <h3>Q&A</h3>
            </li>
            <li
              className={`${chabotSettings === "website" ? "active" : ""}`}
              value={"website"}
              onClick={() =>
                botContext?.handleChange("chabotSettings")("website")
              }
            >
              {/* <Icon Icon={WebsiteIcon} /> */}
              <h3>Website</h3>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Settings;
