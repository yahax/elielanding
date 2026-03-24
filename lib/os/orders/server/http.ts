import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "@/lib/os/domain/errors";

export function mapApiError(error: unknown, fallbackMessage: string): {
  status: number;
  body: Record<string, unknown>;
} {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: "Invalid payload",
        details: error.flatten(),
      },
    };
  }

  if (error instanceof DomainError) {
    return {
      status: error.statusCode,
      body: {
        error: error.message,
        code: error.code,
      },
    };
  }

  return {
    status: 500,
    body: {
      error: error instanceof Error ? error.message : fallbackMessage,
    },
  };
}

export function toApiErrorResponse(error: unknown, fallbackMessage: string) {
  const mapped = mapApiError(error, fallbackMessage);
  return NextResponse.json(mapped.body, { status: mapped.status });
}
