import { google } from "googleapis";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({
    version: "v3",
    auth,
});

type CreateEventInput = {
    patientName: string;
    dateTime: Date;
    durationMinutes?: number;
};

export async function createCalendarEvent(input: CreateEventInput) {
    const { patientName, dateTime, durationMinutes = 45 } = input;

    const endTime = new Date(dateTime.getTime() + durationMinutes * 60 * 1000);

    const event = {
        summary: "Consulta Psiquiátrica",
        description: `Cita con ${patientName}`,
        start: {
            dateTime: dateTime.toISOString(),
            timeZone: "America/Santiago",
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: "America/Santiago",
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID!,
            requestBody: event,
        });

        return {
            success: true,
            eventId: response.data.id,
            eventLink: response.data.htmlLink,
        };
    } catch (error) {
        console.error("Google Calendar Error:", error);
        return {
            success: false,
            error: "Failed to create calendar event",
        };
    }
}

export async function deleteCalendarEvent(eventId: string) {
    try {
        await calendar.events.delete({
            calendarId: CALENDAR_ID!,
            eventId,
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to delete event:", error);
        return { success: false };
    }
}
