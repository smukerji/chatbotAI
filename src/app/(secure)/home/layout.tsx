import React from "react";
import { CreateBotDataProvider } from "../../_helpers/client/Context/CreateBotContext";

function layout({ children }: { children: React.ReactNode }) {
  return <CreateBotDataProvider>{children}</CreateBotDataProvider>;
}

export default layout;
