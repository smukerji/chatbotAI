import { apiHandler } from '@/app/_helpers/server/api/api-handler';
import clientPromise from '@/db';
import joi from 'joi';
import { NextRequest, NextResponse } from 'next/server';

async function submitLeadDetail(request: NextRequest) {
  // Extract necessary data from request body
  const { chatbotId, userId, leadDetails }: any = await request.json();

  console.log(chatbotId, userId, leadDetails, 'kkkkkkk');

  try {
    const db = (await clientPromise!).db();
    const leadsCollection = db.collection('leads');

    // Insert lead details into the leads collection
    await leadsCollection.insertOne({
      chatbotId,
      userId,
      leadDetails,
      timestamp: new Date(),
    });

    return { message: 'Lead details saved successfully.' };
  } catch (error) {
    console.error('Error saving lead details:', error);
    throw new Error('An error occurred while saving lead details.');
  }
}

submitLeadDetail.schema = joi.object({
  chatbotId: joi.string().required(),
  userId: joi.string().optional(), // userId is optional since you handle it in the function
  leadDetails: joi.object().required(), // Adjust the schema according to your leadDetails structure
});

module.exports = apiHandler({
  POST: submitLeadDetail,
});
