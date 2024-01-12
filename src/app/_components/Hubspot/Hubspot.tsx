import { Button } from "antd";
import { signIn, useSession } from "next-auth/react";
import * as React from "react";
const Hubspot = () => {
  const { data: session } = useSession();

  return (
    <>
      <Button type="primary" onClick={() => signIn("hubspot")}>
        Connect with hubspot
      </Button>
    </>
  );
};

export default Hubspot;
