import { Member, FuncaoEclesiastica, SituacaoMembro, EstadoCivil } from '../types';
import { stripEcclesiasticalTitle } from './memberUtils';

export interface ParsedMemberData {
  orderNumber?: number;
  name: string;
  cargo?: string;
  funcaoEclesiastica?: FuncaoEclesiastica | string;
  situacao?: SituacaoMembro | string;
  contato?: string;
  email?: string;
  endereco?: string;
  cpf?: string;
  rg?: string;
  nascimento?: string; // AAAA-MM-DD
  estadoCivil?: EstadoCivil | string;
  naturalidade?: string;
  tipoSanguineo?: string;
  filiacaoMae?: string;
  filiacaoPai?: string;
  dataBatismo?: string; // AAAA-MM-DD
  dataProfissaoFe?: string; // AAAA-MM-DD
  uphEntryDate?: string;
  dizimista?: boolean;
  pinCode?: string;
  observacoes?: string;
}

/**
 * Converte data DD/MM/AAAA ou DD-MM-AAAA para o formato ISO AAAA-MM-DD.
 */
export function parseDateToISO(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  const clean = dateStr.replace(/[*_]/g, '').trim();
  if (/não informad|sem registro|não consta/i.test(clean)) return undefined;

  const match = clean.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (!match) return undefined;

  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3];
  return `${year}-${month}-${day}`;
}

/**
 * Converte data AAAA-MM-DD para DD/MM/AAAA.
 */
