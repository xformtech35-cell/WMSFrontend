import React from 'react';

// utils/pdfGenerator.js
export async function generatePDF(po, formatDate, formatCurrency) {
  // Dynamically import only on client side
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default;
    
    // Use the UMD version of jspdf
    const jsPDFModule = await import('jspdf');
    const { jsPDF } = jsPDFModule;

    // Create container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '794px';
    container.style.background = '#ffffff';
    container.style.padding = '20px';
    container.style.zIndex = '-9999';
    document.body.appendChild(container);

    // Render content
    const ReactDOM = (await import('react-dom/client')).default;
    const PurchaseOrderPrintView = (await import('../../app/purchase-orders/PurchaseOrderPrintView')).default;
    
    const root = ReactDOM.createRoot(container);
    root.render(
      React.createElement(PurchaseOrderPrintView, {
        po,
        formatDate,
        formatCurrency
      })
    );

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      height: 1123,
      allowTaint: true,
      foreignObjectRendering: true,
      onclone: (clonedDoc) => {
        // Remove all gradient backgrounds
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach(el => {
          const bgImage = el.style.backgroundImage;
          if (bgImage && bgImage.includes('gradient')) {
            el.style.backgroundImage = 'none';
          }
        });
      }
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${po.poNumber}.pdf`);

    // Clean up
    document.body.removeChild(container);
    root.unmount();
    
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}