import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import { generateAndGetToken } from "../../../../dashboard/services/vapi-services";
import { VapiClient } from "@vapi-ai/server-sdk";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";
import moment from 'moment';


module.exports = apiHandler({
    GET: callUsage//dashboard/api/costs-wallates/usages
});

async function callUsage(req: NextRequest) {
    try {


        const userId = req.nextUrl.searchParams.get("userId") as string;
        let todayDate = req.nextUrl.searchParams.get("todayDate") as string;
        let monthDate = req.nextUrl.searchParams.get("monthDate") as string;

        if (!todayDate || !moment(todayDate, 'YYYY-MM-DD', true).isValid()) {
            todayDate = moment().format('YYYY-MM-DD');
        }
        if (!monthDate || !moment(monthDate, 'YYYY-MM', true).isValid()) {
            monthDate = moment().format('YYYY-MM');
        }


        // prepare the db connections
        const db = (await clientPromise!).db();

        //updated the call logs in the db
        const voicCallCostLogsTable = db?.collection("voice-call-costs-logs");


        // Calculate total cost for today
        const dayCost = await voicCallCostLogsTable.aggregate([
            {
                $addFields: {
                    createdAt: { $toDate: "$createdAt" }
                }
            },
            {
                $match: {
                    userId: userId,
                    createdAt: {
                        $gte: new Date(`${todayDate}T00:00:00.000Z`),
                        $lt: new Date(`${todayDate}T23:59:59.999Z`)
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCost: { $sum: "$torriMarginCost" }
                }
            }
        ]).toArray();

        // Calculate total cost for the current month
              const monthCost = await voicCallCostLogsTable.aggregate([
                    {
                        $addFields: {
                            createdAt: { $toDate: "$createdAt" }
                        }
                    },
                    {
                        $match: {
                            userId: userId,
                            createdAt: {
                                $gte: new Date(`${monthDate}-01T00:00:00.000Z`),
                                $lt: new Date(moment(`${monthDate}-01`).endOf('month').format('YYYY-MM-DD') + 'T23:59:59.999Z')
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalCost: { $sum: "$torriMarginCost" }
                        }
                    }
                ]).toArray();

        return {
            data: {
                todayDate,
                monthDate,
                todayCost: dayCost,
                monthCost: monthCost
            }
        }

    }
    catch (error: any) {
        console.error('Error parsing request body:', error);
        return { message: error };
    }

}

