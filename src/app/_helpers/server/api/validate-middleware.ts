import { NextRequest } from "next/server";
import joi, { valid } from "joi";

export { validateMiddleware };

async function validateMiddleware(req: NextRequest, schema: joi.ObjectSchema) {
  if (!schema) return;

  const options = {
    abortEarly: false, // include all errors
    allowUnknown: true, // ignore unknown props
    stripUnknown: true, // remove unknown props
  };

  /// check which method is it and make sure that it has only those payload which has been mentioned in schema
  const method = req.method;
  let body;
  if (method == "GET") {
    body = Object.fromEntries(req.nextUrl.searchParams);
  } else if (method == "POST") {
    body = await req.json();
  } else {
    body = await req.json();
  }

  const { error, value } = schema.validate(body, options);

  if (error) {
    throw `Validation error: ${error.details.map((x) => x.message).join(", ")}`;
  }

  // update req.json() to return sanitized req body
  req.json = () => value;
}
