import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { EFI_CERT_BASE64 } from './cert.js';
import { getGlobalSetting } from './supabase.js';

export async function getEfiInstance(): Promise<AxiosInstance> {
  // Fetch credentials from DB dynamically
  const clientId = await getGlobalSetting('efi_client_id');
  const clientSecret = await getGlobalSetting('efi_client_secret');
  const isHomolog = (await getGlobalSetting('efi_homolog')) === 'true';

  if (!clientId || !clientSecret) {
    throw new Error('Credenciais da Efí Bank (Client ID/Secret) não configuradas no Super Admin.');
  }

  const apiUrl = isHomolog 
    ? 'https://pix.api.efipay.com.br' // Homologação Efí (verifique os endpoints adequados para HML na documentação)
    : 'https://api-pix.efipay.com.br'; // Produção Efí MTLS

  // Decodifica o Buffer para MTLS
  const certBuffer = Buffer.from(EFI_CERT_BASE64, 'base64');
  
  const httpsAgent = new https.Agent({
    pfx: certBuffer,
    passphrase: '' // Vazio, conforme padrão, a não ser que tenha inserido senha na cert
  });

  const authCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const authResponse = await axios.post(`${apiUrl}/oauth/token`, { grant_type: 'client_credentials' }, {
    headers: { Authorization: `Basic ${authCredentials}` },
    httpsAgent
  });

  const efiApi = axios.create({
    baseURL: apiUrl,
    headers: { Authorization: `Bearer ${authResponse.data.access_token}` },
    httpsAgent
  });

  return efiApi;
}