export function formatISOToDateBR(isoStr?: string | null): string {
  if (!isoStr) return 'Não informado';
  const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return isoStr;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Normaliza strings para chave comparativa (remove acentos, espaços extras, minúsculas, prefixos).
 */
export function normalizeNameKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(presb\.?|diac\.?|diác\.?|rev\.?|pastor|pr\.?|irmao|irmão)\s+/i, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Normaliza apenas números (para CPF/Telefones).
 */
export function cleanDigits(str?: string | null): string {
  if (!str) return '';
  return str.replace(/\D/g, '');
}

/**
 * Faz o parse de um documento Markdown contendo a Tabela Resumo e/ou Fichas Cadastrais da UPH.
 */
export function parseMarkdownMembers(markdownContent: string): ParsedMemberData[] {
  if (!markdownContent || !markdownContent.trim()) {
    return [];
  }

  const normalizedContent = markdownContent.replace(/\r\n/g, '\n');
  const tableMembers: ParsedMemberData[] = parseTableSection(normalizedContent);
  const detailMembers: ParsedMemberData[] = parseDetailedCardsSection(normalizedContent);

  // Mapeamento por chave normalizada para merge inteligente
  const mergedMap = new Map<string, ParsedMemberData>();

  // 1. Processar registros da tabela
  tableMembers.forEach((tm) => {
    const key = normalizeNameKey(tm.name);
    mergedMap.set(key, { ...tm });
  });

  // 2. Mesclar ou adicionar registros das fichas detalhadas
  detailMembers.forEach((dm) => {
    const key = normalizeNameKey(dm.name);
    const existing = mergedMap.get(key);

    if (existing) {
      mergedMap.set(key, {
        ...existing,
        ...dm,
        // Preserva valores se o detalhe for indefinido mas a tabela tiver
        orderNumber: dm.orderNumber || existing.orderNumber,
        name: dm.name || existing.name,
        cargo: dm.cargo || existing.cargo,
        funcaoEclesiastica: dm.funcaoEclesiastica || existing.funcaoEclesiastica,
        situacao: dm.situacao || existing.situacao,
        contato: dm.contato || existing.contato,
        email: dm.email || existing.email,
        nascimento: dm.nascimento || existing.nascimento,
        tipoSanguineo: dm.tipoSanguineo || existing.tipoSanguineo,
      });
    } else {
      mergedMap.set(key, dm);
    }
  });

  const result = Array.from(mergedMap.values());

  // Ordenar por orderNumber ou por nome
  result.sort((a, b) => {
    if (a.orderNumber && b.orderNumber) {
      return a.orderNumber - b.orderNumber;
    }
    if (a.orderNumber) return -1;
    if (b.orderNumber) return 1;
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  return result;
}

/**
 * Extrai membros da Tabela Resumo (Seção 1).
 */
function parseTableSection(content: string): ParsedMemberData[] {
  const members: ParsedMemberData[] = [];
  const lines = content.split('\n');

  let inTable = false;
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('|') && line.endsWith('|')) {
      const cols = line
        .split('|')
        .slice(1, -1)
        .map(c => c.trim().replace(/\*\*/g, ''));

      // Detecção da linha de cabeçalho
      const isHeader = cols.some(c => /nome completo|nº|ofício|oficio/i.test(c));
      const isDivider = cols.every(c => /^[:\s-]+$/.test(c));

      if (isHeader) {
        headers = cols.map(c => c.toLowerCase());
        inTable = true;
        continue;
      }

      if (isDivider) {
        continue;
      }

      if (inTable && cols.length >= 3) {
        const rowData = parseTableRow(cols, headers);
        if (rowData && rowData.name) {
          members.push(rowData);
        }
      }
    } else if (inTable && line.startsWith('##')) {
      // Saiu da tabela para outra seção
      break;
    }
  }

  return members;
}

function parseTableRow(cols: string[], headers: string[]): ParsedMemberData | null {
  const getCol = (patterns: RegExp[]): string | undefined => {
    for (let idx = 0; idx < headers.length; idx++) {
      if (patterns.some(p => p.test(headers[idx]))) {
        return cols[idx]?.trim();
      }
    }
    return undefined;
  };

  const numStr = getCol([/^nº$/i, /^n°$/i, /^num/i, /^#$/i]) || cols[0];
  const orderNum = parseInt(cleanDigits(numStr), 10);

  const rawName = getCol([/nome/i]) || cols[1] || '';
  const cleanName = stripEcclesiasticalTitle(rawName.replace(/[*_]/g, '').trim());
  if (!cleanName || cleanName.toLowerCase() === 'nome completo') return null;

  const rawOficio = getCol([/of[íi]cio/i, /t[íi]tulo/i, /cargo/i]) || cols[2] || '';
  const cleanOficio = rawOficio.replace(/[*_]/g, '').trim();

  const rawNascimento = getCol([/nasc/i]);
  const rawContato = getCol([/contato/i, /celular/i, /whatsapp/i]);
  const rawEmail = getCol([/e-?mail/i]);
  const rawTipoSang = getCol([/sang/i]);
  const rawSituacao = getCol([/situa[çc]/i, /status/i]);

  const { funcao, cargo } = mapOficioToFuncaoCargo(cleanOficio);

  return {
    orderNumber: !isNaN(orderNum) ? orderNum : undefined,
    name: cleanName,
    cargo,
    funcaoEclesiastica: funcao,
    situacao: mapSituacao(rawSituacao),
    nascimento: parseDateToISO(rawNascimento),
    contato: sanitizeValue(rawContato),
    email: sanitizeEmail(rawEmail),
    tipoSanguineo: sanitizeTipoSanguineo(rawTipoSang),
  };
}

/**
 * Extrai membros das Fichas Cadastrais Detalhadas (Seção 2).
 */
function parseDetailedCardsSection(content: string): ParsedMemberData[] {
  const members: ParsedMemberData[] = [];
  
  // Procura títulos de nível 3: ### 01. Nome Completo ou ### Nome Completo
  const cardRegex = /###\s+(?:(\d+)\.\s*)?([^\n\r]+)([\s\S]*?)(?=(?:###\s+)|$)/g;
  let match: RegExpExecArray | null;

  while ((match = cardRegex.exec(content)) !== null) {
    const rawNumber = match[1];
    const rawName = match[2].trim().replace(/[*_]/g, '');
    const body = match[3];

    // Ignora se for título de seção como "### DADOS CADASTRAIS..."
    if (/dados cadastrais|tabela resumo|fichas cadastrais/i.test(rawName)) {
      continue;
    }

    const orderNumber = rawNumber ? parseInt(rawNumber, 10) : undefined;
    const cardData = parseSingleCardBody(body);

    // Mapeamento de ofício
    const oficioSource = cardData.oficio || cardData.cargo || '';
    const { funcao, cargo } = mapOficioToFuncaoCargo(oficioSource);

    // O nome do membro é mantido limpo (sem títulos prefixados),
    // enquanto o ofício/título fica armazenado em funcaoEclesiastica e cargo.
    const cleanMemberName = stripEcclesiasticalTitle(rawName);

    members.push({
      orderNumber,
      name: cleanMemberName,
      cargo: cardData.cargoEclesiasticoExtra || cargo,
      funcaoEclesiastica: funcao,
      situacao: cardData.situacao || 'Em Plena Comunhão',
      contato: cardData.contato,
      email: cardData.email,
      endereco: cardData.endereco,
      cpf: cardData.cpf,
      rg: cardData.rg,
      nascimento: cardData.nascimento,
      estadoCivil: cardData.estadoCivil,
      naturalidade: cardData.naturalidade,
      tipoSanguineo: cardData.tipoSanguineo,
      filiacaoMae: cardData.filiacaoMae,
      filiacaoPai: cardData.filiacaoPai,
      dataBatismo: cardData.dataBatismo,
      dataProfissaoFe: cardData.dataProfissaoFe,
      observacoes: cardData.observacoes,
    });
  }

  return members;
}

function parseSingleCardBody(body: string) {
  const data: {
    oficio?: string;
    situacao?: SituacaoMembro;
    cargo?: string;
    cargoEclesiasticoExtra?: string;
    contato?: string;
    email?: string;
    endereco?: string;
    cpf?: string;
    rg?: string;
    nascimento?: string;
    estadoCivil?: EstadoCivil | string;
    naturalidade?: string;
    tipoSanguineo?: string;
    filiacaoMae?: string;
    filiacaoPai?: string;
    dataBatismo?: string;
    dataProfissaoFe?: string;
    observacoes?: string;
  } = {};

  const lines = body.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('-')) continue;

    // Padrão: - **Campo:** Valor
    const fieldMatch = trimmed.match(/^-\s*\*\*([^:]+):\*\*\s*(.*)$/);
    if (!fieldMatch) continue;

    const label = fieldMatch[1].trim().toLowerCase();
    const value = fieldMatch[2].trim();

    if (/of[íi]cio|situa[çc]/i.test(label)) {
      // Ex: Irmão | Ativo ou Presbítero | Ativo
      if (value.includes('|')) {
        const parts = value.split('|').map(p => p.trim());
        data.oficio = parts[0];
        data.situacao = mapSituacao(parts[1]);
      } else {
        data.oficio = value;
      }
    } else if (/nasc/i.test(label)) {
      data.nascimento = parseDateToISO(value);
    } else if (/nacionalidade|naturalidade/i.test(label)) {
      // Ex: Brasileiro | Fortaleza - CE ou Boa Vista - RR
      if (value.includes('|')) {
        const parts = value.split('|').map(p => p.trim());
        data.naturalidade = parts[1] || parts[0];
      } else {
        const clean = value.replace(/brasileir[oa]/i, '').replace(/^[|\s-]+/, '').trim();
        if (clean) data.naturalidade = clean;
      }
    } else if (/estado civil/i.test(label)) {
      data.estadoCivil = mapEstadoCivil(value);
    } else if (/documentos/i.test(label)) {
      // Ex: RG 5886970 | CPF 003.004.873-71 ou RG 3102360 | CPF 904.243.281-** *(consta 904243281)*
      const rgMatch = value.match(/RG\s+([A-Za-z0-9.\-\/]+)/i);
      if (rgMatch) data.rg = rgMatch[1].trim();

      // Procura por CPF com máscara ou número em anotação
      const cpfNoteMatch = value.match(/consta\s+(\d{9,11})/i);
      if (cpfNoteMatch) {
        data.cpf = formatCpf(cpfNoteMatch[1]);
      } else {
        const cpfMatch = value.match(/CPF\s+([0-9.\-*]+)/i);
        if (cpfMatch) {
          const rawCpf = cpfMatch[1].trim();
          data.cpf = sanitizeValue(rawCpf);
        }
      }
    } else if (/filia[çc]/i.test(label)) {
      // Ex: Valdenice Gomes Lima da Silva & Raimundo Batista da Silva
      if (value.includes('&')) {
        const parts = value.split('&').map(p => p.trim());
        data.filiacaoMae = sanitizeFiliacao(parts[0]);
        data.filiacaoPai = sanitizeFiliacao(parts[1]);
      } else if (!/não informad|não consta|desconhecid/i.test(value)) {
        data.filiacaoMae = value;
      }
    } else if (/endere[çc]o/i.test(label)) {
      data.endereco = sanitizeValue(value);
    } else if (/contato|celular|telefone/i.test(label)) {
      data.contato = sanitizeValue(value);
    } else if (/e-?mail/i.test(label)) {
      data.email = sanitizeEmail(value);
    } else if (/dados eclesi[áa]sticos/i.test(label)) {
      // Ex: Batismo em 26/12/2003 | Profissão de Fé em 26/12/2003
      // ou Presbítero / Tesoureiro do Conselho
      const batismoMatch = value.match(/batismo\s+em\s+(\d{1,2}[/.-]\d{1,2}[/.-]\d{4})/i);
      if (batismoMatch) {
        data.dataBatismo = parseDateToISO(batismoMatch[1]);
      }

      const profMatch = value.match(/profissão\s+de\s+f[ée]\s+em\s+(\d{1,2}[/.-]\d{1,2}[/.-]\d{4})/i);
      if (profMatch) {
        data.dataProfissaoFe = parseDateToISO(profMatch[1]);
      }

      if (/tesoureir[oa]/i.test(value)) {
        data.cargoEclesiasticoExtra = 'Tesoureiro';
      } else if (/secret[áa]ri[oa]/i.test(value)) {
        data.cargoEclesiasticoExtra = 'Secretário';
      } else if (/presidente/i.test(value)) {
        data.cargoEclesiasticoExtra = 'Presidente';
      }
    } else if (/tipo sangu[íi]neo/i.test(label)) {
      data.tipoSanguineo = sanitizeTipoSanguineo(value);
    } else if (/observa[çc]/i.test(label)) {
      data.observacoes = value;
    }
  }

  return data;
}

/**
 * Mapeia funções eclesiásticas e cargos padrão.
 */
function mapOficioToFuncaoCargo(rawOficio: string): { funcao: FuncaoEclesiastica; cargo: string } {
  const o = rawOficio.toLowerCase().trim();

  if (o.includes('presb')) {
    return { funcao: 'Presbítero', cargo: 'Presbítero' };
  }
  if (o.includes('diác') || o.includes('diac')) {
    const isDisp = o.includes('disp');
    return {
      funcao: 'Diácono',
      cargo: isDisp ? 'Diácono em disponibilidade' : 'Diácono'
    };
  }
  if (o.includes('pastor') || o.includes('rev')) {
    return { funcao: 'Pastor', cargo: 'Pastor' };
  }
  if (o.includes('irm') || o.includes('comungante')) {
    return { funcao: 'Membro Comungante', cargo: 'Membro' };
  }

  return { funcao: 'Membro Comungante', cargo: rawOficio || 'Membro' };
}

function mapSituacao(raw?: string | null): SituacaoMembro {
  if (!raw) return 'Em Plena Comunhão';
  const s = raw.toLowerCase();
  if (s.includes('ativo') || s.includes('comunh') || s.includes('plena')) {
    return 'Em Plena Comunhão';
  }
  if (s.includes('disciplina')) {
    return 'Sob Disciplina';
  }
  if (s.includes('não comungante')) {
    return 'Não Comungante';
  }
  if (s.includes('transfer')) {
    return 'Transferido';
  }
  return 'Em Plena Comunhão';
}

function mapEstadoCivil(raw?: string | null): EstadoCivil | string | undefined {
  if (!raw) return undefined;
  const clean = raw.trim();
  if (/não informad|não consta|sem registro/i.test(clean)) {
    return undefined;
  }

  // Se inicia com o termo exato:
  if (/^casad/i.test(clean)) return 'Casado';
  if (/^solteir/i.test(clean)) return 'Solteiro';
  if (/^divorci/i.test(clean)) return 'Divorciado';
  if (/^vi[úu]v/i.test(clean)) return 'Viúvo';

  const s = clean.toLowerCase();
  if (s.includes('casad')) return 'Casado';
  if (s.includes('solteir')) return 'Solteiro';
  if (s.includes('divorci')) return 'Divorciado';
  if (s.includes('viúv') || s.includes('viuv')) return 'Viúvo';
  return clean;
}

function sanitizeValue(val?: string | null): string | undefined {
  if (!val) return undefined;
  const clean = val.replace(/[*_]/g, '').trim();
  if (!clean || clean === '—' || clean === '-' || /não informad|sem registro|não consta/i.test(clean)) {
    return undefined;
  }
  return clean;
}

function sanitizeEmail(val?: string | null): string | undefined {
  const clean = sanitizeValue(val);
  if (!clean) return undefined;
  // Se contiver múltiplos e-mails separados por /, pega o primeiro ou normaliza
  if (clean.includes('/')) {
    return clean.split('/')[0].trim();
  }
  return clean;
}

function sanitizeTipoSanguineo(val?: string | null): string | undefined {
  if (!val) return undefined;
  const clean = val.replace(/[*_]/g, '').trim();
  if (clean === '—' || clean === '-' || /não informad|sem registro/i.test(clean)) {
    return undefined;
  }
  const match = clean.match(/^(A|B|AB|O)[+-]$/i);
  return match ? match[0].toUpperCase() : clean;
}

function sanitizeFiliacao(name?: string | null): string | undefined {
  if (!name) return undefined;
  const clean = name.replace(/[*_]/g, '').trim();
  if (/não consta|desconhecido|não informado/i.test(clean)) {
    return undefined;
  }
  return clean;
}

function formatCpf(digits: string): string {
  const clean = digits.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  }
  return clean;
}

