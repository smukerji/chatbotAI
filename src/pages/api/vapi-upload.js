import path from "path";
import fs from "fs";
import { VapiClient } from "@vapi-ai/server-sdk";
import { generateAndGetToken } from "../../app/(secure)/voicebot/dashboard/services/vapi-services";

const formidable = require("formidable");

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            // Parse the form data
            const form = new formidable.IncomingForm();
            form.parse(req, async (err, fields, files) => {
                if (err) {
                    console.error(err);
                    res.status(500).send("Internal Server Error");
                    return;
                }

                // Get the uploaded file path and MIME type
                const filePath = files.file[0].filepath;
                const mimeType = files.file[0].mimetype; // Extract MIME type

                try {
                    const token = await generateAndGetToken();
                    console.log("Generated Token:", token); // Log the token for debugging
                    
                    const client = new VapiClient({ token: token });

                    // Create a readable stream from the file
                    const fileStream = fs.createReadStream(filePath);

                    // Pass the stream and MIME type to client.files.create
                    const response = await client.files.create(fileStream, { mimeType });
                    console.clear();
                    console.log("file upload vapi", JSON.stringify(response, null, 2));
                    res.status(200).json(response); // Send response back to client
                } catch (tokenError) {
                    console.error("Error generating token:", tokenError);
                    res.status(403).send("Forbidden: Invalid or missing token");
                } finally {
                    // Clean up the temporary file
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
                    });
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error reading file content");
        }
    } else {
        res.status(405).send("Method not allowed");
    }
}

export const config = {
    api: {
        bodyParser: false, // Ensure bodyParser is disabled
    },
};
