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
      const pdfPath = files.file[0].filepath;

      // Move the file to a permanent location
      const destinationPath = path.join(process.cwd(), "file" + Date.now());
      // fs.renameSync(pdfPath, destinationPath);
      mv(pdfPath, destinationPath, function (err) {
        if (err) {
          console.log('> FileServer.jsx | route: "/files/upload" | err:', err);
          throw err;
        }
      });

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
