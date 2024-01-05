import React, { Component } from "react";

import GridIcon from "../../../assets/svg/GridIcon";

function Icon({ Icon, className, click }: any) {
  return <div onClick={click} className={`icon ${className}`}>{<Icon />}</div>;
}

export default Icon;
