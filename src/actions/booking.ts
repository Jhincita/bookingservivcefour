"use server";

import { createAppointment } from "@/services/appointment.service";

export async function bookAppointment(formData: {
    selectedDate: Date;
    startTime: string;
    slotId: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    patientRut: string;
}) {
    try {
        const appointment = await createAppointment({
            slotId: formData.slotId,
            selectedDate: formData.selectedDate,
            patientName: formData.patientName,
            patientEmail: formData.patientEmail,
            patientPhone: formData.patientPhone,
            patientRut: formData.patientRut,
        });
        return { success: true, appointment };
    } catch (error) {
        return { success: false, error: "No se pudo agendar la cita" };
    }
}