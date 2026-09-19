'use client';

import { Download, FileText, Printer } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { RefObject, useState } from 'react';

interface GatePassActionsProps {
  passRef: RefObject<HTMLDivElement | null>;
  passNumber: string;
}

export function GatePassActions({ passRef, passNumber }: GatePassActionsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const generateImage = async (): Promise<string | null> => {
    if (!passRef.current) return null;
    try {
      // Ensure fonts are loaded before capturing
      await document.fonts.ready;
      
      // html-to-image configuration optimized for the new layout
      const dataUrl = await toPng(passRef.current, { 
        cacheBust: true,
        pixelRatio: 2, // higher resolution
        backgroundColor: '#ffffff',
        style: {
          margin: '0', // Reset any margins that might affect capture
        }
      });
      return dataUrl;
    } catch (err) {
      console.error('Failed to generate image:', err);
      alert('Failed to generate image. Please ensure all assets are loaded and try again.');
      return null;
    }
  };

  const handleDownloadPNG = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const dataUrl = await generateImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `Navjyoti-Gate-Pass-${passNumber}.png`;
      link.href = dataUrl;
      link.click();
    }
    setIsExporting(false);
  };

  const handleDownloadPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const dataUrl = await generateImage();
    if (dataUrl) {
      // Use A5 format which is standard for large portrait cards, 
      // or we can calculate aspect ratio exactly.
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const margin = 10;
      const availableWidth = pdfWidth - margin * 2;
      const availableHeight = pdfHeight - margin * 2;
      
      const ratio = Math.min(availableWidth / imgProps.width, availableHeight / imgProps.height);
      const w = imgProps.width * ratio;
      const h = imgProps.height * ratio;
      
      const x = (pdfWidth - w) / 2;
      const y = (pdfHeight - h) / 2;

      pdf.addImage(dataUrl, 'PNG', x, y, w, h);
      pdf.save(`Navjyoti-Gate-Pass-${passNumber}.pdf`);
    }
    setIsExporting(false);
  };

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 w-full max-w-[600px] mx-auto mt-3 sm:mt-4 print:hidden px-1">
      <button 
        onClick={handlePrint}
        className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-3 sm:px-4 py-3 rounded-xl transition-colors font-semibold text-xs sm:text-sm min-h-[44px]"
      >
        <Printer className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        <span>Print Pass</span>
      </button>
      <button 
        onClick={handleDownloadPNG}
        disabled={isExporting}
        className="flex items-center justify-center gap-2 bg-[#050505] text-white hover:bg-[#050505]/90 px-3 sm:px-4 py-3 rounded-xl transition-colors font-semibold text-xs sm:text-sm disabled:opacity-50 min-h-[44px]"
      >
        <Download className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        <span>Download PNG</span>
      </button>
      <button 
        onClick={handleDownloadPDF}
        disabled={isExporting}
        className="flex items-center justify-center gap-2 bg-[#FF6A00] text-white hover:bg-[#FF6A00]/90 px-3 sm:px-4 py-3 rounded-xl transition-colors font-semibold text-xs sm:text-sm disabled:opacity-50 min-h-[44px] xs:col-span-2 sm:col-span-1"
      >
        <FileText className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        <span>Download PDF</span>
      </button>
    </div>
  );
}

