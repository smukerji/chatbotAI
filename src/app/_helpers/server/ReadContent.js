import * as pdfParse from "pdf-parse";
import fs from "fs";
import * as mammoth from "mammoth";

export async function readContent(filePath, fileType) {
  if (fileType === "application/pdf") {
    /// read the pdf file
    const bufferData = fs.readFileSync(filePath);
    const pdfExtract = await pdfParse(bufferData);
    return pdfExtract.text;
  } else if (fileType == "text/plain") {
    /// read the txt file
    const bufferData = fs.readFileSync(filePath, { encoding: "utf-8" });
    return bufferData;
  } else if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({
      path: filePath,
    });
    return result.value;
  }
}
