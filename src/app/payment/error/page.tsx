import Link from "next/link";

export default function PaymentErrorPage() {
    return (
        <main>
            <div className="card animate-in text-center">
                <div className="text-red-600 text-5xl mb-4">✗</div>
                <h1>Error en el pago</h1>
                <p className="mb-4">
                    No pudimos procesar tu pago. Por favor intenta nuevamente o contacta a soporte.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href="/agendar" className="btn-primary">
                        Volver a agendar
                    </Link>
                    <Link href="/public" className="btn-secondary">
                        Ir al inicio
                    </Link>
                </div>
            </div>
        </main>
    );
}