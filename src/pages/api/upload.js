import path from "path";
import { readContent } from "../../app/_helpers/server/ReadContent";
import fs from "fs";
import mv from "mv";

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
      const uploadedFilePath = files.file[0].filepath;

      // Move the file to a permanent location
      const destinationPath = path.join(
        __dirname,
        "../../",
        "file" + Date.now()
      );

      mv(uploadedFilePath, destinationPath, function (err) {
        if (err) {
          console.log("Error while moving file", err);
          throw err;
        }
      });

      // fs.renameSync(uploadedFilePath, destinationPath);

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
  } else {
    res.status(405).send("Method not allowed");
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
