import { Role, Vote } from '../types';

export const ROLE_NAMES: Record<Role, string> = {
  [Role.PRESIDENT]: 'Presidente',
  [Role.VICE]: 'Vice-Presidente',
  [Role.SECRETARY_1]: '1º Secretário(a)',
  [Role.SECRETARY_2]: '2º Secretário(a)',
  [Role.TREASURER]: 'Tesoureiro(a)',
};

export const ROLES_LIST: Role[] = [
  Role.PRESIDENT,
  Role.VICE,
  Role.SECRETARY_1,
  Role.SECRETARY_2,
  Role.TREASURER
];

/**
 * Calcula os IDs dos membros já eleitos para cargos anteriores,
 * evitando que apareçam como elegíveis para novos cargos.
 */
export function getElectedMemberIds(
  votes: Vote[],
  presentCount: number,
  currentRole: Role,
  manualWinners?: Partial<Record<Role, { memberId: string }>>,
  officialWinners?: Partial<Record<Role, { memberId: string }>>
): string[] {
  const electedIds: string[] = [];
  const majorityRequired = Math.floor(presentCount / 2) + 1;

  ROLES_LIST.forEach((r) => {
    // Não exclui o cargo ativo atual enquanto a confirmação estiver em andamento
    if (r === currentRole) return;

    // 1. Prioridade: Vencedor oficialmente homologado pela mesa diretora
    if (officialWinners && officialWinners[r]?.memberId) {
      electedIds.push(officialWinners[r]!.memberId);
      return;
    }

    // 2. Vencedor manual / aclamação
    if (manualWinners && manualWinners[r]?.memberId) {
      electedIds.push(manualWinners[r]!.memberId);
      return;
    }

    // 3. Verifica se houve vencedor via votos
    if (!votes || votes.length === 0) return;
    for (let ballotNum = 1; ballotNum <= 3; ballotNum++) {
      const ballotVotes = votes.filter(v => v.role === r && v.ballotNumber === ballotNum);
      const voteCounts: Record<string, number> = {};
      ballotVotes.forEach((v) => {
        voteCounts[v.candidateId] = (voteCounts[v.candidateId] || 0) + 1;
      });

      const sorted = Object.entries(voteCounts).sort(([, a], [, b]) => b - a);
      if (sorted.length === 0) continue;

      if (ballotNum < 3) {
        // 1º e 2º escrutínio: maioria absoluta
        if (sorted[0][1] >= majorityRequired) {
          electedIds.push(sorted[0][0]);
          break;
        }
      } else {
        // 3º escrutínio: maioria simples (maior número de votos entre os concorrentes)
        if (sorted[0][1] > 0 && (!sorted[1] || sorted[0][1] > sorted[1][1])) {
          electedIds.push(sorted[0][0]);
          break;
        }
      }
    }
  });

  return Array.from(new Set(electedIds));
}

/**
 * Obtém o resumo dos candidatos eleitos por cargo (seja por aclamação ou apuração).
 */
export interface ElectedRoleResult {
  role: Role;
  roleName: string;
  memberId: string;
  ballotNumber?: number;
  isAcclamation?: boolean;
}

export function getAllElectedResults(
  votes: Vote[],
  presentCount: number,
  manualWinners?: Partial<Record<Role, { memberId: string }>>
): ElectedRoleResult[] {
  const results: ElectedRoleResult[] = [];
  const majorityRequired = Math.floor(presentCount / 2) + 1;

  ROLES_LIST.forEach((r) => {
    // 1. Aclamação / Manual
    if (manualWinners && manualWinners[r]?.memberId) {
      results.push({
        role: r,
        roleName: ROLE_NAMES[r],
        memberId: manualWinners[r]!.memberId,
        isAcclamation: true,
      });
      return;
    }

    // 2. Votos
    if (!votes || votes.length === 0) return;
    for (let ballotNum = 1; ballotNum <= 3; ballotNum++) {
      const ballotVotes = votes.filter(v => v.role === r && v.ballotNumber === ballotNum);
      const voteCounts: Record<string, number> = {};
      ballotVotes.forEach((v) => {
        voteCounts[v.candidateId] = (voteCounts[v.candidateId] || 0) + 1;
      });

      const sorted = Object.entries(voteCounts).sort(([, a], [, b]) => b - a);
      if (sorted.length === 0) continue;

      if (ballotNum < 3) {
        if (sorted[0][1] >= majorityRequired) {
          results.push({
            role: r,
            roleName: ROLE_NAMES[r],
            memberId: sorted[0][0],
            ballotNumber: ballotNum,
          });
          break;
        }
      } else {
        // 3º escrutínio: maioria simples (maior voto que o 2º)
        if (sorted[0][1] > 0 && (!sorted[1] || sorted[0][1] > sorted[1][1])) {
          results.push({
            role: r,
            roleName: ROLE_NAMES[r],
            memberId: sorted[0][0],
            ballotNumber: 3,
          });
          break;
        }
      }
    }
  });

  return results;
}
