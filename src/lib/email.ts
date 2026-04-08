import { Resend } from "resend";
import crypto from "crypto";

export const resend = new Resend(process.env.RESEND_API_KEY); // ✅ exported

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

type SendConfirmationEmailParams = {
    to: string;
    patientName: string;
    dateTime: Date;
    confirmToken: string;
    cancelToken: string;
};

type SendPaymentEmailParams = {
    to: string;
    name: string;
    appointmentDateTime: Date;
    paymentLink: string;
};

// helper to build ICS
function buildICS({
                      patientName,
                      dateTime,
                      durationMinutes = 45,
                  }: {
    patientName: string;
    dateTime: Date;
    durationMinutes?: number;
}) {
    const start = dateTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const end =
        new Date(dateTime.getTime() + durationMinutes * 60 * 1000)
            .toISOString()
            .replace(/[-:]/g, "")
            .split(".")[0] + "Z";

    return `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Dra Pia Gatica//Agenda//ES
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${crypto.randomUUID()}
DTSTAMP:${start}
DTSTART:${start}
DTEND:${end}
SUMMARY:Consulta Psiquiátrica
DESCRIPTION:Cita con ${patientName}
END:VEVENT
END:VCALENDAR
`.trim();
}

// send confirmation email function
export async function sendConfirmationEmail({
                                                to,
                                                patientName,
                                                dateTime,
                                                confirmToken,
                                                cancelToken,
                                            }: SendConfirmationEmailParams) {
    const confirmUrl = `${BASE_URL}/api/cita/confirm?token=${confirmToken}`;
    const cancelUrl = `${BASE_URL}/api/cita/cancel?token=${cancelToken}`;

    const formattedDate = dateTime.toLocaleDateString("es-CL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const formattedTime = dateTime.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
    });

    await resend.emails.send({
        from: "onboarding@resend.dev", // change after verifying domain
        to,
        subject: "Confirma tu cita - Dra. Pia Gatica",
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hola ${patientName},</h2>
        <p>Tu cita ha sido agendada para:</p>
        <p style="font-size: 18px; font-weight: bold;">
          ${formattedDate} a las ${formattedTime}
        </p>
        <p>Por favor confirma tu asistencia:</p>
        <div style="margin: 24px 0;">
          <a href="${confirmUrl}"
             style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Confirmar Cita
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          ¿No puedes asistir?
          <a href="${cancelUrl}" style="color: #666;">Cancelar cita</a>
        </p>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">
          Dra. Pia Gatica - Psiquiatra<br/>
          Este es un correo automático, no responder.
        </p>
      </div>
    `,
        attachments: [
            {
                filename: "cita.ics",
                content: buildICS({
                    patientName,
                    dateTime,
                }),
            },
        ],
    });
}

// send payment link email (new)
export async function sendPaymentEmail({
                                           to,
                                           name,
                                           appointmentDateTime,
                                           paymentLink,
                                       }: SendPaymentEmailParams) {
    const formattedDate = appointmentDateTime.toLocaleDateString("es-CL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
    });

    await resend.emails.send({
        from: "onboarding@resend.dev", // change after domain verification
        to,
        subject: "Completa el pago para confirmar tu cita - Dra. Pia Gatica",
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hola ${name},</h2>
        <p>Has solicitado una cita para:</p>
        <p style="font-size: 18px; font-weight: bold;">
          ${formattedDate} a las ${formattedTime}
        </p>
        <p>Para confirmar tu reserva, haz clic en el siguiente enlace de pago:</p>
        <div style="margin: 24px 0;">
          <a href="${paymentLink}"
             style="background: #0070f3; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Pagar ahora
          </a>
        </div>
        <p>Una vez pagado, recibirás un correo de confirmación y la cita quedará agendada automáticamente.</p>
        <p>Si no pagas en 24 horas, la reserva se cancelará.</p>
        <hr />
        <p style="font-size: 12px; color: #666;">Dra. Pia Gatica - Psiquiatra</p>
      </div>
    `,
    });



}

// send payment confirmed email (after successful Webpay payment)
export async function sendPaymentConfirmedEmail({
                                                    to,
                                                    patientName,
                                                    dateTime,
                                                }: {
    to: string;
    patientName: string;
    dateTime: Date;
}) {
    const formattedDate = dateTime.toLocaleDateString("es-CL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const formattedTime = dateTime.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
    });

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to,
        subject: "✅ Pago confirmado - Tu cita está agendada - Dra. Pia Gatica",
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hola ${patientName},</h2>
        <p>Tu pago ha sido procesado exitosamente. Tu cita ya está <strong>confirmada</strong>.</p>
        <p style="font-size: 18px; font-weight: bold;">
          ${formattedDate} a las ${formattedTime}
        </p>
        <p>Te esperamos. No necesitas realizar ninguna otra acción.</p>
        <p>Adjuntamos el evento a tu calendario para que lo guardes.</p>
        <hr />
        <p style="font-size: 12px; color: #666;">Dra. Pia Gatica - Psiquiatra</p>
      </div>
    `,
        attachments: [
            {
                filename: "cita.ics",
                content: buildICS({ patientName, dateTime }),
            },
        ],
    });
}