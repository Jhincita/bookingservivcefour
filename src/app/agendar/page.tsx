"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { getAvailableSlots } from "@/actions/slots";
import { createPendingAppointment } from "@/actions/createPendingAppointment"; // ✅ new import
import "react-day-picker/dist/style.css";
import Link from "next/link";

type Slot = {
    id: string;
    startTime: string;
    endTime: string;
};

function formatRut(rut: string): string {
    const clean = rut.replace(/[.\s]/g, "").toUpperCase();
    return clean;
}

function validateRut(rut: string): boolean {
    const clean = formatRut(rut);
    if (!/^\d{7,8}-[\dK]$/.test(clean)) return false;
    const [numbers, dv] = clean.split("-");
    let sum = 0;
    let multiplier = 2;
    for (let i = numbers.length - 1; i >= 0; i--) {
        sum += parseInt(numbers[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const expectedDv = 11 - (sum % 11);
    const dvChar = expectedDv === 11 ? "0" : expectedDv === 10 ? "K" : expectedDv.toString();
    return dv === dvChar;
}

export default function AgendarPage() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Slot | undefined>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [bookingSubmitted, setBookingSubmitted] = useState(false); // ✅ renamed from "success"

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [rut, setRut] = useState("");

    useEffect(() => {
        if (!selectedDate) return;
        const fetchSlots = async () => {
            setLoading(true);
            setSelectedSlot(undefined);
            const data = await getAvailableSlots(selectedDate);
            setSlots(data);
            setLoading(false);
        };
        void fetchSlots();
    }, [selectedDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(undefined);

        // Validate
        if (!selectedDate || !selectedSlot) {
            setError("Selecciona fecha y hora");
            return;
        }
        if (!name.trim()) {
            setError("Ingresa tu nombre");
            return;
        }
        if (!email.includes("@")) {
            setError("Email inválido");
            return;
        }
        if (phone.length < 8) {
            setError("Teléfono inválido");
            return;
        }
        if (!validateRut(rut)) {
            setError("RUT inválido");
            return;
        }

        // Local variables to satisfy TypeScript
        const date = selectedDate;
        const slot = selectedSlot;

        setSubmitting(true);
        try {
            const result = await createPendingAppointment({
                slotId: slot.id,
                selectedDate: date,
                patientName: name.trim(),
                patientEmail: email.trim(),
                patientPhone: phone.trim(),
                patientRut: formatRut(rut),
            });
            if (result.success) {
                setBookingSubmitted(true);
            } else {
                setError(result.error || "Error al crear la reserva");
            }
        } catch (err: unknown) {  // ✅ No more 'any'
            const errorMessage = err instanceof Error ? err.message : "Error desconocido";
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ Updated success screen
    if (bookingSubmitted) {
        return (
            <main>
                <div className="card animate-in text-center">
                    <h1>¡Solicitud enviada!</h1>
                    <p className="mb-2">
                        Hemos enviado un correo a <strong>{email}</strong> con un enlace de pago.
                    </p>
                    <p>Una vez realizado el pago, tu cita quedará confirmada automáticamente.</p>
                    <Link href="/" className="btn-primary mt-4">
                        Volver al inicio
                    </Link>
                </div>
            </main>
        );
    }

    // Rest of the JSX unchanged
    return (
        <main>
            <Link href="/" className="back-btn" aria-label="Volver">
                <svg className="back-chevron" width="16" height="16" viewBox="0 0 24 24">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
            </Link>
            <div className="card animate-in">
                <h1>Agendar Hora</h1>
                <p className="mb-6">Selecciona una fecha y horario disponible</p>

                <div className="flex gap-8 flex-wrap">
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        locale={es}
                        disabled={{ before: new Date() }}
                    />

                    {selectedDate && (
                        <div className="flex-1 min-w-[280px] animate-in">
                            <h2>
                                Horarios disponibles para: {selectedDate.toLocaleDateString("es-CL")}
                            </h2>
                            {loading ? (
                                <p>Cargando...</p>
                            ) : slots.length === 0 ? (
                                <p>No hay horarios disponibles.</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 mb-6">
                                    {slots.map((slot) => (
                                        <button
                                            key={slot.id}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`slot-btn ${
                                                selectedSlot?.id === slot.id ? "selected" : ""
                                            }`}
                                        >
                                            {slot.startTime}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedSlot && (
                        <div className="flex-1 min-w-[280px] animate-in">
                            <h2>
                                Confirmar cita: {selectedDate?.toLocaleDateString("es-CL")} a las{" "}
                                {selectedSlot.startTime}
                            </h2>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <input
                                    type="text"
                                    placeholder="Nombre completo"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <input
                                    type="tel"
                                    placeholder="Teléfono"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="RUT (ej: 12345678-9)"
                                    value={rut}
                                    onChange={(e) => setRut(e.target.value)}
                                />
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <button type="submit" disabled={submitting} className="btn-primary">
                                    {submitting ? "Procesando..." : "Confirmar Cita"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}