"use server"; // marks file as server only in next js app router
// runs on server, never in the browser. -> access db, use secrets, use prisma. cant use usestate or eventlisteners or touch the DOM

import { prisma } from "@/lib/prisma";
// imports singleton PrismaClient

// async, accepts Date object, returns promise of available time slots
// even tho the client calls it, the logic executes on the server .
export async function getAvailableSlots(date: Date){
    const dayOfWeek = date.getDay(); // returns 0,1,2,3,4,5,6,7

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59,999);

    const slots = await prisma.availableSlot.findMany({
        where: {
            dayOfWeek,
            isActive: true
        },
        orderBy: { startTime: "asc"},
    })
    // get existing appointments for this date:
    const existingAppointments = await prisma.appointment.findMany({
        where: {
            dateTime: {
                gte: startOfDay,
                lte: endOfDay,
            },
            status: { notIn: ["CANCELLED"] },
        },
    });

    // Filter out already booked appointments
    const bookedAppointments = existingAppointments.map((apt) =>
    apt.dateTime.toTimeString().slice(0, 5));

    const availableSlots = slots.filter(
        (slot) => !bookedAppointments.includes(slot.startTime)
    );

    return availableSlots;
}