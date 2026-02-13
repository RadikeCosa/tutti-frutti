import { NextRequest, NextResponse } from "next/server";
import { cambiarLetraRonda } from "@/app/actions";

export async function POST(req: NextRequest) {
  const { salaId, rondaId, jugadorId } = await req.json();
  if (!salaId || !rondaId || !jugadorId) {
    return NextResponse.json(
      { success: false, error: "Datos incompletos" },
      { status: 400 },
    );
  }
  const result = await cambiarLetraRonda({ salaId, rondaId, jugadorId });
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 403 },
    );
  }
  return NextResponse.json({ success: true });
}
