import  jwt  from 'jsonwebtoken';
// var jwt = require('jsonwebtoken');
export const generateAndGetToken = async ()=>{
    // Define the payload
    const payload = {
        orgId: process.env.VAPI_ORG_ID,
    };
    // Get the private key from environment variables
    const key:string = process.env.VAPI_PRIVATE_KEY as string;
    // Define token options
    const options = {
        expiresIn: '1h',
    };
    // Generate the token using a JWT library or built-in functionality
    const token = jwt.sign(payload, key , options);

      return token;
}