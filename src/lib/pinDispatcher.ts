import { Member } from '../types';
import { gerarWhatsAppUrl, stripEcclesiasticalTitle } from './memberUtils';

export interface PinDispatchResult {
  success: boolean;
  channel: 'whatsapp_web' | 'whatsapp_api';
  message?: string;
  error?: string;
}

export interface PinDispatcher {
  sendPin(member: Member, pin: string): Promise<PinDispatchResult>;
}

/**
 * Cria a mensagem padrão amigável para envio de PIN da UPH
 */
export function formatPinMessage(member: Member, pin: string): string {
  const nomeLimpo = stripEcclesiasticalTitle(member.name);
  return `Olá, ${nomeLimpo}! Seu PIN individual de votação/acesso da UPH é: *${pin}*.\n\nPor favor, guarde este código para as votações e plenárias.`;
}

/**
 * Provider 1: Link direto via WhatsApp Web (wa.me)
 */
export class WhatsAppWebPinDispatcher implements PinDispatcher {
  async sendPin(member: Member, pin: string): Promise<PinDispatchResult> {
    if (!member.contato) {
      return {
        success: false,
        channel: 'whatsapp_web',
        error: 'Sócio não possui telefone/WhatsApp cadastrado.'
      };
    }

    const text = formatPinMessage(member, pin);
    const url = gerarWhatsAppUrl(member.contato, text);

    if (!url) {
      return {
        success: false,
        channel: 'whatsapp_web',
        error: 'Número de telefone inválido para o WhatsApp.'
      };
    }

    // Abre em nova janela/aba
    window.open(url, '_blank', 'noopener,noreferrer');

    return {
      success: true,
      channel: 'whatsapp_web',
      message: 'Janela do WhatsApp aberta com sucesso.'
    };
  }
}

/**
 * Provider 2 (Preparado para transição): WhatsApp via API Backend (Baileys / Evolution / Z-API)
 */
export class WhatsAppApiPinDispatcher implements PinDispatcher {
  private apiUrl: string;

  constructor(apiUrl = '/api/send-pin') {
    this.apiUrl = apiUrl;
  }

  async sendPin(member: Member, pin: string): Promise<PinDispatchResult> {
    if (!member.contato) {
      return {
        success: false,
        channel: 'whatsapp_api',
        error: 'Sócio não possui telefone/WhatsApp cadastrado.'
      };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          phone: member.contato,
          name: member.name,
          pin
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar via API');
      }

      return {
        success: true,
        channel: 'whatsapp_api',
        message: 'PIN enviado com sucesso via API.'
      };
    } catch (err: any) {
      return {
        success: false,
        channel: 'whatsapp_api',
        error: err.message || 'Falha de comunicação com o servidor.'
      };
    }
  }
}

/**
 * Instância ativa do dispatcher.
 * Para mudar para a Opção 2 no futuro, basta alterar para: new WhatsAppApiPinDispatcher()
 */
export const activePinDispatcher: PinDispatcher = new WhatsAppWebPinDispatcher();
