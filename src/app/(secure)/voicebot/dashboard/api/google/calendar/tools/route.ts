import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../../../../../../db";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

export async function PUT(req: NextRequest) {
    const cookieStore = cookies();
    const userIdStr = cookieStore.get("userId")?.value;
    const assistantId = req.nextUrl.searchParams.get("assistantId");
    const { toolName, publishValue } = await req.json();
    console.log("toolname ", toolName, " publish value ", publishValue);

    if (!userIdStr || !assistantId) return NextResponse.json({ connected: false, tools: [] });

    let userId: ObjectId;
    try { userId = new ObjectId(userIdStr); } catch { return NextResponse.json({ connected: false, tools: [] }); }

    //db initialize
    const db = (await clientPromise!).db();


    const deleteFoundRecord = await db.collection("google-calendar-oauth-consent").deleteOne({
        assistantId: assistantId,
        userId: new ObjectId(userId),
        $or: [{
            // Scenario 1: Only one tool exists, and it's published.
            "tools.1": { "$exists": false },
            "tools.publish": true,
            "tools.0.tool":toolName
        },
        {
            // Scenario 2: Exactly two tools exist.
            $and: [
                {
                    tools: {
                        $size: 2
                    }
                },
                {
                    tools: {
                        $elemMatch: {
                            tool: toolName,
                            publish: true
                        }
                    }
                },
                {
                    tools: {
                        // $not: {
                            $elemMatch: {
                                tool: {
                                    $ne: toolName
                                },
                                publish: false
                            }
                        // }
                    }
                }
            ]
        }
        ]
    });

    console.log("delete result on tool ",deleteFoundRecord);

    if(deleteFoundRecord.deletedCount == 1){
        return NextResponse.json({ message:"Google connection removed!" , result : deleteFoundRecord});
    }



    const data = await db.collection("google-calendar-oauth-consent").updateOne(
        {
            // --- Query to find the specific document ---
            userId,
            assistantId,
            // --- Query to find the element within the array ---
            "tools.tool": toolName
        },
        {
            // --- Update operation using the positional $ operator ---
            $set: {
                "tools.$.publish": publishValue // depending on your need
            }
        }
    );
    console.log("update on publish assistant ", data);

    return NextResponse.json({ result: data , message:"Tool added successfully"});
}




// import { NextRequest, NextResponse } from "next/server";
// import clientPromise from "../../../../../../../../db";
// import { cookies } from "next/headers";
// import { ObjectId } from "mongodb";

// export async function PUT(req: NextRequest) {
//     const cookieStore = cookies();
//     const userIdStr = cookieStore.get("userId")?.value;
//     const assistantId = req.nextUrl.searchParams.get("assistantId");
//     const { toolName, publishValue } = await req.json();
//     console.log("toolname ", toolName, " publish value ", publishValue);

//     if (!userIdStr || !assistantId) {
//         return NextResponse.json({ connected: false, tools: [] });
//     }

//     let userId: ObjectId;
//     try { 
//         userId = new ObjectId(userIdStr); 
//     } catch { 
//         return NextResponse.json({ connected: false, tools: [] }); 
//     }

//     const db = (await clientPromise!).db();

//     let data;
//     if (publishValue === null) {
//         // Remove ALL tool objects with this name
//         data = await db.collection("google-calendar-oauth-consent").updateOne(
//             { userId, assistantId },
//             { $pull: { tools: { tool: toolName } } }
//         );
//     } else {
//         // Set publish to true/false for ALL matches using arrayFilters
//         data = await db.collection("google-calendar-oauth-consent").updateOne(
//             { userId, assistantId },
//             { $set: { "tools.$[elem].publish": publishValue } },
//             { arrayFilters: [{ "elem.tool": toolName }] }
//         );
//     }

//     console.log("update on publish assistant ", data);

//     // Return updated tools array (optional, for frontend state)
//     const updatedDoc = await db.collection("google-calendar-oauth-consent").findOne({ userId, assistantId });
//     // Treat success as either a modification or a match (ensures UI updates even if already correct)
//     const success = data?.modifiedCount > 0 || data?.matchedCount > 0;
//     return NextResponse.json({ success, record: data, tools: updatedDoc?.tools || [] });
// }