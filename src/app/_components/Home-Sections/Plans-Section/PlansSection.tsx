"use client";
import React, { useState } from "react";
import "./plans-section.scss";
import tickIcon from "../../../../../public/svgs/tick-circle.svg";
import Image from "next/image";

function PlansSection() {
  /// active plan state
  const [planNo, setPlanNo] = useState(3);

  const planData = [
    {
      id: 1,
      name: "Starter",
      price: 0,
      features: [
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
      ],
    },
    {
      id: 2,
      name: "Basic",
      price: 29,
      features: [
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
      ],
    },
    {
      id: 3,
      name: "Growth",
      price: 99,
      features: [
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
      ],
    },
    {
      id: 4,
      name: "Professional",
      price: 199,
      features: [
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
      ],
    },
    {
      id: 5,
      name: "Enterprise",
      price: 499,
      features: [
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
        "2 Users",
      ],
    },
  ];

  return (
    <div className="plans-section">
      {/* --------------------------top section------------------------------ */}
      <div className="top">
        <h1>Choose Plan that&rsquo;s Right For You</h1>
        <p>Choose plan that works best for you, feel free to contact us</p>
      </div>
      {/* --------------------------bottom section------------------------------ */}
      <div className="bottom">
        <div className="plans-container">
          {planData.map((data) => (
            <div
              key={data?.id}
              className={`plan ${planNo == data.id && "active"}`}
              onClick={() => setPlanNo(data?.id)}
            >
              <div>
                <h3 className="name">{data?.name}</h3>

                <div className="price-container">
                  <h1 className="price">{data?.price}</h1>
                </div>
              </div>

              <div className="details-container">
                <button>Get Started</button>
                {data.features.map((feature, index) => (
                  <div className="details" key={index}>
                    <Image src={tickIcon} alt="tick-icon" />
                    <p>{feature}</p>
                  </div>
                ))}
              </div>

              <a>View more</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlansSection;
