import { createSwaggerSpec } from "next-swagger-doc";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
export const getApiDocs = async () => {
  // Load YAML files for Backend API Documentation
  const yamlFilePath = path.join(process.cwd(), "apiDocs");

  const accountDocument: any = yaml.load(
    fs.readFileSync(`${yamlFilePath}/account.yaml`, "utf8")
  );
  const authDocument: any = yaml.load(
    fs.readFileSync(`${yamlFilePath}/auth.yaml`, "utf8")
  );
  const contactMailDocument: any = yaml.load(
    fs.readFileSync(`${yamlFilePath}/contact-mail.yaml`, "utf8")
  );
  const userDocument: any = yaml.load(
    fs.readFileSync(`${yamlFilePath}/user.yaml`, "utf8")
  );
  const webhookDocument: any = yaml.load(
    fs.readFileSync(`${yamlFilePath}/webhook.yaml`, "utf8")
  );
  const chatbotDocument: any = yaml.load(
    fs.readFileSync(`${yamlFilePath}/chatbot.yaml`, "utf8")
  );
  const homeDocument: any = yaml.load(
    fs.readFileSync(`${yamlFilePath}/home.yaml`, "utf8")
  );
  const stripeDocument: any = yaml.load(
    fs.readFileSync(`${yamlFilePath}/stripe-payment.yaml`, "utf8")
  );
  const whatsappDocument: any = yaml.load(
    fs.readFileSync(`${yamlFilePath}/whatsapp-chat.yaml`, "utf8")
  );
  const dashboardDocument: any = yaml.load(
    fs.readFileSync(`${yamlFilePath}/dashboard.yaml`, "utf8")
  );
  const mainDocument: any = yaml.load(
    fs.readFileSync(`${yamlFilePath}/main.yaml`, "utf8")
  );
  const voiceDocument: any = yaml.load(
    fs.readFileSync(`${yamlFilePath}/voicebot-assistant.yaml`, "utf8")
  );
  // Create Swagger Specification
  const spec = createSwaggerSpec({
    apiFolder: "src/app/server/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Torri.AI Backend Documentation",
        description: "API Documentation for Torri.AI",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000/",
          description: "Local server",
        },
        {
          url: "https://chatbot-ai-silk.vercel.app/",
          description: "Live server",
        },
      ],
      // Add the paths from the YAML files
      paths: {
        ...voiceDocument.paths,
        ...accountDocument.paths,
        ...authDocument.paths,
        ...contactMailDocument.paths,
        ...userDocument.paths,
        ...webhookDocument.paths,
        ...chatbotDocument.paths,
        ...homeDocument.paths,
        ...stripeDocument.paths,
        ...whatsappDocument.paths,
        ...dashboardDocument.paths,
        ...mainDocument.paths,
      },

      // Add the tags from the YAML files
      tags: [
        {
          name: "Voice Assistant",
          description: "Operations related to voice assistant interactions",
        },

        {
          name: "Account",
          description: "Operations related to user login and registration",
        },
        {
          name: "Auth",
          description: "Operations related to handling user authentication",
        },
        {
          name: "Contact Mail",
          description:
            "Operations related to handling contact mail submissions",
        },
        {
          name: "User",
          description: "Operations related to user data and profiles",
        },
        {
          name: "Webhook",
          description: "Operations related to webhook handling and processing",
        },
        {
          name: "Chatbot",
          description: "Operations related to chatbot interactions",
        },
        {
          name: "BillingAndUsage",
          description: "Operations related to billing and usage tracking",
        },
        {
          name: "FetchLinks",
          description: "Operations related to fetching links or data",
        },
        {
          name: "Payment",
          description: "Operations related to payment processing",
        },
        {
          name: "WhatsApp Integration",
          description: "Operations related to WhatsApp chat integration",
        },
        {
          name: "Dashboard",
          description: "Operations related to Dashboard",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
  });
  return spec;
};
