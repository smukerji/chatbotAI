"use client";

import React, { useState, useEffect, useDebugValue } from "react";
import axios from "axios";
import "./billing.scss";
import Image from "next/image";
import { useCookies } from "react-cookie";
import { message } from "antd";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function BillingAndUsage() {
  const [cookies, setCookie] = useCookies(["userId"]);
  const { status } = useSession();

  if (status === "authenticated" || cookies?.userId) {
    return (
      <div className="billing-main">
        <div className="billing-head">Billing & Usage</div>
        <div className="message-count">
          <div className="message-head">
            <div className="message-head-text">Messages</div>
            <div className="message-head-count">
              <span className="message-head-count-used">17</span>
              <span className="message-head-count message-head-count-limit">
                /1k
              </span>
            </div>
          </div>
        </div>
        <div className="plan-head">My Plan</div>
        <div className="plan-details">
          <div className="name-features">
            <div className="plan-name">Mit</div>
            <div className="plan-feature">
              <div className="plan-message">1k messages</div>
              <div className="plan-chatbot">7 chatbots</div>
              <div className="next-renewal-date">
                <div className="next-renewal-date-text">Next renewal date</div>
                <div className="next-renewal-date-date">17/09/2001</div>
              </div>
            </div>
          </div>
        </div>
        <div className="btn-class">
          <button className="btn-upgrade">
            <span className="btn-text">Explore Plans</span>
          </button>
          <button className="btn-cancel-plan">
            <span className="btn-text-cancel-plan">Cancel My Plan</span>
          </button>
        </div>
        <div className="manage-plan">Payment history</div>
        <div className="manage-plan-text">
          Manage your payment methods or cancel your plan by clicking on the
          link below
        </div>
        <button className="btn-manage-billing">
          <span className="btn-text">Manage Billing</span>
        </button>
      </div>
    );
  } else if (status === "unauthenticated") {
    redirect("/account/login");
  }
}
