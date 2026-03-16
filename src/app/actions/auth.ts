"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function loginWithCredentials(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = credentialsSchema.parse(data);

    await signIn("credentials", {
      email: parsed.email,
      password: parsed.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." };
        default:
          return { error: "Something went wrong." };
      }
    }
    // Rethrow redirect errors from NextJS
    throw error;
  }
}

export async function registerWithCredentials(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = credentialsSchema.parse(data);

    const exists = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (exists) {
      return { error: "Email already exists" };
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);

    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        passwordHash,
      },
    });

    // Sign in automatically after registration
    await signIn("credentials", {
      email: parsed.email,
      password: parsed.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid input data." };
    }
    throw error; // Rethrow Next.js redirect
  }
}
