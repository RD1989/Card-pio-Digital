import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function DELETE(req: NextRequest) {
  try {
    const adminDb = getSupabaseAdmin();
    // 1. Validar se o request vem do próprio super-admin (Security Layer via Auth)
    // Extraímos o jwt do header para bater no Supabase
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { data: authData, error: authError } = await adminDb.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || authData.user?.email !== "rodrigotechpro@gmail.com") {
      return NextResponse.json({ error: "Acesso Negado. Requer privilégios de Super Admin." }, { status: 403 });
    }

    // 2. Coletar o userId que deve ser delatado
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
       return NextResponse.json({ error: "Target userId não especificado." }, { status: 400 });
    }

    if (targetUserId === authData.user.id) {
       return NextResponse.json({ error: "Você não pode deletar a si mesmo." }, { status: 400 });
    }

    // 3. Deletar arquivos remanescentes vinculados a esse Owner p/ o Supabase Auth não rejeitar a deleção por FK Constraint.
    try {
       await adminDb.schema('storage').from('objects').delete().eq('owner', targetUserId);
    } catch(err) {
       console.log("Aviso: Falha ao tentar limpar storage objects preventivamente. Pode ser que não existam ou RLS impediu.");
    }

    // 4. Deletar usando a Master Key. O PostgreSQL Cascade vai destruir todos os registros vinculados automaticamente.
    const { data: delResult, error: delError } = await adminDb.auth.admin.deleteUser(targetUserId);

    if (delError) {
       console.error("Supabase Admin Auth Delete Error:", delError);
       throw delError;
    }

    return NextResponse.json({ success: true, message: `Lojista (User ID: ${targetUserId}) erradicado com sucesso.` });

  } catch (error: any) {
    console.error("Delete Merchant Error:", error.message);
    return NextResponse.json({ error: error.message || "Erro interno ao deletar usuário." }, { status: 500 });
  }
}
