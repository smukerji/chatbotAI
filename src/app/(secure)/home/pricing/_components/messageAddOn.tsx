import React, { useState, useEffect, useDebugValue } from "react";
import axios from "axios";
import "../../pricing/stripe.scss";
import Image from "next/image";

export default function MessageAddOn() {
  return (
    <>
      <div className="upper-body">
        <div className="description-container">
          <span className="description-name">Extra message credits</span>
          <span className="description-text">
            $7 per 1000 message credits/month
          </span>
          <div className="description-field">
            <span className="field-text">Limit to only</span>
            <span className="field-num"></span>
            <span className="field-text">Message every</span>
            <span className="field-num"></span>
            <span className="field-text">Seconds.</span>
          </div>
        </div>
        <div className="amount-container">
          <span className="amount-text">Your total: $7/month</span>
        </div>
      </div>
    </>
  );
}
