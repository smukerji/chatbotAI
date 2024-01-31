import path from "path";
import { readContent } from "../../app/_helpers/server/ReadContent";
import fs from "fs";
import mv from "mv";
import os from "os";

const formidable = require("formidable");

export default async function handler(req, res) {
  if (req.method === "POST") {
    /// parse the form data
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
        return;
      }
      /// get the tmp path of file
      const pdfPath = files.file[0].filepath;

      // Move the file to a permanent location
      const destinationPath = path.join("/tmp/", "file" + Date.now());
      // fs.renameSync(pdfPath, destinationPath);

      mv(pdfPath, destinationPath, async function (err) {
        if (err) {
          console.log("Error while moving file", err);
          throw err;
        }
        try {
          const pdfText = await readContent(
            destinationPath,
            files.file[0].mimetype
          );
          res.status(200).send({
            charLength: pdfText.length,
            filepath: destinationPath,
            fileType: files.file[0].mimetype,
          });
        } catch (error) {
          console.error(error);
          res.status(500).send("Error reading file content");
        }
      });

      const tempDir = os.tmpdir();

      // Create a path within the temporary directory (e.g., '/tmp/myfolder')
      const tempFolderPath = path.join(tempDir, "/");

      // Function to list all files in a folder
      const listFilesInFolder = (folderPath) => {
        // Use fs.readdir to read the contents of the folder
        fs.readdir(folderPath, (err, files) => {
          // Handle errors
          if (err) {
            console.error("Error reading folder:", err);
            return;
          }

          // Log the list of files
          console.log("Files in folder:", files);

          // You can perform additional operations with the file list here
        });
      };
      listFilesInFolder(tempFolderPath);
    });
  } else {
    res.status(405).send("Method not allowed");
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
