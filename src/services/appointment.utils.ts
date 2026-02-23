// src/services/appointment.utils.ts
import { AvailableSlot } from "@prisma/client";

export function buildDateTimeFromSlot(selectedDate: Date, startTime: string): Date {
    const [hour, minute] = startTime.split(":").map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hour, minute, 0, 0);
    return dateTime;
}


