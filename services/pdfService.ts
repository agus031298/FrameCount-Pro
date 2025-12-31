import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Shot, PdfConfig, PricingRule } from '../types';
import { formatCurrency } from '../utils/format';

export const generateInvoicePDF = (shots: Shot[], config: PdfConfig, tiers: PricingRule[]) => {
  const doc = new jsPDF();
  
  // --- HEADER ---
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(config.title, 14, 20);

  // Sub-header Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
  doc.text(`Artist: ${config.artistName || '-'}`, 14, 33);
  doc.text(`ID Laporan: #${config.reportId}`, 14, 38);

  // Summary Calc
  const totalFrames = shots.reduce((acc, shot) => acc + shot.frames, 0);
  const totalPrice = shots.reduce((acc, shot) => acc + shot.price, 0);

  // --- MAIN TABLE (SHOTS) ---
  const tableHead = [['No', 'Nama Shot', 'Jumlah Frame', 'Harga (IDR)']];
  const tableBody = shots.map((shot, index) => [
    index + 1,
    shot.name,
    shot.frames,
    formatCurrency(shot.price),
  ]);

  autoTable(doc, {
    startY: 45,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] }, // Blue-600
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // --- FOOTER TOTAL ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Frame: ${totalFrames}`, 14, finalY);
  doc.text(`Total Estimasi: ${formatCurrency(totalPrice)}`, 14, finalY + 7);

  finalY += 20;

  // --- PRICING LEGEND (KETERANGAN HARGA) ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("Keterangan Kategori Harga:", 14, finalY);

  const legendBody = tiers.map(tier => [
    tier.label,
    `${tier.min} - ${tier.max > 90000 ? '∞' : tier.max} frames`,
    formatCurrency(tier.price)
  ]);

  autoTable(doc, {
    startY: finalY + 2,
    head: [['Kategori', 'Range Frame', 'Harga Satuan']],
    body: legendBody,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1 },
    headStyles: { fillColor: [240, 240, 240], textColor: 50, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
    }
  });

  // --- NOTES ---
  // @ts-ignore
  finalY = doc.lastAutoTable.finalY + 10;
  
  if (config.notes) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    const splitNotes = doc.splitTextToSize(`Catatan: ${config.notes}`, 180);
    doc.text(splitNotes, 14, finalY);
  }

  // Save
  doc.save(`${config.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};