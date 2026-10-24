/**
 * Utilitários para Ficha Cadastral e Dados Eclesiásticos de Membros
 * Adaptado com base na experiência e boas práticas do projeto Caixa
 */

/**
 * Remove prefixos e títulos eclesiásticos do nome para exibição limpa na sessão Rol de Membros.
 * Exemplo: "Presb. Antonio Angelim" -> "Antonio Angelim", "Diác. Alcir José" -> "Alcir José"
 */
export function stripEcclesiasticalTitle(name?: string | null): string {
  if (!name || !name.trim()) return '';
  return name
    .replace(/^(Rev\.?|Pastor|Pr\.?|Presb\.?|Diác\.?|Diac\.?|Irmão|Irmao)\s+/i, '')
    .trim();
}

/**
 * Compara dois membros por ordem alfabética de seus nomes reais,
 * ignorando quaisquer prefixos ou títulos eclesiásticos como "Presb.", "Diác.", "Rev.", etc.
 */
export function compareMembersByName(
  a?: { name?: string | null } | null, 
  b?: { name?: string | null } | null
): number {
  const nameA = stripEcclesiasticalTitle(a?.name).trim();
  const nameB = stripEcclesiasticalTitle(b?.name).trim();
  return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
}

/**
 * Retorna o nome formatado com o título eclesiástico para relatórios e eleições.
 * Se o membro for Presbítero, Diácono ou Pastor, anexa o prefixo honorífico adequado.
 */
export function formatMemberNameWithTitle(member?: { name?: string | null; funcaoEclesiastica?: string | null; cargo?: string | null } | null): string {
  if (!member || !member.name) return '';
  const clean = stripEcclesiasticalTitle(member.name);
  const funcao = (member.funcaoEclesiastica || '').toLowerCase();
  const cargo = (member.cargo || '').toLowerCase();

  if (funcao.includes('presb') || cargo.includes('presb')) {
    return `Presb. ${clean}`;
  }
  if (funcao.includes('diác') || funcao.includes('diac') || cargo.includes('diác') || cargo.includes('diac')) {
    return `Diác. ${clean}`;
  }
  if (funcao.includes('pastor') || funcao.includes('rev') || cargo.includes('pastor')) {
    return `Rev. ${clean}`;
  }
  return clean;
}

/**
 * Extrai as iniciais do membro, ignorando títulos eclesiásticos comuns.
 * Exemplo: "Presb. João da Silva" -> "JS", "Diác. Paulo Rocha" -> "PR"
 */
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'M';
  
  const cleanName = stripEcclesiasticalTitle(name);

  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'M';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

/**
 * Calcula a idade com base em uma string de data no formato AAAA-MM-DD.
 */
export function calcularIdade(nascimento?: string | null): number | null {
  if (!nascimento || typeof nascimento !== 'string') return null;
  const d = new Date(nascimento + 'T12:00:00');
  if (isNaN(d.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export interface StatusFaixaUPA {
  idade: number | null;
  faixa: 'menor_12' | 'ativo_upa' | 'transicao_ump' | 'sem_data';
  rotulo: string;
  badgeClass: string;
}

/**
 * Determina o enquadramento do adolescente nas faixas etárias da UPA / IPB:
 * - Menos de 12 anos: Pré-adolescente (sócio cooperador)
 * - 12 a 17 anos: Faixa regular de sócio ativo da UPA
 * - 18 anos ou mais: Idade de transição estatutária para a Mocidade (UMP)
 */
export function getStatusFaixaEtariaUPA(nascimento?: string | null): StatusFaixaUPA {
  const idade = calcularIdade(nascimento);
  if (idade === null) {
    return {
      idade: null,
      faixa: 'sem_data',
      rotulo: 'Sem nascimento',
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };
  }

  if (idade < 12) {
    return {
      idade,
      faixa: 'menor_12',
      rotulo: `${idade} anos (Menor de 12)`,
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    };
  }

  if (idade >= 18) {
    return {
      idade,
      faixa: 'transicao_ump',
      rotulo: `${idade} anos (Transição UMP)`,
      badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800',
    };
  }

  return {
    idade,
    faixa: 'ativo_upa',
    rotulo: `${idade} anos (UPA)`,
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
  };
}

/**
 * Aplica máscara de proteção de dados (LGPD) no CPF.
 * Exemplo: "123.456.789-00" ou "12345678900" -> "***.456.789-**"
 */
export function maskCpf(cpf?: string | null): string {
  if (!cpf || !String(cpf).trim()) return '-';
  const digits = String(cpf).replace(/\D/g, '');
  if (digits.length !== 11) return String(cpf);
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

/**
 * Aplica máscara de telefone (LGPD).
 * Exemplo: "95991234567" -> "(95) *****-4567"
 */
export function maskPhone(phone?: string | null): string {
  if (!phone || !String(phone).trim()) return '-';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) *****-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ****-${digits.slice(6)}`;
  }
  return String(phone);
}

/**
 * Formata número de telefone para formato brasileiro legível: (XX) XXXXX-XXXX
 */
export function formatPhone(phone?: string | null): string {
  if (!phone || !String(phone).trim()) return '-';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return String(phone);
}

/**
 * Extrai o primeiro número de telefone válido do campo de contato.
 * Suporta formatos como: "(95) 99129-3400 / 98118-6780" ou "+55 (95) 99171-6122"
 */
export function extractFirstValidPhone(phone?: string | null): string | null {
  if (!phone || !String(phone).trim()) return null;

  // Se houver múltiplos números separados por '/', ',', ';' ou 'e', pega o primeiro
  const firstPart = String(phone).split(/[/,;]|\be\b/i)[0].trim();
  let digits = firstPart.replace(/\D/g, '');

  if (!digits) return null;

  // Se começar com 55 e tiver 12 ou 13 dígitos
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Se tiver 10 ou 11 dígitos (DDD + número)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Se ainda estiver muito longo, tenta pegar os primeiros 11 dígitos
  if (digits.length > 11) {
    if (digits.startsWith('55')) {
      return digits.slice(0, 13);
    }
    return `55${digits.slice(0, 11)}`;
  }

  return null;
}

/**
 * Gera URL para envio de mensagem direta no WhatsApp.
 * Usa web.whatsapp.com/send para ir direto na conversa da instância já aberta.
 */
export function gerarWhatsAppUrl(phone?: string | null, message?: string): string | null {
  const fullNumber = extractFirstValidPhone(phone);
  if (!fullNumber) return null;

  const encodedMsg = message ? encodeURIComponent(message) : '';
  return `https://web.whatsapp.com/send?phone=${fullNumber}${encodedMsg ? `&text=${encodedMsg}` : ''}`;
}

/**
 * Converte data AAAA-MM-DD para DD/MM/AAAA.
 */
export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '-';
  if (!dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
