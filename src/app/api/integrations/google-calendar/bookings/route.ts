import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/db";
import {
  isSlotAvailable,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/app/_services/googleCalendarService";
import { emailService } from "@/app/_services/emailService";

// Booking duration in minutes (default 60 min per booking)
const BOOKING_DURATION_MINUTES = 60;

/** Generate a short, human-readable booking ID: BK-YEAR-RANDOMHEX */
function generateBookingId(): string {
  const year = new Date().getFullYear();
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `BK-${year}-${hex}`;
}

/** Add minutes to a local datetime string without any UTC conversion.
 * Pure string/number arithmetic so the result stays in local wall-clock time.
 * Input:  "2026-07-17T14:00:00"  → Output: "2026-07-17T15:00:00"
 * Input:  "2026-07-17T23:30:00"  → Output: "2026-07-18T00:30:00"  (rolls over midnight)
 * If the input has a Z or offset suffix, falls back to Date arithmetic (already UTC-safe).
 */
function addMinutes(isoLocal: string, minutes: number): string {
  // If the string has an explicit UTC marker or offset, use Date arithmetic normally
  if (isoLocal.endsWith('Z') || isoLocal.match(/[+-]\d{2}:\d{2}$/)) {
    return new Date(new Date(isoLocal).getTime() + minutes * 60 * 1000).toISOString();
  }

  // Pure local string arithmetic — no UTC conversion
  // Parse "YYYY-MM-DDTHH:MM:SS" manually
  const [datePart, timePart] = isoLocal.split('T');
  if (!datePart || !timePart) {
    // Malformed — fall back
    return new Date(new Date(isoLocal).getTime() + minutes * 60 * 1000)
      .toISOString().replace('Z', '');
  }

  const [yyyy, mm, dd] = datePart.split('-').map(Number);
  const [hh, min, ss] = timePart.split(':').map(Number);

  const totalMinutes = hh * 60 + min + minutes;
  const newHour = Math.floor(totalMinutes / 60) % 24;
  const newMin  = totalMinutes % 60;
  const extraDays = Math.floor(totalMinutes / (60 * 24));

  // Roll date forward if time overflows midnight
  const base = new Date(Date.UTC(yyyy, mm - 1, dd + extraDays));
  const newYear  = base.getUTCFullYear();
  const newMonth = String(base.getUTCMonth() + 1).padStart(2, '0');
  const newDay   = String(base.getUTCDate()).padStart(2, '0');
  const secStr   = String(ss ?? 0).padStart(2, '0');

  return `${newYear}-${newMonth}-${newDay}T${String(newHour).padStart(2,'0')}:${String(newMin).padStart(2,'0')}:${secStr}`;
}

/**
 * Ensure dateTime is a full ISO string with a time component.
 * The AI sometimes sends "2026-07-17" (date only) which Google Calendar
 * rejects with 400 Bad Request on the dateTime field.
 * We append T00:00:00 in that case so the call always succeeds.
 */
function normaliseDateTime(dt: string): string {
  if (!dt) return dt;
  // Matches YYYY-MM-DD with nothing after (no T)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dt.trim())) {
    return `${dt.trim()}T00:00:00`;
  }
  return dt.trim();
}

