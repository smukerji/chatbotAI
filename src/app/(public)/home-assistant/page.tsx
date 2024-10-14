import React from "react";
import HomeAssistant from "@/app/(public)/home-assistant/_components/HomeAssistant/HomeAssistant";
import HeaderAssistant from "@/app/_components/HeaderAssistant/HeaderAssistant";
import "./homepage.scss";

const page = () => {
  return (
    <>
      <div className="parent-container">
        <HomeAssistant />
      </div>
    </>
  );
};

export default page;
