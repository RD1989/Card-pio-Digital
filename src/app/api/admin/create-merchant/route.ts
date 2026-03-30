import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000);
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getSupabaseAdmin();
    const authHeader = req.headers.get("authorization");
    
    // Autenticação de Segurança - Apenas para rodrigotechpro@gmail.com
    if (!authHeader) return NextResponse.json({ error: "No token provided" }, { status: 401 });
    
    const { data: authData, error: authError } = await adminDb.auth.getUser(authHeader.replace("Bearer ", ""));
    
    if (authError || !authData.user) {
      console.error("Auth Admin (Create) Error:", authError?.message || "User not found in token");
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 });
    }

    if (authData.user.email !== "rodrigotechpro@gmail.com") {
      console.warn(`Acesso admin negado (criação) para email: ${authData.user.email}`);
      return NextResponse.json({ error: "Acesso Inválido. Exclusivo p/ Super Admin." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, whatsapp, password, plan } = body;

    if (!name || !email || !password || !plan) {
       return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    // 1. Criar o Usuário na Autenticação Oficial (via Service Role)
    const { data: userAuth, error: createError } = await adminDb.auth.admin.createUser({
       email: email,
       password: password,
       email_confirm: true, // Já cria ativado de imediato
       user_metadata: { source: "admin-creation" }
    });

    if (createError) throw createError;

    const newUserId = userAuth.user.id;

    // 2. Injetar a linha respectiva na tabela 'restaurants'
    
    const slug = generateSlug(name);
    // Calcular Expiração do Plano
    const expirationDays = plan === 'yearly' ? 365 : 30;
    const trialEndsAt = plan !== 'free' ? new Date(new Date().setDate(new Date().getDate() + expirationDays)).toISOString() : null;

    const { data: newRestaurant, error: insertError } = await adminDb
       .from('restaurants')
       .insert({
          user_id: newUserId,
          name: name,
          slug: slug,
          whatsapp_number: whatsapp || "",
          plan: plan === 'yearly' || plan === 'monthly' ? 'pro' : plan, // Simplificação do type
          is_active: true,
          trial_ends_at: trialEndsAt,
       })
       .select()
       .single();

    if (insertError) {
       // Rollback do usuário de Auth para evitar dados fantasmas
       await adminDb.auth.admin.deleteUser(newUserId);
       throw insertError;
    }

    return NextResponse.json({ 
       success: true, 
       message: "Lojista injetado com sucesso!", 
       restaurant: newRestaurant 
    });

  } catch (error: any) {
    console.error("Create Merchant Error:", error.message);
    return NextResponse.json({ error: error.message || "Erro interno ao cadastrar." }, { status: 500 });
  }
}
