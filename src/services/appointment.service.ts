import { prisma } from "@/lib/prisma";
import { Appointment } from "@/generated/prisma/client";
import { buildDateTimeFromSlot } from "./appointment.utils";
import { sendConfirmationEmail } from "@/lib/email";
import { createCalendarEvent } from "./google-calendar.service";

type CreateAppointmentInput = {
    slotId: string;
    selectedDate: Date;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    patientRut: string;
};

export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const slot = await prisma.availableSlot.findUnique({
        where: { id: input.slotId }
    });

    if (!slot || !slot.isActive) {
        throw new Error("No disponible");
    }

    const appointmentDate = buildDateTimeFromSlot(input.selectedDate, slot.startTime);

    // Create Google Calendar event BEFORE saving to database
    // This way if calendar fails, we don't have an orphan appointment
    const calendarResult = await createCalendarEvent({
        patientName: input.patientName,
        dateTime: appointmentDate,
        durationMinutes: 45, // Your appointment duration
    });

    // If calendar event creation fails, stop here
    if (!calendarResult.success) {
        throw new Error("Error al crear evento en calendario");
    }

    const appointment = await prisma.appointment.create({
        data: {
            patientName: input.patientName,
            patientEmail: input.patientEmail,
            patientPhone: input.patientPhone,
            patientRut: input.patientRut,
            dateTime: appointmentDate,
            googleEventId: calendarResult.eventId, // Store Google event ID for future updates/cancellations
        }
    });


    // Send confirmation email
    try {
        await sendConfirmationEmail({
            to: input.patientEmail,
            patientName: input.patientName,
            dateTime: appointmentDate,
            confirmToken: appointment.confirmToken,
            cancelToken: appointment.cancelToken,
        });
        console.log("✓ Email sent to:", input.patientEmail);
    } catch (error) {
        console.error("✗ Email failed:", error);
    }


    return appointment;
}