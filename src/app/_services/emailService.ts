import * as postmark from "postmark";
const client: postmark.ServerClient = new postmark.ServerClient(
  process.env.POST_MARK_TOKEN!
);

/// email service to send email to users based on the actions of users
export { emailService };
function emailService(): IEmailService {
  return {
    send: async (
      templateName: string,
      attachments: Array<any>,
      sendTo: string,
      templateModel: {},
    ) => {
      try {


        await client.sendEmailWithTemplate({
          From: process.env.SENDERS_EMAIL!,
          To: sendTo,
          TemplateAlias: templateName,
          Attachments: attachments,
          MessageStream: "outbound",
          TemplateModel: templateModel,
        });

        
      } catch (error) {
        console.log("Error sending Email", error);
      }
    },
  };
}

interface IEmailService {
  send: (
    templateName: string,
    attachments: Array<any>,
    sendTo: string,
    templateModel: {}
  ) => Promise<void>;
}
