import { NextRequest, NextResponse } from 'next/server';
import { WebpayService } from '@/lib/webpay/webpay.service';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent } from '@/services/google-calendar.service';
import { sendConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const token = formData.get('token_ws') as string;

        if (!token) {
            console.error('No token received');
            return NextResponse.redirect(new URL('/payment/error', process.env.NEXT_PUBLIC_APP_URL));
        }

        // 1. Confirm with Webpay
        const confirmation = await WebpayService.confirmTransaction(token);
        if (!confirmation.success || confirmation.responseCode !== 0) {
            console.error('Payment confirmation failed:', confirmation);
            return NextResponse.redirect(new URL('/payment/error', process.env.NEXT_PUBLIC_APP_URL));
        }

        // 2. Find payment by token
        const payment = await prisma.payment.findUnique({
            where: { token },
            include: { appointment: true },
        });
        if (!payment) {
            console.error('Payment not found for token:', token);
            return NextResponse.redirect(new URL('/payment/error', process.env.NEXT_PUBLIC_APP_URL));
        }

        // 3. Update payment and appointment in a transaction
        await prisma.$transaction([
            prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'PAID',
                    authorizationCode: confirmation.authorizationCode,
                    paymentTypeCode: confirmation.paymentTypeCode,
                    responseCode: confirmation.responseCode,
                    cardNumber: confirmation.cardNumber,
                    transactionDate: confirmation.transactionDate ? new Date(confirmation.transactionDate) : null,
                    installmentsNumber: confirmation.installmentsNumber,
                },
            }),
            prisma.appointment.update({
                where: { id: payment.appointmentId },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID',
                    transactionId: confirmation.authorizationCode,
                    amount: payment.amount,
                },
            }),
        ]);

        // 4. Create Google Calendar event
        const appointment = payment.appointment;
        const calendarResult = await createCalendarEvent({
            patientName: appointment.patientName,
            dateTime: appointment.dateTime,
            durationMinutes: appointment.duration || 45,
        });
        if (calendarResult.success) {
            await prisma.appointment.update({
                where: { id: appointment.id },
                data: { googleEventId: calendarResult.eventId },
            });
        } else {
            console.error('Failed to create calendar event for appointment', appointment.id);
        }

        // 5. Send confirmation email (with ICS attachment)
        await sendConfirmationEmail({
            to: appointment.patientEmail,
            patientName: appointment.patientName,
            dateTime: appointment.dateTime,
            confirmToken: appointment.confirmToken,
            cancelToken: appointment.cancelToken,
        });

        // 6. Redirect to success page
        return NextResponse.redirect(
            new URL(`/payment/success?appointmentId=${appointment.id}`, process.env.NEXT_PUBLIC_APP_URL)
        );
    } catch (error) {
        console.error('Return route error:', error);
        return NextResponse.redirect(new URL('/payment/error', process.env.NEXT_PUBLIC_APP_URL));
    }
}

// Handle GET (some banks use GET)
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token_ws');
    if (token) {
        const formData = new FormData();
        formData.append('token_ws', token);
        const newRequest = new NextRequest(request.url, { method: 'POST', body: formData });
        return POST(newRequest);
    }
    return NextResponse.redirect(new URL('/payment/error', process.env.NEXT_PUBLIC_APP_URL));
}