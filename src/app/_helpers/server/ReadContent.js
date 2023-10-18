import * as pdfParse from "pdf-parse";
import fs from "fs";

export async function readContent(pdfPath, fileType) {
  if (fileType === "application/pdf") {
    /// read the pdf file
    const bufferData = fs.readFileSync(pdfPath);
    const pdfExtract = await pdfParse(bufferData);
    return pdfExtract.text;
  } else if (fileType == "text/plain") {
    /// read the txt file
    const bufferData = fs.readFileSync(pdfPath, { encoding: "utf-8" });
    return bufferData;
  }
}
