const formidable = require("formidable");
import { put } from "@vercel/blob";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  /// uploading the file to blob
  const blob = await put(req.query.filename as string, req, {
    access: "public",
  });

  res.status(200).json({ uploadUrl: blob.url });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
