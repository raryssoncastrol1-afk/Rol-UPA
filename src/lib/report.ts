import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AttendanceSession } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateReport(session: AttendanceSession) {
  const doc = new jsPDF();
  const dateStr = format(session.date, "dd/MM/yyyy HH:mm");
  const fullDateStr = format(session.date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Indigo-600
  doc.text('UPH - Relatório de Frequência', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  const typeLabel = session.type === 'plenaria' 
    ? `Plenária (${session.callNumber || 1}ª Chamada)` 
    : 'Programação';
  doc.text(`Modalidade: ${typeLabel} | Gerado em: ${fullDateStr}`, 14, 30);

  // Stats
  const presentCount = session.records.filter(r => r.status === 'presente').length;
  const absentCount = session.records.filter(r => r.status === 'ausente').length;
  const justifiedCount = session.records.filter(r => r.status === 'falta_justificada').length;

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(`Total de Membros: ${session.records.length}`, 14, 45);
  doc.text(`Presentes: ${presentCount}`, 14, 52);
  doc.text(`Ausentes: ${absentCount}`, 14, 59);
  doc.text(`Justificados: ${justifiedCount}`, 14, 66);

  // Table
  const tableData = session.records.map(r => [
    r.memberName,
    r.status.replace('presente', 'Presente').replace('ausente', 'Ausente').replace('falta_justificada', 'Justificada'),
    r.justification || '-'
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['Nome do Membro', 'Status', 'Observação/Justificativa']],
    body: tableData,
    headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 75 },
    styles: { font: 'helvetica', fontSize: 10 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(
      `Página ${i} de ${pageCount} - UPH Rol System`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`relatorio_chamada_${format(session.date, 'yyyy-MM-dd_HHmm')}.pdf`);
}
