import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password too short"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password } = RegisterSchema.parse(body);

    // Duplicate email?
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err: unknown) {
    // Prisma, Zod, etc.
    let message = "Failed to register";
    if (typeof err === "object" && err) {
      const anyErr = err as any;
      if (anyErr.name === "ZodError") {
        message = anyErr.issues?.[0]?.message ?? "Invalid input";
        return NextResponse.json({ error: message }, { status: 400 });
      }
      if (anyErr.code === "P2002") {
        // unique constraint
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
      // PrismaClientInitializationError / KnownRequestError / etc.
      if (anyErr.message) message = anyErr.message;
    }
    console.error("Registration error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
