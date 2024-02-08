import { del } from "@vercel/blob";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest } from "next/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { url } = JSON.parse(req.body);
  /// delete  the file to blob
  const deleteFile = await del(url);

  res.status(200).json({ message: "Image deleted successfully" });
}
