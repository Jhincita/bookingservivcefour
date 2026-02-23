"use client";

import { useEffect } from "react";

export default function GradientBackground() {
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;

            const blob1 = document.getElementById("blob-1");
            const blob2 = document.getElementById("blob-2");
            const blob3 = document.getElementById("blob-3");

            if (blob1) blob1.style.transform = `translate(${x * 50}px, ${y * 50}px)`;
            if (blob2) blob2.style.transform = `translate(${-x * 40}px, ${y * 30}px)`;
            if (blob3) blob3.style.transform = `translate(${x * 30}px, ${-y * 40}px)`;
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className="gradient-bg">
            <div className="blob blob-1" id="blob-1"></div>
            <div className="blob blob-2" id="blob-2"></div>
            <div className="blob blob-3" id="blob-3"></div>
        </div>
    );
}