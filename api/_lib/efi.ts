import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { EFI_CERT_BASE64 } from './cert.js';
import { getGlobalSetting } from './supabase.js';

export async function getEfiInstance(): Promise<AxiosInstance> {
  // Fetch credentials from DB dynamically
  const clientId = await getGlobalSetting('efi_client_id');
  const clientSecret = await getGlobalSetting('efi_client_secret');
  const isHomolog = (await getGlobalSetting('efi_homolog')) === 'true';
  const pixKey = await getGlobalSetting('efi_pix_key');

  console.log('--- DIAGNÓSTICO EFÍ ---');
  console.log(`Ambiente: ${isHomolog ? 'Homologação' : 'Produção'}`);
  console.log(`Client ID: ${clientId.substring(0, 10)}...`);
  console.log(`Chave Pix: ${pixKey}`);

  if (!clientId || !clientSecret) {
    throw new Error('Credenciais da Efí Bank (Client ID/Secret) não configuradas no Super Admin.');
  }

  const apiUrl = isHomolog 
    ? 'https://api-pix-h.gerencianet.com.br' // Homologação Efí (mTLS)
    : 'https://api-pix.gerencianet.com.br'; // Produção Efí (mTLS)

  // Tenta carregar o certificado do DB, se não houver, usa o hardcoded
  const dbCert = await getGlobalSetting('efi_cert');
  const certSource = dbCert ? 'Banco de Dados' : 'Hardcoded (cert.ts)';
  const certBase64 = dbCert || EFI_CERT_BASE64;

  // Decodifica o Buffer para MTLS
  const certBuffer = Buffer.from(certBase64, 'base64');
  console.log(`Fonte do Certificado: ${certSource}`);
  console.log(`Tamanho do Certificado: ${certBuffer.length} bytes`);
  
  const httpsAgent = new https.Agent({
    pfx: certBuffer,
    passphrase: '' // Vazio, conforme padrão, a não ser que tenha inserido senha na cert
  });

  const authCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    console.log('Solicitando token OAuth...');
    const authResponse = await axios.post(`${apiUrl}/oauth/token`, { grant_type: 'client_credentials' }, {
      headers: { Authorization: `Basic ${authCredentials}` },
      httpsAgent
    });
    console.log('✅ Token OAuth obtido com sucesso.');

    const efiApi = axios.create({
      baseURL: apiUrl,
      headers: { Authorization: `Bearer ${authResponse.data.access_token}` },
      httpsAgent
    });

    return efiApi;
  } catch (error: any) {
    console.error('❌ Erro na Autenticação Efí (OAuth):', error.response?.data || error.message);
    throw error;
  }
}
