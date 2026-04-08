'use server';

import { prisma } from '@/lib/prisma';
import { buildDateTimeFromSlot } from '@/services/appointment.utils';
import { sendPaymentEmail } from '@/lib/email'; // or from '@/lib/email/sendPaymentEmail'

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
    } catch (error: any) {
        console.error('Create pending appointment error:', error);
        return { success: false, error: error.message || 'Error interno' };
    }
}