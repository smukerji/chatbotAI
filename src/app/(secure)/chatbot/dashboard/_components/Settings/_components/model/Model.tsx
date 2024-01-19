import React from "react";
import "./../model/model.scss";
import { Select, Slider } from "antd";
import DocumentIcon from "@/assets/svg/DocumentIcon";

function Model() {
  return (
    <div className="model-settings-parent">
      {/* --------------------------------Training Section---------------------------------------------------------- */}
      <div className="training-parent">
        <p className="training-heading">Training</p>
        <p className="training-description">
          Note: Applies when embedded on a website
        </p>
      </div>

      {/* --------------------------------Model Section---------------------------------------------------------- */}

      <div className="model-parent">
        <p className="model-heading">Model</p>
        <div className="model-child-container">
          <div className="model-child-left">
            <p className="instruction-heading">Instructions</p>
            <div className="instruction-description">
              <p className="instruction-description-text">
                I want you to act as a support agent. Your name is "AI
                Assistant". You will provide me with answers from the given
                info. If the answer is not included, say exactly "Hmm, I am not
                sure." and stop after that. Refuse to answer any question not
                about the info. Never break character.
              </p>
            </div>
            <div className="instruction-sub-decscription">
              The instructions allows you to customize your chatbot's
              personality and style. Please make sure to experiment with the
              instructions by making it very specific to your data and use case.
            </div>
            <div className="model-sub-heading">Model</div>
            {/*--------------------- using html dropdown--------------------------- */}
            {/* <div className="dropdown-container">
              <select name="cars" className="dropdown-text">
                <option value="volvo">Volvo</option>
                <option value="saab">Saab</option>
                <option value="opel">Opel</option>
                <option value="audi">Audi</option>
              </select>


              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                >
                <g id="vuesax/outline/arrow-down">
                  <g id="arrow-down">
                    <path
                      id="Vector"
                      d="M11.9995 16.8006C11.2995 16.8006 10.5995 16.5306 10.0695 16.0006L3.54953 9.48062C3.25953 9.19062 3.25953 8.71062 3.54953 8.42063C3.83953 8.13063 4.31953 8.13063 4.60953 8.42063L11.1295 14.9406C11.6095 15.4206 12.3895 15.4206 12.8695 14.9406L19.3895 8.42063C19.6795 8.13063 20.1595 8.13063 20.4495 8.42063C20.7395 8.71062 20.7395 9.19062 20.4495 9.48062L13.9295 16.0006C13.3995 16.5306 12.6995 16.8006 11.9995 16.8006Z"
                      fill="#141416"
                      />
                  </g>
                </g>
              </svg>
            </div> */}
            {/* ----------------------using antd---------------------- */}

            <Select
              className="antd-select"
              defaultValue="gpt-3.5-turbo"
              options={[
                { value: "gpt-3.5-turbo", label: "gpt-3.5-turbo" },
                { value: "gpt-3.5-turbo-instruct", label: "gpt-3.5-turbo-instruct" },
                { value: "Gpt 4", label: "Gpt 4" },
                
              ]}
              suffixIcon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g id="vuesax/outline/arrow-down">
              <g id="arrow-down">
              <path id="Vector" d="M11.9995 16.8006C11.2995 16.8006 10.5995 16.5306 10.0695 16.0006L3.54953 9.48062C3.25953 9.19062 3.25953 8.71062 3.54953 8.42063C3.83953 8.13063 4.31953 8.13063 4.60953 8.42063L11.1295 14.9406C11.6095 15.4206 12.3895 15.4206 12.8695 14.9406L19.3895 8.42063C19.6795 8.13063 20.1595 8.13063 20.4495 8.42063C20.7395 8.71062 20.7395 9.19062 20.4495 9.48062L13.9295 16.0006C13.3995 16.5306 12.6995 16.8006 11.9995 16.8006Z" fill="#141416"/>
              </g>
              </g>
              </svg>
              }

              />
            

            <p className="model-sub-description">
              gpt-4 is much better at following the instructions and not
              hallucinating, but it's slower and more expensive than
              gpt-3.5-turbo (1 message using gpt-3.5-turbo costs 1 message
              credit. 1 message using gpt-4 costs 20 message credits)
            </p>
          </div>
          <div className="temperature-container">
            <div className="temperature-top-section">
              <p className="temperature-title">Temperature</p>
              <span>0.5</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-top-section">
                <Slider
                  min={0}
                  max={1}
                  // onChange={onChange}
                  // value={typeof inputValue === "number" ? inputValue : 0}
                  step={0.1}
                />
              </div>
              <div className="progress-bar-bottom-section">
                <p className="reserved">Reserved</p>
                <p className="creative">Creative</p>
              </div>
            </div>
          </div>
        </div>
        <button className="save-btn">
          <p className="btn-text">Save</p>
        </button>
      </div>
    </div>
  );
}

export default Model;
