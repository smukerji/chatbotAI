import  jwt  from 'jsonwebtoken';
// var jwt = require('jsonwebtoken');
export const generateAndGetToken = async ()=>{
    // Define the payload
    const payload = {
        orgId: process.env.VAPI_ORG_ID,
        // orgId: "6fda1e47-bd38-4ad9-83b0-7ef67caaca5f",
        token: {
            // This is the scope of the token
            tag: "private",
          },

    };
    // Get the private key from environment variables
    const key:string = process.env.VAPI_PRIVATE_KEY as string;
    // const key:string = "36d15d26-9036-4dcc-b646-0f7564106615"


    // Define token options
    const options = {
        expiresIn: '1h',
    };
    // Generate the token using a JWT library or built-in functionality
    const token = jwt.sign(payload, key , options);
    console.log("token * ",token);

      return token;
}

generateAndGetToken();