/**
 * Serializa os membros do sistema de volta para um documento Markdown
 * seguindo com perfeição as especificações da UPH (Tabela Resumo + Fichas Detalhadas).
 */
export function exportMembersToMarkdown(
  members: Member[],
  options?: {
    churchName?: string;
    societyName?: string;
    year?: number;
  }
): string {
  const church = options?.churchName || 'TERCEIRA IGREJA PRESBITERIANA DE BOA VISTA';
  const society = options?.societyName || 'UNIÃO PRESBITERIANA DE HOMENS (UPH)';
  const year = options?.year || new Date().getFullYear();

  let md = `# ${church}\n`;
  md += `## ${society}\n`;
  md += `### DADOS CADASTRAIS DOS MEMBROS DO ROL ATIVO (${year})\n\n`;

  md += `> **Documento gerado a partir do Rol de Membros Digital do Sistema.**\n`;
  md += `> Total de membros registrados: ${members.length}.\n\n`;
  md += `---\n\n`;

  // Seção 1: Tabela Resumo
  md += `## 1. Tabela Resumo dos Membros da UPH\n\n`;
  md += `| Nº | Nome Completo | Ofício / Título | Nascimento | Contato / Celular | E-mail | Tipo Sang. | Situação |\n`;
  md += `| :---: | :--- | :---: | :---: | :--- | :--- | :---: | :---: |\n`;

  members.forEach((m, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const oficio = m.cargo || m.funcaoEclesiastica || 'Irmão';
    const cleanName = stripEcclesiasticalTitle(m.name);
    const nasc = formatISOToDateBR(m.nascimento);
    const contato = m.contato || '—';
    const email = m.email || '—';
    const sang = m.tipoSanguineo || '—';
    const sit = m.situacao === 'Em Plena Comunhão' ? 'Ativo' : (m.situacao || 'Ativo');

    md += `| **${num}** | ${cleanName} | ${oficio} | ${nasc} | ${contato} | ${email} | ${sang} | ${sit} |\n`;
  });

  md += `\n---\n\n`;

  // Seção 2: Fichas Cadastrais Detalhadas
  md += `## 2. Fichas Cadastrais Detalhadas\n\n`;

  members.forEach((m, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const cleanName = stripEcclesiasticalTitle(m.name);
    const oficio = m.cargo || m.funcaoEclesiastica || 'Irmão';
    const sit = m.situacao === 'Em Plena Comunhão' ? 'Ativo' : (m.situacao || 'Ativo');
    const nasc = formatISOToDateBR(m.nascimento);
    const naturalidade = m.naturalidade ? `Brasileiro | ${m.naturalidade}` : 'Brasileiro';
    const estadoCivil = m.estadoCivil || 'Não informado';
    
    // Documentos
    const docParts: string[] = [];
    if (m.rg) docParts.push(`RG ${m.rg}`);
    if (m.cpf) docParts.push(`CPF ${m.cpf}`);
    const docs = docParts.length > 0 ? docParts.join(' | ') : 'Não informados no formulário';

    // Filiação
    let filiacao = 'Não informada no formulário';
    if (m.filiacaoMae || m.filiacaoPai) {
      const mae = m.filiacaoMae || 'Não consta';
      const pai = m.filiacaoPai || 'Não consta';
      filiacao = `${mae} & ${pai}`;
    }

    // Dados Eclesiásticos
    const eclParts: string[] = [];
    if (m.dataBatismo) eclParts.push(`Batismo em ${formatISOToDateBR(m.dataBatismo)}`);
    if (m.dataProfissaoFe) eclParts.push(`Profissão de Fé em ${formatISOToDateBR(m.dataProfissaoFe)}`);
    if (eclParts.length === 0) {
      eclParts.push(`Membro Comungante (${m.funcaoEclesiastica || 'Ativo'})`);
    }
    const dadosEcl = eclParts.join(' | ');

    md += `### ${num}. ${cleanName}\n`;
    md += `- **Ofício / Situação na UPH:** ${oficio} | ${sit}\n`;
    md += `- **Data de Nascimento:** ${nasc}\n`;
    md += `- **Gênero:** Masculino\n`;
    md += `- **Nacionalidade / Naturalidade:** ${naturalidade}\n`;
    md += `- **Estado Civil:** ${estadoCivil}\n`;
    md += `- **Documentos:** ${docs}\n`;
    md += `- **Filiação:** ${filiacao}\n`;
    md += `- **Endereço:** ${m.endereco || 'Não informado'}\n`;
    md += `- **Contato:** ${m.contato || 'Não informado'}\n`;
    md += `- **E-mail:** ${m.email || 'Não informado'}\n`;
    md += `- **Dados Eclesiásticos:** ${dadosEcl}\n`;
    md += `- **Tipo Sanguíneo:** ${m.tipoSanguineo || 'Não informado'}\n`;
    md += `\n---\n\n`;
  });

  return md;
}

