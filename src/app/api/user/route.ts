import { NextRequest, NextResponse } from 'next/server';
import { connectDatabase } from '@/db';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  const params: any = req.nextUrl.searchParams;

  try {
    const db = (await connectDatabase())?.db();
    const userCollection = db.collection('users');
    const user = await userCollection.findOne({
      _id: new ObjectId(params.get('userId')),
    });

    return NextResponse.json({
      status: true,
      user: user,
    });
  } catch (error) {
    return NextResponse.json({
      status: false,
    });
  }
}
