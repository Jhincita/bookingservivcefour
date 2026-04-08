import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function PaymentSuccessPage({
                                                     searchParams,
                                                 }: {
    searchParams: { appointmentId?: string };
}) {
    const appointmentId = searchParams.appointmentId;
    let appointment = null;

    if (appointmentId) {
        appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: {
                id: true,
                patientName: true,
                dateTime: true,
                duration: true,
            },
        });
    }

    const formattedDate = appointment?.dateTime
        ? new Date(appointment.dateTime).toLocaleDateString("es-CL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : null;
    const formattedTime = appointment?.dateTime
        ? new Date(appointment.dateTime).toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
        })
        : null;

    return (
        <main>
            <div className="card animate-in text-center">
                <div className="text-green-600 text-5xl mb-4">✓</div>
                <h1>¡Pago exitoso!</h1>
                <p className="mb-4">
                    Tu cita ha sido confirmada. Te hemos enviado un correo con los detalles.
                </p>

                {appointment && (
                    <div className="bg-gray-50 p-4 rounded-lg my-4">
                        <p className="font-semibold">Detalles de la cita:</p>
                        <p className="text-lg font-bold">
                            {formattedDate} a las {formattedTime}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Duración: {appointment.duration} minutos
                        </p>
                        <p className="text-xs text-gray-400 mt-4">
                            ID de referencia: {appointment.id}
                        </p>
                    </div>
                )}

                <div className="flex gap-4 justify-center">
                    <Link href="/public" className="btn-primary">
                        Volver al inicio
                    </Link>
                    <Link href="/agendar" className="btn-secondary">
                        Agendar otra hora
                    </Link>
                </div>
            </div>
        </main>
    );
}