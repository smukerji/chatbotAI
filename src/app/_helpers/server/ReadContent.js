import * as pdfParse from "pdf-parse";
import fs from "fs";
import * as mammoth from "mammoth";
import csvParser from "csv-parser";
import * as xlsx from "xlsx";
import xlsToJson from "xls-to-json";

export async function readContent(filePath, fileType) {
  // if (fileType === "application/pdf") {
  //   /// read the pdf file
  //   const bufferData = fs.readFileSync(filePath);
  //   const pdfExtract = await pdfParse(bufferData);
  //   return pdfExtract.text;
  // } else if (fileType == "text/plain") {
  //   /// read the txt file
  //   const bufferData = fs.readFileSync(filePath, { encoding: "utf-8" });
  //   return bufferData;
  // } else if (
  //   fileType ===
  //   "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  // ) {
  //   const result = await mammoth.extractRawText({
  //     path: filePath,
  //   });
  //   return result.value;
  // }

  console.log("File path >>>>>>>>>>", filePath);

  if (fileType === "application/pdf") {
    // Read the PDF file
    const bufferData = fs.readFileSync(filePath);

    const pdfExtract = await pdfParse(bufferData);
    return pdfExtract.text;
  } else if (fileType === "text/plain") {
    // Read the TXT file
    const bufferData = fs.readFileSync(filePath, { encoding: "utf-8" });
    return bufferData;
  } else if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    // Read the DOCX file
    const result = await mammoth.extractRawText({
      path: filePath,
    });
    return result.value;
  } else if (fileType === "text/csv") {
    // Read the CSV file
    const csvData = await new Promise((resolve, reject) => {
      const rows = [];
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row) => rows.push(row))
        .on("end", () => resolve(rows))
        .on("error", (error) => reject(error));
    });

    // Convert the CSV data to text
    const csvText = csvData
      .map((row) => Object.values(row).join(","))
      .join("\n");
    return csvText;
  } else if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    // Read the XLSX file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const xlsxData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Convert the XLSX data to text
    const xlsxText = xlsxData.map((row) => row.join(",")).join("\n");
    return xlsxText;
  }

  // Handle unsupported file types
  throw new Error(`Unsupported file type: ${fileType}`);
}
