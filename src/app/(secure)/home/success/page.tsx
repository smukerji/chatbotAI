"use client";

import React, { useState, useEffect, useDebugValue } from "react";
import "../pricing/stripe.scss"

export default function Success() {
    return(
        <h1 className="success">Your payment is successfully completed</h1>
    )
}