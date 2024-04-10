import { NextResponse } from 'next/server';
import clientPromise from '../../../../db';
import { apiHandler } from '../../../_helpers/server/api/api-handler';
import joi from 'joi';
import bcrypt from 'bcrypt';



export async function POST(request: any) {
  console.log("I")
  const body = await request.json();
  console.log(body)
  const  email  = body;
  console.log(email)
  const db = (await clientPromise!).db();
  const collection = db.collection('users');
  console.log("am")
  const user = await collection.findOne({ email: email });
  if (user && user.isVerified == true) {
    throw 'Email "' + email + '" is already in use';
  }
  console.log(user.isVerified, email)
  const userResult = await collection.updateOne({ email: email }, { $set: { isVerified: true } });

  return NextResponse.json({ message: 'Your is email is verified'});
}
