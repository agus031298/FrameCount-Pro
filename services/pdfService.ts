import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Shot, PdfConfig, PricingRule } from '../types';
import { formatCurrency } from '../utils/format';

export const generateInvoicePDF = (shots: Shot[], config: PdfConfig, tiers: PricingRule[]) => {
  const doc = new jsPDF();
  
  // Font configuration
  doc.setFont('helvetica');

  // --- HEADER (First Page Only) ---
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  
  // Combine Title and Period
  const fullTitle = config.periodMonth 
    ? `${config.title || 'ESTIMASI BIAYA'} - ${config.periodMonth}`
    : (config.title || 'ESTIMASI BIAYA');

  doc.text(fullTitle, 14, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Generate Dynamic Report ID: DDMMYYYY-ShotCount
  const dateObj = new Date();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const shotCount = String(shots.length).padStart(3, '0');
  const dynamicReportId = `${day}${month}${year}-${shotCount}`;

  doc.text(`Report ID: ${dynamicReportId}`, 14, 35);
  // Removed Date line
  doc.text(`Nama Artist: ${config.artistName || '-'}`, 14, 40);

  // --- DATA PROCESSING (Max 20 per page) ---
  const ITEMS_PER_PAGE = 20;
  const chunks = [];
  for (let i = 0; i < shots.length; i += ITEMS_PER_PAGE) {
    chunks.push(shots.slice(i, i + ITEMS_PER_PAGE));
  }

  let finalY = 50; // Adjusted start Y (Header is smaller now)

  // Iterate through pages
  chunks.forEach((chunk, pageIndex) => {
    // Add new page if not the first
    if (pageIndex > 0) {
      doc.addPage();
      finalY = 20; // Reset Y for new pages
    }

    const tableHead = [['No', 'Shot Name', 'Frames', 'Kategori', 'Harga']];
    const tableBody = chunk.map((shot, index) => {
        // Calculate global index for "No" column
        const globalIndex = (pageIndex * ITEMS_PER_PAGE) + index + 1;
        const tier = tiers.find(t => shot.frames >= t.min && shot.frames <= t.max) || tiers[tiers.length - 1];
        
        return [
          globalIndex.toString(),
          shot.name,
          shot.frames,
          tier.label,
          formatCurrency(shot.price),
        ];
    });

    autoTable(doc, {
      startY: finalY,
      head: tableHead,
      body: tableBody,
      theme: 'grid', // Standard clean table grid
      styles: { 
        font: 'helvetica', 
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: { 
        fillColor: [40, 40, 40], // Dark gray header
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, 
        1: { halign: 'left' },
        2: { halign: 'center' }, 
        3: { halign: 'center' }, 
        4: { halign: 'right' }, 
      },
    });

    // Update finalY based on the table height
    // @ts-ignore
    finalY = doc.lastAutoTable.finalY + 10;
  });

  // --- SUMMARY (Totals) ---
  // Check space for totals
  const pageHeight = doc.internal.pageSize.height;
  if (finalY > pageHeight - 50) {
    doc.addPage();
    finalY = 20;
  }

  const totalFrames = shots.reduce((acc, shot) => acc + shot.frames, 0);
  const totalPrice = shots.reduce((acc, shot) => acc + shot.price, 0);

  doc.setLineWidth(0.5);
  doc.line(14, finalY, 196, finalY);
  finalY += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  
  doc.text(`Total Shots: ${shots.length}`, 14, finalY);
  doc.text(`Total Frames: ${totalFrames}`, 100, finalY);
  doc.text(`Total Estimasi: ${formatCurrency(totalPrice)}`, 196, finalY, { align: 'right' });

  // --- FOOTER / NOTES ---
  finalY += 20;
  
  // Pricing Rules
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Ketentuan Harga:', 14, finalY);
  
  finalY += 6;
  doc.setFont('helvetica', 'normal');
  tiers.forEach((tier) => {
    const range = `${tier.min} - ${tier.max} frames`;
    doc.text(`${tier.label} (${range}): ${formatCurrency(tier.price)}`, 14, finalY);
    finalY += 5;
  });

  // Notes
  if (config.notes) {
    finalY += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Catatan:', 14, finalY);
    finalY += 5;
    
    doc.setFont('helvetica', 'italic');
    const splitNotes = doc.splitTextToSize(config.notes, 180);
    doc.text(splitNotes, 14, finalY);
  }

  doc.save(`${config.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};