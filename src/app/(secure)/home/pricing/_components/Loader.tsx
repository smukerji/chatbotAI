import React from "react";
import { Spin } from "antd";
import "../../pricing/stripe.scss";

function Loader() {
  return (
    <div className="example">
      <Spin />
    </div>
  );
}

export default Loader;
