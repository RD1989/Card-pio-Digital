import axios from 'axios';
import https from 'https';
import { supabaseAdmin } from './supabase';

/**
 * 🔒 Conector Seguro (MTLS) do Efí Bank (Gerencianet) para Vercel
 * 
 * Por que foi feito assim? A Vercel (Serverless) impede que rotas 
 * leiam arquivos .p12 locais da pasta após o Build.
 * Portanto, subimos esse mesmo p12 convertido como uma string "Base64" 
 * na variável de ambiente. E descriptografamos ele em RAM no momento do PIX! 🚀
 */
export async function getEfiInstance() {

  // 1. Variável de Ambiente a ser cadastrada no seu painel da Vercel
  const p12Base64 = process.env.EFI_P12_CERT_BASE64;
  
  if (!p12Base64) {
    throw new Error('FATAL: Variável `EFI_P12_CERT_BASE64` não informada no servidor.');
  }

  // Descriptografando a String Base64 para Buffer Nativo do Node
  const certBuffer = Buffer.from(p12Base64, 'base64');

  // Adicionando Autoridade Certificadora
  const httpsAgent = new https.Agent({
    pfx: certBuffer,
    passphrase: '' // Substitua caso a Gerencianet tenha lhe dado uma passphrase do cert
  });

  // 2. Buscando credenciais no banco migrado (Da tabela public.system_configs)
  const { data: configs } = await supabaseAdmin.from('system_configs').select('*').single();
  
  const clientId = configs?.efipay_client_id || process.env.EFI_CLIENT_ID;
  const clientSecret = configs?.efipay_client_secret || process.env.EFI_CLIENT_SECRET;
  
  if(!clientId || !clientSecret) {
      throw new Error('Credenciais da EFI não encontradas no Banco System Configs ou .env');
  }

  // 3. Montando chaves pra emissão de Token OAuth
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  // Request OAuth efetuando validacao MTLS do Certificado (Ambiente de Produção PIX)
  const authResponse = await axios({
    method: 'POST',
    url: 'https://api-pix.gerencianet.com.br/oauth/token',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    data: { grant_type: 'client_credentials' },
    httpsAgent
  });

  const token = authResponse.data.access_token;

  // 4. Instância Oficial Retornada. As rotas Next.js de Backend usarão "efiApi" 
  // diretamente para criar QRCode (efiApi.post('/v2/cob')) 
  const efiApi = axios.create({
    baseURL: 'https://api-pix.gerencianet.com.br',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    httpsAgent
  });

  return efiApi;
}
