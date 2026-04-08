// src/lib/webpay/test-api-create.ts

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function testCreatePaymentAPI() {
    console.log('🧪 Testing CREATE payment API\n');

    // Step 1: Find or create a test appointment
    console.log('1️⃣ Looking for test appointment...');

    let appointment = await prisma.appointment.findFirst({
        where: {
            status: 'PENDING',
            paymentStatus: 'PENDING'
        }
    });

    if (!appointment) {
        console.log('No appointment found. Creating test appointment...');
        appointment = await prisma.appointment.create({
            data: {
                patientName: 'Test Patient',
                patientEmail: 'test@example.com',
                patientPhone: '+56912345678',
                patientRut: '11.111.111-1',
                dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                duration: 45,
                status: 'PENDING',
                paymentStatus: 'PENDING',
                amount: 25000
            }
        });
        console.log('✅ Test appointment created:', appointment.id);
    } else {
        console.log('✅ Found appointment:', appointment.id);
    }

    // Step 2: Test the payment API
    console.log('\n2️⃣ Creating payment...');

    const testData = {
        appointmentId: appointment.id,
        amount: 25000 // 25,000 CLP
    };

    try {
        const response = await fetch('http://localhost:3000/api/payments/webpay/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ SUCCESS!\n');
            console.log('Payment ID:', result.paymentId);
            console.log('Token:', result.token);
            console.log('Webpay URL:', result.url);
            console.log('\n🔗 Open this URL in browser to test payment:');
            console.log(result.url);
        } else {
            console.log('❌ ERROR:', result.error);
        }
    } catch (error) {
        console.log('❌ Request failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testCreatePaymentAPI();