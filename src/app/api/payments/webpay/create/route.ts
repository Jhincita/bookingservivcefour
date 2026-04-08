import { NextRequest, NextResponse } from 'next/server';
import { WebpayService } from '@/lib/webpay/webpay.service';
import { prisma } from '@/lib/prisma'; // assuming you have a prisma instance exported from lib/prisma.ts

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { appointmentId, amount } = body;

        if (!appointmentId || !amount) {
            return NextResponse.json(
                { error: 'Missing fields: appointmentId, amount' },
                { status: 400 }
            );
        }

        // Check appointment exists
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Prevent duplicate pending/paid payments
        const existingPayment = await prisma.payment.findFirst({
            where: {
                appointmentId,
                status: { in: ['PENDING', 'PAID'] },
            },
        });
        if (existingPayment) {
            return NextResponse.json(
                { error: 'A payment already exists for this appointment' },
                { status: 400 }
            );
        }

        // Generate unique identifiers
        const buyOrder = `APT${appointmentId.slice(-8)}-${Date.now()}`;
        const sessionId = `SESSION-${Date.now()}`;
        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webpay/return`;

        // 1. Create Webpay transaction
        const webpayResult = await WebpayService.createTransaction(
            buyOrder,
            sessionId,
            amount,
            returnUrl
        );

        if (!webpayResult.success) {
            return NextResponse.json({ error: webpayResult.error }, { status: 500 });
        }

        // 2. Store payment record
        const payment = await prisma.payment.create({
            data: {
                appointmentId,
                buyOrder,
                amount,
                status: 'PENDING',
                token: webpayResult.token,
            },
        });

        // 3. Return the full Webpay URL (the SDK usually returns a complete URL with token)
        // If the URL from SDK already contains the token, use it directly.
        // Otherwise, construct it manually (fallback).
        if (!webpayResult.token) {
            return NextResponse.json({ error: 'No token returned' }, { status: 500 });
        }
        const fullUrl = `https://webpay3gint.transbank.cl/webpayserver/init_transaction.cgi?token_ws=${webpayResult.token}`;

        return NextResponse.json({
            success: true,
            url: fullUrl,
            token: webpayResult.token,
            paymentId: payment.id,
        });
    } catch (error) {
        console.error('Create payment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}