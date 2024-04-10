import { NextResponse } from 'next/server';
import clientPromise from '../../../../db';
import { emailService } from '../../../_services/emailService';
import jwt, { Secret } from 'jsonwebtoken';


function generateJWTToken(email: string) {
  return jwt.sign({ email }, process.env.NEXT_PUBLIC_JWT_SECRET as Secret, {
    expiresIn: process.env.NEXT_PUBLIC_JWT_EXPIRES_IN
  });
}

export async function POST(request: any) {
  const body = await request.json();
  const  {email}  = body;
  const db = (await clientPromise!).db();
  const collection = db.collection('users');
  /// validate if user email already exists
  const user = await collection.findOne({ email: email });
  const temailService = emailService();
  if(!user){
    return NextResponse.json({message : 'incorrect email'})
  }
  const jwtToken = generateJWTToken(email);
  const link = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/account/email-verified?jwt=${jwtToken}`;
  await temailService.send('verify-email-register-template', [], email, {
    link: link
  });

  return NextResponse.json({ message: 'please check your email' });
}


