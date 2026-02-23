import Image from "next/image";

export default function Home() {
    return (
        <main>
            <div className="card animate-in">
                <Image
                    src="/next.svg" // edit with mom logo, create one.
                    alt="Pia Logo"
                    width={100}
                    height={20}
                    priority
                    className="mb-8"
                />

                <h1>Dra Pia Gatica</h1>
                <p className="mb-8">Psiquiatra</p>

                <div className="flex gap-4">
                    <a href="/agendar" className="btn-primary">
                        Tomar Hora
                    </a>
                    <a href="/sobre" className="btn-secondary">
                        Sobre Pia
                    </a>
                </div>
            </div>
        </main>
    );
}