/**
 * Modelo oficial de exemplo e template em branco para preenchimento.
 */
export const OFFICIAL_TEMPLATE_MARKDOWN = `# TERCEIRA IGREJA PRESBITERIANA DE BOA VISTA
## UNIÃO PRESBITERIANA DE HOMENS (UPH)
### DADOS CADASTRAIS DOS MEMBROS DO ROL ATIVO (2026)

---

## 1. Tabela Resumo dos Membros da UPH

| Nº | Nome Completo | Ofício / Título | Nascimento | Contato / Celular | E-mail | Tipo Sang. | Situação |
| :---: | :--- | :---: | :---: | :--- | :--- | :---: | :---: |
| **01** | Exemplo da Silva Santos | Irmão | 01/01/1990 | (95) 99999-9999 | exemplo@gmail.com | O+ | Ativo |

---

## 2. Fichas Cadastrais Detalhadas

### 01. Exemplo da Silva Santos
- **Ofício / Situação na UPH:** Irmão | Ativo
- **Data de Nascimento:** 01/01/1990
- **Gênero:** Masculino
- **Nacionalidade / Naturalidade:** Brasileiro | Boa Vista - RR
- **Estado Civil:** Casado
- **Documentos:** RG 123456 | CPF 000.000.000-00
- **Filiação:** Nome da Mãe & Nome do Pai
- **Endereço:** Rua Exemplo, 123, Bairro, CEP 69300-000
- **Contato:** (95) 99999-9999
- **E-mail:** exemplo@gmail.com
- **Dados Eclesiásticos:** Batismo em 01/01/2010 | Profissão de Fé em 01/01/2010
- **Tipo Sanguíneo:** O+
`;
