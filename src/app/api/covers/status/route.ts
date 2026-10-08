import { NextResponse } from "next/server";
import { realCoverService } from "@/lib/cover-generator/service";

export async function GET() {
  const status = realCoverService.getStatus();
  return NextResponse.json(status);
}
