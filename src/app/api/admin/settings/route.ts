import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const adminDb = getSupabaseAdmin();
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { data: authData, error: authError } = await adminDb.auth.getUser(authHeader.replace("Bearer ", ""));
    
    if (authError || !authData.user) {
      console.error("Auth Admin Error:", authError?.message || "User not found in token");
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 });
    }

    console.log(`Tentativa de acesso admin por: ${authData.user.email}`);

    if (authData.user.email !== "rodrigotechpro@gmail.com") {
      return NextResponse.json({ error: "Acesso Negado. Seu e-mail não tem privilégios de Super Admin." }, { status: 403 });
    }

    const body = await req.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
       return NextResponse.json({ error: "Payload de ajustes inválido." }, { status: 400 });
    }

    const { error } = await adminDb
      .from('system_settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) {
       throw error;
    }

    return NextResponse.json({ success: true, message: "Configurações salvas globalmente." });

  } catch (error: any) {
    console.error("Save Admin Settings Error:", error.message);
    return NextResponse.json({ error: error.message || "Erro interno ao salvar configurações." }, { status: 500 });
  }
}
