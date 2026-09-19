import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';

async function generatePDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  
  // URL to encode
  const url = 'https://gatepass.ngpl.com/';
  
  // Generate QR code as Data URL
  const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, scale: 10 });
  const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
  
  // Embed QR code
  const qrImage = await pdfDoc.embedPng(Buffer.from(base64Data, 'base64'));
  const qrDims = qrImage.scale(0.5);
  
  // Draw Title
  page.drawText('NAVJYOTI GATE PASS', {
    x: 150,
    y: 750,
    size: 24,
    color: rgb(0, 0, 0),
  });

  page.drawText('Welcome to Navjyoti Premises', {
    x: 165,
    y: 715,
    size: 16,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Draw QR
  const xOffset = (page.getWidth() - qrDims.width) / 2;
  page.drawImage(qrImage, {
    x: xOffset,
    y: 400,
    width: qrDims.width,
    height: qrDims.height,
  });

  page.drawText('SCAN TO CHECK IN OR CHECK OUT', {
    x: 130,
    y: 350,
    size: 18,
    color: rgb(0.1, 0.5, 0.1),
  });

  page.drawText('Point your phone camera at the QR code above.', {
    x: 145,
    y: 320,
    size: 14,
    color: rgb(0.4, 0.4, 0.4),
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('C:\\Users\\singh\\.gemini\\antigravity-ide\\brain\\3638e3d6-83d2-4a32-ab6e-cdd0d0d1d735\\Kiosk_QR.pdf', pdfBytes);
  console.log('PDF generated at Kiosk_QR.pdf');
}

generatePDF().catch(console.error);
