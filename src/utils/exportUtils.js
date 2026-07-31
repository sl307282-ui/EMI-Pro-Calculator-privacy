import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Share } from '@capacitor/share';


/**
 * Exports the amortization schedule to a PDF file.
 * @param {Object} data - Loan summary data.
 * @param {Array} schedule - Monthly or Yearly schedule data.
 * @param {string} viewType - 'year' or 'month'.
 */
export const exportToPDF = (data, schedule, viewType) => {
  const doc = jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Primary blue
  doc.text('Amortization Schedule', pageWidth / 2, 20, { align: 'center' });

  // Loan Summary
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55); // Gray 900
  doc.text(`Loan Amount: Rs. ${Number(data.amount).toLocaleString()}`, 20, 35);
  doc.text(`Interest Rate: ${data.interest}%`, 20, 42);
  doc.text(`Tenure: ${data.nMonths} Months`, 20, 49);
  doc.text(`Monthly EMI: Rs. ${Math.round(data.emi).toLocaleString()}`, 20, 56);
  doc.text(`Total Interest: Rs. ${Math.round(data.totalInterest).toLocaleString()}`, 20, 63);
  doc.text(`Total Payment: Rs. ${Math.round(data.grandTotal).toLocaleString()}`, 20, 70);

  // Table
  const tableColumn = [viewType === 'year' ? 'Year' : 'Month', 'Principal', 'Interest', 'Balance'];
  const tableRows = schedule.map(row => [
    viewType === 'year' ? row.year : row.month,
    `Rs. ${Math.round(row.principal).toLocaleString()}`,
    `Rs. ${Math.round(row.interest).toLocaleString()}`,
    `Rs. ${Math.round(row.balance).toLocaleString()}`
  ]);

  doc.autoTable({
    startY: 80,
    head: [tableColumn],
    body: tableRows,
    headStyles: { fillStyle: 'f', fillColor: [59, 130, 246] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: 80 },
  });

  doc.save(`EMI_Schedule_${new Date().getTime()}.pdf`);
};

/**
 * Captures a DOM element and shares it as an image.
 * @param {string} elementId - The ID of the element to capture.
 */
export const shareAsImage = async (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    canvas.toBlob(async (blob) => {
      const file = new File([blob], `EMI_Calculation_${new Date().getTime()}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'EMI Calculation',
            text: 'Check out my EMI calculation result!'
          });
        } catch (err) {
          if (err.name !== 'AbortError') console.error('Share failed:', err);
        }
      } else {
        // Fallback: Download the image
        const link = document.createElement('a');
        link.download = `EMI_Calculation_${new Date().getTime()}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    }, 'image/png');
  } catch (err) {
    console.error('Error capturing image:', err);
  }
};

/**
 * Shares calculation details as text.
 * @param {string} title - The title of the share.
 * @param {string} text - The text content to share.
 */
export const shareAsText = async (title, text) => {
  // First try Capacitor Native Share (best for Capacitor hybrid apps)
  let capacitorShareAttempted = false;
  try {
    const canShare = await Share.canShare();
    if (canShare.value) {
      capacitorShareAttempted = true;
      await Share.share({
        title: title,
        text: text,
      });
      return;
    }
  } catch (e) {
    console.warn('[EMI Pro Debug] Capacitor Share plugin failed or not available:', e);
    // If Capacitor share was actually attempted and threw an error (e.g. user cancelled or closed),
    // return immediately instead of falling through to other fallback options.
    if (capacitorShareAttempted) {
      return;
    }
  }

  // Fallback to Web Share API (best for iOS Safari and other browsers that support it)
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
      });
      return;
    } catch (err) {
      console.warn('[EMI Pro Debug] Web Share API failed or was cancelled:', err);
      // Since Web Share API was attempted (which opens the native share dialog),
      // we return here regardless of the error to avoid falling back to clipboard copy.
      return;
    }
  }

  // Final fallback: Copy to clipboard (only when no share APIs are supported at all, e.g. on Desktop Web)
  try {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  } catch (err) {
    console.error('[EMI Pro Debug] Clipboard copy failed:', err);
  }
};
