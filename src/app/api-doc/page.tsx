import React from "react";
import { getApiDocs } from "../../../lib/swagger";
import ReactSwagger from "./react-swagger";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function page() {
  const spec = await getApiDocs();
  return (
    <section className="container">
      <ReactSwagger spec={spec} />
    </section>
  );
}
