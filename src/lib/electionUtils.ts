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
  currentRole: Role
): string[] {
  if (!votes || votes.length === 0) return [];
  const electedIds: string[] = [];
  const majorityRequired = Math.floor(presentCount / 2) + 1;

  ROLES_LIST.forEach((r) => {
    // Não exclui o cargo ativo atual enquanto a confirmação estiver em andamento
    if (r === currentRole) return;

    for (let ballotNum = 1; ballotNum <= 3; ballotNum++) {
      const ballotVotes = votes.filter(v => v.role === r && v.ballotNumber === ballotNum);
      const voteCounts: Record<string, number> = {};
      ballotVotes.forEach((v) => {
        voteCounts[v.candidateId] = (voteCounts[v.candidateId] || 0) + 1;
      });
      const winnerId = Object.entries(voteCounts).find(([, count]) => count >= majorityRequired)?.[0];
      if (winnerId) {
        electedIds.push(winnerId);
        break;
      }
    }
  });

  return electedIds;
}

/**
 * Totaliza a contagem de votos de um escrutínio específico.
 */
export function countBallotVotes(
  votes: Vote[],
  role: Role,
  ballotNumber: number
): Record<string, number> {
  const ballotVotes = votes.filter(v => v.role === role && v.ballotNumber === ballotNumber);
  const voteCounts: Record<string, number> = {};
  for (const v of ballotVotes) {
    voteCounts[v.candidateId] = (voteCounts[v.candidateId] || 0) + 1;
  }
  return voteCounts;
}
