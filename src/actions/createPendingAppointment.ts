'use server';

import { prisma } from '@/lib/prisma';
import { sendPaymentEmail } from '@/lib/email';

// Helper function (previously imported from deleted file)
function buildDateTimeFromSlot(selectedDate: Date, startTime: string): Date {
    const [hour, minute] = startTime.split(':').map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hour, minute, 0, 0);
    return dateTime;
}

export async function createPendingAppointment(input: {
    slotId: string;
    selectedDate: Date;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    patientRut: string;
}): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
    try {
        const slot = await prisma.availableSlot.findUnique({
            where: { id: input.slotId, isActive: true },
        });
        if (!slot) {
            return { success: false, error: 'Horario no disponible' };
        }

        const dateTime = buildDateTimeFromSlot(input.selectedDate, slot.startTime);

        const appointment = await prisma.appointment.create({
            data: {
                patientName: input.patientName,
                patientEmail: input.patientEmail,
                patientPhone: input.patientPhone,
                patientRut: input.patientRut,
                dateTime,
                duration: 45,
                status: 'PENDING',
                paymentStatus: 'PENDING',
            },
        });

        const amount = 90000; // or from config
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webpay/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId: appointment.id, amount }),
        });

        const data = await response.json();
        if (!response.ok) {
            await prisma.appointment.delete({ where: { id: appointment.id } });
            return { success: false, error: data.error || 'Error al iniciar pago' };
        }

        await sendPaymentEmail({
            to: input.patientEmail,
            name: input.patientName,
            appointmentDateTime: dateTime,
            paymentLink: data.url,
        });

        return { success: true, appointmentId: appointment.id };
    } catch (error: unknown) {
        // ✅ No 'any' – use unknown and narrow
        const errorMessage = error instanceof Error ? error.message : 'Error interno';
        console.error('Create pending appointment error:', error);
        return { success: false, error: errorMessage };
    }
}