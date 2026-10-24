import React, { useRef } from 'react';
import { Member, Role, Vote, Election } from '../../types';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Trophy, 
  Users, 
  Percent, 
  Calendar, 
  FileText,
  Bookmark,
  Share2
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import { formatMemberNameWithTitle } from '../../lib/memberUtils';

interface ElectionReportModalProps {
  election: Election;
  members: Member[];
  onClose: () => void;
}

const ROLE_LABELS: Record<Role, string> = {
  [Role.PRESIDENT]: 'Presidente',
  [Role.VICE]: 'Vice-Presidente',
  [Role.SECRETARY_1]: '1º Secretário(a)',
  [Role.SECRETARY_2]: '2º Secretário(a)',
  [Role.TREASURER]: 'Tesoureiro(a)',
};

const ROLES_ORDER = [Role.PRESIDENT, Role.VICE, Role.SECRETARY_1, Role.SECRETARY_2, Role.TREASURER];

export const ElectionReportModal: React.FC<ElectionReportModalProps> = ({
  election,
  members,
  onClose,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Stats calculation
  const presentCount = Number(election.presentCount) || 0;
  const majorityRequired = Math.floor(presentCount / 2) + 1;

  // Compile results for each role
  const roleResults = ROLES_ORDER.map((role) => {
    const roleVotes = election.votes.filter((v) => v.role === role);
    
    // Find absolute winner if any (ou por deliberação manual / aclamação)
    let winnerId: string | null = null;
    let victoryBallot: number | null = null;
    let manualReason: string | null = null;

    if (election.manualWinners?.[role]) {
      winnerId = election.manualWinners[role]!.memberId;
      manualReason = election.manualWinners[role]!.detail || 'Homologado por aclamação/deliberação da mesa';
    } else {
      // Identify election result through ballots
      for (const b of [1, 2, 3]) {
        const ballotVotes = roleVotes.filter((v) => v.ballotNumber === b);
        if (ballotVotes.length === 0) continue;

        const counts: Record<string, number> = {};
        ballotVotes.forEach((v) => {
          counts[v.candidateId] = (counts[v.candidateId] || 0) + 1;
        });

        if (b === 3) {
          // No 3º escrutínio, a eleição é decidida por maioria relativa
          const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
          if (sorted.length > 0 && (sorted.length === 1 || sorted[0][1] > sorted[1][1])) {
            winnerId = sorted[0][0];
            victoryBallot = 3;
            break;
          }
        } else {
          const absoluteWinner = Object.entries(counts).find(
            ([, count]) => count >= majorityRequired
          );

          if (absoluteWinner) {
            winnerId = absoluteWinner[0];
            victoryBallot = b;
            break; // absolute winner found
          }
        }
      }
    }

    const winnerMember = winnerId ? members.find((m) => m.id === winnerId) : null;

    // All distinct members who received votes in any ballot for this role
    const candidateIds = Array.from(
      new Set(roleVotes.map((v) => v.candidateId))
    );

    // Ballots executed
    const executedBallots = [1, 2, 3].filter((b) =>
      roleVotes.some((v) => v.ballotNumber === b)
    );

    // Separate winner from runner-ups
    const nonElectedList = candidateIds
      .filter((id) => id !== winnerId)
      .map((id) => {
        const candidate = members.find((m) => m.id === id);
        
        // Ballot-wise vote details
        const ballotVotes = executedBallots.map((ballotNum) => {
          const votesCount = roleVotes.filter(
            (v) => v.ballotNumber === ballotNum && v.candidateId === id
          ).length;
          return { ballotNum, votesCount };
        });

        return {
          id,
          name: candidate ? formatMemberNameWithTitle(candidate) : 'Membro Não Localizado',
          ballotVotes,
        };
      })
      // Sort non-elected by votes in the last executed ballot descending
      .sort((a, b) => {
        const lastBallot = executedBallots[executedBallots.length - 1];
        if (!lastBallot) return 0;
        const aLastVotes = a.ballotVotes.find((v) => v.ballotNum === lastBallot)?.votesCount || 0;
        const bLastVotes = b.ballotVotes.find((v) => v.ballotNum === lastBallot)?.votesCount || 0;
        return bLastVotes - aLastVotes;
      });

    // Winner details
    const winnerDetails = winnerMember ? {
      id: winnerId!,
      name: formatMemberNameWithTitle(winnerMember),
      victoryBallot: victoryBallot,
      manualReason: manualReason,
      ballotVotes: executedBallots.map((ballotNum) => {
        const votesCount = roleVotes.filter(
          (v) => v.ballotNumber === ballotNum && v.candidateId === winnerId
        ).length;
        return { ballotNum, votesCount };
      }),
    } : null;

    return {
      role,
      label: ROLE_LABELS[role],
      executedBallots,
      winnerDetails,
      nonElectedList,
      hasVotes: roleVotes.length > 0 || !!manualReason,
      manualReason,
    };
  });

  // Handle printing and PDF creation
  const handlePrint = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let y = 20;
      const margin = 20;
      const pageWidth = 210;
      const pageHeight = 297;
      const contentWidth = pageWidth - (margin * 2);

      const checkPageOverflow = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin - 15) {
          doc.addPage();
          y = margin;
          drawHeaderMini();
        }
      };

      const drawHeaderMini = () => {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Relatório de Eleição: ${election.name}`, margin, margin - 10);
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.2);
        doc.line(margin, margin - 8, margin + contentWidth, margin - 8);
        y = margin;
      };

      // 1. MAIN TITLE
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(0, 51, 0); // #003300 theme green
      doc.text('UNIÃO PRESBITERIANA DE HOMENS', pageWidth / 2, y, { align: 'center' });
      y += 7;

      doc.setFontSize(13);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('RELATÓRIO OFICIAL DE ELEIÇÃO', pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Info card container
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setLineWidth(0.3);
      doc.rect(margin, y, contentWidth, 24, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(`Processo Eleitoral: ${election.name}`, margin + 5, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      
      const formattedDate = new Date().toLocaleDateString('pt-BR');
      const formattedTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      doc.text(`Data de Emissão: ${formattedDate} às ${formattedTime}`, margin + 5, y + 11);
      doc.text(`Quórum Exigido: ${majorityRequired} votos (Maioria Absoluta)`, margin + 5, y + 16);
      doc.text(`Sócios Presentes: ${presentCount} eleitores habilitados`, margin + 5, y + 21);

      y += 32;

      // 2. BREAKDOWN BY ROLES
      roleResults.forEach((res) => {
        checkPageOverflow(45);

        // Underline/title divider
        doc.setDrawColor(15, 23, 42); // slate-900 line
        doc.setLineWidth(0.4);
        doc.line(margin, y, margin + contentWidth, y);
        
        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`CARGO: ${res.label.toUpperCase()}`, margin, y);
        y += 5;

        if (!res.hasVotes) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text('Nenhuma votação registrada para este cargo.', margin + 4, y);
          y += 8;
          return;
        }

        // Winner block
        if (res.winnerDetails) {
          checkPageOverflow(28);
          
          doc.setDrawColor(16, 185, 129); // green-500
          doc.setFillColor(240, 253, 250); // emerald-50
          doc.setLineWidth(0.3);
          doc.rect(margin, y, contentWidth, 24, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(4, 120, 87); // emerald-700
          doc.text(`ELEITO(A): ${res.winnerDetails.name.toUpperCase()}`, margin + 5, y + 6);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(6, 95, 70); // emerald-800
          const victoryType = res.winnerDetails.victoryBallot === 3
            ? 'maioria relativa'
            : 'quórum regulamentar de maioria absoluta';
          doc.text(`Eleito(a) no ${res.winnerDetails.victoryBallot}º Escrutínio por ${victoryType}.`, margin + 5, y + 11);

          const ballotTexts = res.winnerDetails.ballotVotes.map((bv) => {
            const pt = presentCount > 0 ? ((bv.votesCount / presentCount) * 100).toFixed(1) : '0';
            return `${bv.ballotNum}º Escrutínio: ${bv.votesCount} votos (${pt}%)`;
          }).join('  |  ');
          
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(5, 150, 105); // emerald-600
          doc.text(`Desempenho obtido: ${ballotTexts}`, margin + 5, y + 18);
          y += 28;
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(180, 83, 9); // amber-700
          doc.text('Nenhum candidato alcançou a votação regulamentar necessária para este cargo.', margin + 4, y);
          y += 8;
        }

        // Other Candidates block
        if (res.nonElectedList.length > 0) {
          checkPageOverflow(15 + (res.nonElectedList.length * 6));
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105); // slate-600
          doc.text('VOTAÇÃO DOS DEMAIS CANDIDATOS (NÃO ELEITOS):', margin + 2, y);
          y += 5;

          res.nonElectedList.forEach((cand) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59); // slate-800
            doc.text(`• ${cand.name}`, margin + 4, y);

            const votBreakdown = cand.ballotVotes.map((bv) => {
              return `${bv.ballotNum}º Escrutínio: ${bv.votesCount} votos`;
            }).join('  |  ');

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8.5);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(`[ ${votBreakdown} ]`, margin + contentWidth - 2, y, { align: 'right' });
            y += 6;
          });

          y += 3;
        }
      });

      // 3. SIGNATURE LINES
      checkPageOverflow(40);
      y += 15;

      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.35);

      const leftLineStart = margin + 10;
      const leftLineEnd = margin + 65;
      doc.line(leftLineStart, y, leftLineEnd, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('PRESIDENTE DA MESA', (leftLineStart + leftLineEnd) / 2, y + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Assinatura', (leftLineStart + leftLineEnd) / 2, y + 8, { align: 'center' });

      const rightLineStart = margin + contentWidth - 65;
      const rightLineEnd = margin + contentWidth - 10;
      doc.line(rightLineStart, y, rightLineEnd, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('SECRETÁRIO DA MESA', (rightLineStart + rightLineEnd) / 2, y + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Assinatura', (rightLineStart + rightLineEnd) / 2, y + 8, { align: 'center' });

      y += 18;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('Documento gerado digitalmente pelo Sistema de Eleições UPH.', pageWidth / 2, y, { align: 'center' });

      const safeTitle = election.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      doc.save(`relatorio-eleicao-${safeTitle}.pdf`);

    } catch (error) {
      console.error('Erro ao gerar relatório em PDF:', error);
      alert('Ocorreu um erro ao exportar o PDF. Iniciando impressão do navegador.');
      window.print();
    }
  };

  // Build plaintext summary for copy
  const handleCopyText = () => {
    let reportText = `📋 *RELATÓRIO OFICIAL DE ELEIÇÃO*\n`;
    reportText += `*Eleição:* ${election.name}\n`;
    reportText += `*Membros Presentes:* ${presentCount}\n`;
    reportText += `*Quórum de Vitória (Maioria Absoluta no 1º/2º escrutínio):* ${majorityRequired} votos\n`;
    reportText += `──────────────────────────\n\n`;

    roleResults.forEach((res) => {
      reportText += `👑 *CARGO: ${res.label.toUpperCase()}*\n`;
      if (!res.hasVotes) {
        reportText += `Nenhum voto registrado para este cargo.\n\n`;
        return;
      }

      if (res.winnerDetails) {
        const victoryType = res.winnerDetails.victoryBallot === 3 ? 'Maioria Relativa' : 'Maioria Absoluta';
        reportText += `✅ *ELEITO(A):* ${res.winnerDetails.name}\n`;
        reportText += `   Eleito(a) no ${res.winnerDetails.victoryBallot}º Escrutínio por ${victoryType}\n`;
        res.winnerDetails.ballotVotes.forEach((bv) => {
          const percentage = presentCount > 0 ? ((bv.votesCount / presentCount) * 100).toFixed(1) : '0.0';
          reportText += `   • ${bv.ballotNum}º Escrutínio: ${bv.votesCount} votos (${percentage}%)\n`;
        });
      } else {
        reportText += `❌ Nenhum candidato eleito para este cargo.\n`;
      }

      if (res.nonElectedList.length > 0) {
        reportText += `\n*Não Eleitos (Votações Obtidas):*\n`;
        res.nonElectedList.forEach((no) => {
          const ballotsSummary = no.ballotVotes
            .map((bv) => `${bv.ballotNum}º Escrutínio: ${bv.votesCount} votos`)
            .join(' | ');
          reportText += `   • ${no.name}: [ ${ballotsSummary} ]\n`;
        });
      }
      reportText += `\n──────────────────────────\n\n`;
    });

    reportText += `*Relatório gerado em:* ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Dynamic printer isolation styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 15mm 15mm 15mm 15mm;
            size: A4 portrait;
          }
          /* Hide standard viewport components */
          body * {
            visibility: hidden;
          }
          /* Remove constraints of containers strictly for printing */
          html, body, #root, div, section, main {
            position: static !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          /* Make report area fully active and printable */
          #print-report-area, #print-report-area * {
            visibility: visible !important;
          }
          #print-report-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
          .no-print {
            display: none !important;
          }
          /* Force colors, backgrounds and icons to stay highly visible matches original layout */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Keep flex grids stable in printing output */
          .grid {
            display: grid !important;
          }
          .grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .md\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .md\\:col-span-1 {
            grid-column: span 1 / span 1 !important;
          }
          .md\\:grid-cols-12 {
            grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
          }
          .md\\:col-span-6 {
            grid-column: span 6 / span 6 !important;
          }
          /* Prevent roles and widgets from breaking across page sheets */
          .space-y-10 > * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />

      <div className="bg-white dark:bg-[#0b1220] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-uph-green">
              <FileText className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Relatório da Eleição</h3>
              <p className="text-slate-400 text-xs font-medium">Resultados, apurações e escrutínios consolidados</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Modal Toolbar */}
        <div className="bg-slate-50 dark:bg-[#030712] border-b border-slate-100 dark:border-slate-800 px-6 py-3 flex flex-wrap gap-2 justify-between items-center no-print">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Ações do Documento</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-4 py-2 bg-white dark:bg-[#0b1220] text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:bg-[#030712] transition-colors flex items-center gap-1.5 shadow-sm shadow-slate-100"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  Copiar Relatório
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-uph-green hover:bg-uph-green-hover text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-950/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir Relatório
            </button>
          </div>
        </div>

        {/* Printable/Viewable Area */}
        <div 
          id="print-report-area" 
          ref={reportRef} 
          className="p-6 md:p-10 space-y-8 overflow-y-auto max-h-[70vh] flex-1 custom-scrollbar text-slate-800 dark:text-slate-100"
        >
          {/* Document Header */}
          <div className="text-center pb-8 border-b border-dashed border-slate-200 dark:border-slate-800">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans uppercase">
              Relatório de Eleição Oficial
            </h1>
            <h2 className="text-lg font-bold text-slate-600 dark:text-slate-300 font-sans mt-1">
              {election.name}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 max-w-xl mx-auto text-left">
              <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/50 text-center">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-0.5">Sócios Presentes</span>
                <span className="text-xl font-mono font-black text-slate-800 dark:text-slate-100">{presentCount}</span>
                <span className="text-[10px] text-slate-400 block font-medium">eleitores habilitados</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/50 text-center">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-0.5">Maioria Absoluta</span>
                <span className="text-xl font-mono font-black text-emerald-600">{majorityRequired}</span>
                <span className="text-[10px] text-slate-400 block font-medium">votos para eleição</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/50 text-center col-span-2 md:col-span-1">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-0.5">Data de Emissão</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block mt-1.5">{new Date().toLocaleDateString('pt-BR')}</span>
                <span className="text-[10px] text-slate-400 block font-medium">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Roles Breakdown */}
          <div className="space-y-10">
            {roleResults.map((res) => (
              <div key={res.role} className="space-y-4">
                <div className="flex items-center gap-3 border-b-2 border-slate-950/80 pb-2">
                  <Bookmark className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 print:hidden" />
                  <h3 className="text-base font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">
                    Cargo: {res.label}
                  </h3>
                </div>

                {!res.hasVotes ? (
                  <div className="p-4 bg-slate-50 dark:bg-[#030712] rounded-2xl border border-slate-100 dark:border-slate-800 text-center text-slate-400 text-xs font-semibold">
                    Nenhuma votação foi realizada ou iniciada para este cargo nesta sessão.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    {/* Elected Section - Highlighted */}
                    <div className="md:col-span-6 space-y-2">
                      <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block print:border print:border-green-600">
                        Eleito(a) Conforme Estatuto
                      </span>
                      {res.winnerDetails ? (
                        <div className="bg-emerald-50/40 p-5 rounded-2xl border-2 border-emerald-500/80 space-y-4">
                          <div className="flex items-start gap-3">
                            <Trophy className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-extrabold text-emerald-950 text-base">{res.winnerDetails.name}</h4>
                              {res.winnerDetails.manualReason ? (
                                <p className="text-amber-800 text-xs font-bold leading-tight mt-0.5">
                                  {res.winnerDetails.manualReason}
                                </p>
                              ) : (
                                <p className="text-emerald-700 text-xs font-bold leading-tight mt-0.5">
                                  Eleito(a) no {res.winnerDetails.victoryBallot}º Escrutínio por {res.winnerDetails.victoryBallot === 3 ? 'Maioria Relativa' : 'Maioria Absoluta'}.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 pt-2/6 border-t border-emerald-200/50">
                            <h5 className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-800">
                              Votos do Eleito por Escrutínio:
                            </h5>
                            <div className="space-y-1">
                              {res.winnerDetails.ballotVotes.map((bv) => {
                                const percentage = presentCount > 0 ? ((bv.votesCount / presentCount) * 100).toFixed(1) : '0.0';
                                return (
                                  <div key={bv.ballotNum} className="flex justify-between text-xs text-slate-700 dark:text-slate-200">
                                    <span className="font-semibold">{bv.ballotNum}º Escrutínio:</span>
                                    <span className="font-mono font-bold">
                                      {bv.votesCount} votos <span className="text-slate-400 font-normal">({percentage}%)</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50/50 p-5 rounded-2xl border-2 border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
                          Não houve candidato eleito por votação regulamentar neste cargo.
                        </div>
                      )}
                    </div>

                    {/* Non-Elected Section */}
                    <div className="md:col-span-6 space-y-2">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block">
                        Votação Demais Candidatos (Não Eleitos)
                      </span>
                      {res.nonElectedList.length === 0 ? (
                        <div className="p-4 bg-slate-50 dark:bg-[#030712] rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-semibold text-center mt-1">
                          Nenhum outro candidato recebeu votos.
                        </div>
                      ) : (
                        <div className="space-y-2 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-[#0b1220]/50 print:border-slate-300">
                          {res.nonElectedList.map((cand) => (
                            <div 
                              key={cand.id} 
                              className="pb-2.5 last:pb-0 border-b last:border-0 border-slate-100 dark:border-slate-800 text-xs space-y-1"
                            >
                              <div className="flex justify-between items-center font-bold text-slate-800 dark:text-slate-100">
                                <span className="truncate pr-2">{cand.name}</span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {cand.ballotVotes.map((bv) => (
                                  <span key={bv.ballotNum}>
                                    {bv.ballotNum}º Escrutínio: <strong className="font-mono font-black text-slate-700 dark:text-slate-200">{bv.votesCount} votos</strong>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Seção de Resoluções e Ocorrências da Mesa */}
          {election.overrideNotes && election.overrideNotes.length > 0 && (
            <div className="mt-10 pt-8 border-t-2 border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-600 shrink-0" />
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white font-sans">
                  Resoluções e Ocorrências Extraordinárias da Mesa
                </h4>
              </div>
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                {election.overrideNotes.map((note) => (
                  <div key={note.id} className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2 border-b border-amber-100 last:border-0 pb-2 last:pb-0">
                    <span className="text-[10px] text-amber-700 font-mono font-bold shrink-0 mt-0.5">
                      [{new Date(note.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}]
                    </span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">{ROLE_LABELS[note.role]}:</strong> {note.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Signature Field */}
          <div className="pt-16 mt-16 border-t border-dashed border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="text-center space-y-1">
                <div className="h-0.5 bg-slate-300 w-full mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Presidente da Mesa</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 block">Assinatura</span>
              </div>
              <div className="text-center space-y-1">
                <div className="h-0.5 bg-slate-300 w-full mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Secretário da Mesa</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 block">Assinatura</span>
              </div>
            </div>
            <div className="text-center text-[10px] text-slate-300 mt-12 font-medium">
              Documento gerado eletronicamente pelo Sistema de Eleições UPH. Todos os direitos reservados.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
