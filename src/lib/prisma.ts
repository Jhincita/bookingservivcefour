// this file creates a (singleton) PrsimaClient instance and ensures that in developemnt, the instance is reused instead of recreated with every hot reload

//hot reload: The app updates while it’s running, without restarting the server or refreshing everything from scratch.


import { PrismaClient } from "../generated/prisma/client";
 // prisma ORM client
import {PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
// globalThis: = global object that lives across hot reloads
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// ?? (nullish coalescing) = allows to set a default for smt if it does not exist.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") { // if it !== production then is development
    // only cache in development.
    // in production app is not hot reloading so theres no problem
    // in development hot reload happens constantly
    globalForPrisma.prisma = prisma;
}






