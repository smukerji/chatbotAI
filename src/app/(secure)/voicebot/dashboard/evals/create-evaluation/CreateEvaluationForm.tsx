import React from "react";
import "./CreateEvaluationForm.scss";

export default function CreateEvaluationForm() {
  return (
    <div className="eval-main-layout">
      <div className="eval-form-card">
        <h2 className="eval-title">Create Evaluation</h2>
        <form>
          <div className="form-group">
            <label>Eval name</label>
            <input placeholder="Enter evaluation name" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input placeholder="Describe what this evaluation will test" />
          </div>

          <div className="section-title">Evaluator</div>
          <div className="row">
            <div className="form-group half">
              <label>Provider</label>
              <select>
                <option>Select tool</option>
                {/* Add your options here */}
              </select>
            </div>
            <div className="form-group half">
              <label>Model</label>
              <select>
                <option>Select tool</option>
                {/* Add your options here */}
              </select>
            </div>
          </div>

          <div className="section-title">Conversation Turns</div>
          <div className="row">
            <div className="form-group">
              <label>Turns</label>
              <div className="toggle-group">
                <button type="button" className="toggle active">Assistant</button>
                <button type="button" className="toggle">Squad</button>
              </div>
            </div>
            <div className="form-group half">
              <label>Select assistant</label>
              <select>
                <option>Select assistant</option>
                {/* Add assistant options here */}
              </select>
            </div>
          </div>

          <div className="button-row">
            <button type="button">+ Add User</button>
            <button type="button">+ Add Assistant</button>
            <button type="button">+ Add Tool Response</button>
          </div>
        </form>
      </div>
      <div className="eval-sidebar">
        <div className="sidebar-card">
          <h3>Test runs</h3>
          <div className="sidebar-row">
            <span>Assistant Variables</span>
            <button type="button" className="add-var-btn">+</button>
          </div>
          <div className="sidebar-row">
            <span>Result</span>
          </div>
          <button type="button" className="test-btn">Test</button>
        </div>
      </div>
    </div>
  );
}
