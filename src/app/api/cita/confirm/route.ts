import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.redirect(new URL("/cita/error?msg=token-missing", request.url));
    }

    const appointment = await prisma.appointment.findUnique({
        where: { confirmToken: token }
    });

    if (!appointment) {
        return NextResponse.redirect(new URL("/cita/error?msg=invalid-token", request.url));
    }

    if (appointment.status === "CANCELLED") {
        return NextResponse.redirect(new URL("/cita/error?msg=already-cancelled", request.url));
    }

    if (appointment.status === "CONFIRMED") {
        return NextResponse.redirect(new URL("/cita/confirmada", request.url));
    }

    await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "CONFIRMED" }
    });

    return NextResponse.redirect(new URL("/cita/confirmada", request.url));
}