// ---------------------------------------------------------------------------
// POST  — create a new booking
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      chatbotId,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      dateTime,   // ISO 8601
      notes,
    } = body;

    // timezone: use what the agent passed, or fall back to chatbot-settings,
    // or finally fall back to UTC. Never require it from the user.
    let timezone: string = body.timezone ?? null;

    if (
      !chatbotId ||
      !userId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !serviceType ||
      !dateTime
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = (await clientPromise!).db();

    // Resolve timezone from chatbot-settings if not provided
    if (!timezone) {
      const settings = await db.collection("chatbot-settings").findOne({ chatbotId });
      timezone = settings?.bookingTimezone ?? "UTC";
    }

    // Normalise dateTime — AI sometimes sends date-only "2026-07-17"
    // which Google Calendar rejects. Ensure it always has a time component.
    const normalisedDateTime = normaliseDateTime(dateTime);
    console.log(`[booking] dateTime received: "${dateTime}" → normalised: "${normalisedDateTime}", timezone: "${timezone}"`);

    // Check for calendar conflicts
    const endIso = addMinutes(normalisedDateTime, BOOKING_DURATION_MINUTES);
    let calendarConnected = true;
    let googleEventId: string | null = null;

    try {
      const available = await isSlotAvailable(chatbotId, normalisedDateTime, endIso, timezone);
      if (!available) {
        return NextResponse.json(
          {
            success: false,
            conflict: true,
            error:
              "The requested time slot is not available. Please choose a different time.",
          },
          { status: 409 }
        );
      }

      // Create calendar event
      googleEventId = await createCalendarEvent(chatbotId, {
        summary: `${serviceType} — ${customerName}`,
        description: `Booking ID will be provided.\nPhone: ${customerPhone}\nNotes: ${notes ?? "None"}`,
        startIso: normalisedDateTime,
        endIso,
        timezone,
        attendeeEmail: customerEmail,
      });
      console.log(`[booking] Calendar event created: ${googleEventId}`);
    } catch (calErr: any) {
      // Log the full error so we can diagnose future issues
      const detail = calErr?.response?.data ?? calErr?.errors ?? calErr?.message;
      console.error("[booking] Google Calendar error:", JSON.stringify(detail));
      calendarConnected = false;
    }

    // Persist booking in MongoDB
    const bookingId = generateBookingId();
    const now = new Date();

    await db.collection("bookings").insertOne({
      bookingId,
      chatbotId,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      dateTime: normalisedDateTime,
      endDateTime: endIso,
      timezone,
      notes: notes ?? null,
      googleEventId,
      status: "confirmed",
      createdAt: now,
      updatedAt: now,
    });

    // Update calendar event description with the real booking ID
    if (googleEventId) {
      try {
        await updateCalendarEvent(chatbotId, googleEventId, {
          description: `Booking ID: ${bookingId}\nPhone: ${customerPhone}\nNotes: ${notes ?? "None"}`,
        });
      } catch {
        // Non-fatal
      }
    }

    // Send confirmation email
    try {
      const emailSvc = emailService();
      await emailSvc.send(
        "booking-confirmation",
        [],
        customerEmail,
        {
          bookingId,
          customerName,
          serviceType,
          dateTime,
          timezone,
          notes: notes ?? "None",
          calendarConnected,
        }
      );
    } catch (emailErr: any) {
      console.warn("Booking confirmation email failed:", emailErr.message);
    }

    return NextResponse.json({
      success: true,
      bookingId,
      serviceType,
      dateTime,
      timezone,
      calendarConnected,
    });
  } catch (err: any) {
    console.error("Create booking error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT  — update an existing booking
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      customerEmail,
      chatbotId,
      newDateTime,
      newTimezone,
      newServiceType,
      notes,
    } = body;

    if (!bookingId || !customerEmail || !chatbotId) {
      return NextResponse.json(
        { success: false, error: "bookingId, customerEmail, and chatbotId are required" },
        { status: 400 }
      );
    }

    const db = (await clientPromise!).db();
    const booking = await db
      .collection("bookings")
      .findOne({ bookingId, customerEmail, status: { $ne: "cancelled" } });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found or email does not match." },
        { status: 404 }
      );
    }

    // If rescheduling, check for conflicts
    if (newDateTime) {
      const tz = newTimezone ?? booking.timezone;
      const endIso = addMinutes(newDateTime, BOOKING_DURATION_MINUTES);
      try {
        const available = await isSlotAvailable(chatbotId, newDateTime, endIso, tz);
        if (!available) {
          return NextResponse.json(
            {
              success: false,
              conflict: true,
              error:
                "The new time slot is not available. Please choose a different time.",
            },
            { status: 409 }
          );
        }

        // Update the Google Calendar event
        if (booking.googleEventId) {
          await updateCalendarEvent(chatbotId, booking.googleEventId, {
            summary: newServiceType
              ? `${newServiceType} — ${booking.customerName}`
              : undefined,
            startIso: newDateTime,
            endIso,
            timezone: tz,
          });
        }
      } catch (calErr: any) {
        console.warn("Calendar update skipped:", calErr.message);
      }
    }

    // Build DB update
    const updateFields: any = { updatedAt: new Date() };
    if (newDateTime) {
      updateFields.dateTime = newDateTime;
      updateFields.endDateTime = addMinutes(newDateTime, BOOKING_DURATION_MINUTES);
    }
    if (newTimezone) updateFields.timezone = newTimezone;
    if (newServiceType) updateFields.serviceType = newServiceType;
    if (notes !== undefined) updateFields.notes = notes;
    updateFields.status = "rescheduled";

    await db
      .collection("bookings")
      .updateOne({ bookingId }, { $set: updateFields });

    return NextResponse.json({
      success: true,
      bookingId,
      updatedFields: updateFields,
    });
  } catch (err: any) {
    console.error("Update booking error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE  — cancel a booking
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, customerEmail, chatbotId, reason } = body;

    if (!bookingId || !customerEmail || !chatbotId) {
      return NextResponse.json(
        { success: false, error: "bookingId, customerEmail, and chatbotId are required" },
        { status: 400 }
      );
    }

    const db = (await clientPromise!).db();
    const booking = await db
      .collection("bookings")
      .findOne({ bookingId, customerEmail, status: { $ne: "cancelled" } });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found or email does not match." },
        { status: 404 }
      );
    }

    // Delete from Google Calendar
    if (booking.googleEventId) {
      try {
        await deleteCalendarEvent(chatbotId, booking.googleEventId);
      } catch (calErr: any) {
        console.warn("Calendar delete skipped:", calErr.message);
      }
    }

    await db.collection("bookings").updateOne(
      { bookingId },
      {
        $set: {
          status: "cancelled",
          cancellationReason: reason ?? null,
          cancelledAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true, bookingId });
  } catch (err: any) {
    console.error("Delete booking error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET  — list bookings for a chatbot (dashboard use)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const chatbotId = req.nextUrl.searchParams.get("chatbotId");
    const userId = req.nextUrl.searchParams.get("userId");
    const status = req.nextUrl.searchParams.get("status"); // optional filter

    if (!chatbotId || !userId) {
      return NextResponse.json(
        { success: false, error: "chatbotId and userId are required" },
        { status: 400 }
      );
    }

    const db = (await clientPromise!).db();
    const filter: any = { chatbotId, userId };
    if (status) filter.status = status;

    const bookings = await db
      .collection("bookings")
      .find(filter)
      .sort({ dateTime: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({ success: true, bookings });
  } catch (err: any) {
    console.error("List bookings error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
