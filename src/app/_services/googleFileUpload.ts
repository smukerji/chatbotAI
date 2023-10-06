import { createReadStream } from "fs";
import { google } from "googleapis";
import path from "path";
const client_email = process.env.GOOGLE_DRIVE_SERVICE_EMAIL;
const private_key = process.env.GOOGLE_DRIVE_PRIVATE_KEY!.replace(/\\n/g, "\n");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

/**
 * Authorize with service account and get jwt client
 *
 */
async function authorize() {
  const jwtClient = new google.auth.JWT(
    client_email,
    null!,
    private_key,
    SCOPES
  );

  await jwtClient.authorize();
  return jwtClient;
}

/**
 * Create a new file on google drive.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function uploadFile(authClient: any, filepath: string, filename: string) {
  const drive = google.drive({ version: "v3", auth: authClient });

  const file = await drive.files.create({
    media: {
      body: createReadStream(filepath),
    },
    fields: "id",
    requestBody: {
      name: path.basename(filename),
      parents: [process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID!],
    },
  });

  return file;
}

module.exports = { authorize, uploadFile };
