'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface DownloadAssessmentPdfProps {
  assessment: {
    // Basic info
    serviceUser?: string;
    firstVisitDate?: string;
    assessor?: string;
    status?: string;
    category?: string;
    priority?: string;
    
    // RAMP fields
    ramp1?: string;
    ramp2?: string;
    ramp3?: string;
    ramp4?: string;
    ramp5?: string;
    ramp6?: string;
    ramp7?: string;
    ramp8?: string;
    ramp9?: string;
    ramp10?: string;
    ramp11?: string;
    ramp12?: string;
    ramp13?: string;
    ramp14?: string;
    ramp15?: string;
    ramp16?: string;
    ramp17?: string;
    ramp18?: string;
    ramp19?: string;
    ramp20?: string;
    
    // RAMP field titles (optional)
    rampFieldTitles?: { [key: string]: string };
    
    // Custom RAMP fields
    customRampFields?: { id: string; title: string; value: string }[];
    
    // Additional fields
    accessDetails?: string;
    medicalBackground?: string;
    medicationList?: string;
    supportRequired?: string;
    lpaHealth?: string;
    lpaFinance?: string;
    keyWorker?: string;
    gender?: string;
    ethnicity?: string;
    initialAssessment?: string;
    carePlanApproval?: string;
  };
  
  // Default field titles for RAMP fields
  rampDefaultTitles?: { [key: string]: string };
}

export default function DownloadAssessmentPdf({ 
  assessment,
  rampDefaultTitles = {
    ramp1: 'Ramp 1: Respiratory Care',
    ramp2: 'Ramp 2: Psychological',
    ramp3: 'Ramp 3: Nutrition',
    ramp4: 'Ramp 4: Skin integrity',
    ramp5: 'Ramp 5: Mobility',
    ramp6: 'Ramp 6: Personal hygiene',
    ramp7: 'Ramp 7: Elimination',
    ramp8: 'Ramp 8: Sleeping',
    ramp9: 'Ramp 9: End of life care',
    ramp10: 'Ramp 10: Sexuality',
    ramp11: 'Ramp 11: Living environment',
    ramp12: 'Ramp 12: Activities of daily living',
    ramp13: 'Ramp 13: Medication',
    ramp14: 'Ramp 14: Communication',
    ramp15: 'Ramp 15: Moving and handling',
    ramp16: 'Ramp 16: Falls and Safety',
    ramp17: 'Ramp 17: COSSH',
    ramp18: 'Ramp 18: Money Management',
    ramp19: 'Ramp 19: Social and Spiritual',
    ramp20: 'Ramp 20: Challenging Behaviour',
  } 
}: DownloadAssessmentPdfProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = async () => {
    try {
      setIsGenerating(true);
      
      // Create new PDF document in A4 format
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // PDF document settings
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      // Helper function to add text with word wrapping
      const addWrappedText = (text: string | undefined, x: number, y: number, maxWidth: number, lineHeight: number): number => {
        // Handle undefined or empty text
        if (!text || text.trim() === '') {
          return y + lineHeight; // Still return position with a single line height to maintain spacing
        }
        
        const lines = pdf.splitTextToSize(text, maxWidth);
        
        // Check if adding this text would cross page boundary
        if (y + (lines.length * lineHeight) > pageHeight - 20) {
          // If so, add a new page and reset y position
          pdf.addPage();
          y = margin + 10;
        }
        
        pdf.text(lines, x, y);
        return y + (lines.length * lineHeight);
      };
      
      // Helper function to add section title
      const addSectionTitle = (title: string, y: number): number => {
        // Check if we need a page break before the section title
        // Leave more room (50mm) for section titles to ensure they don't get orphaned
        if (y > pageHeight - 50) {
          pdf.addPage();
          y = margin + 10;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text(title, margin, y);
        pdf.line(margin, y + 2, pageWidth - margin, y + 2);
        return y + 10; // More space after section title
      };
      
      // Helper function to add field with label and value
      const addField = (label: string, value: string | undefined, y: number): number => {
        // Check if near page bottom - leave more space (35mm) to ensure text doesn't get cut off mid-field
        if (y > pageHeight - 35) {
          pdf.addPage();
          y = margin + 10;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(label, margin, y);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        // Always add value even if empty (will just add spacing)
        const newY = addWrappedText(value, margin, y + 5, contentWidth, 5);
        return newY + 5; // More spacing between fields
      };
      
      // Setup document title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      
      // Use service user name in the title if available
      const titleText = assessment.serviceUser && assessment.serviceUser.trim() !== '' 
        ? `${assessment.serviceUser} Care Plan` 
        : 'Care Plan';
      
      pdf.text(titleText, margin, margin + 5);
      
      // Add date
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, margin + 15);
      
      let yPos = margin + 25;
      
      // Add Basic Info section
      yPos = addSectionTitle('Basic Information', yPos);
      
      // Always include service user
      yPos = addField('Service User:', assessment.serviceUser || 'Not specified', yPos);
      yPos = addField('First Visit Date:', assessment.firstVisitDate || 'Not specified', yPos);
      yPos = addField('Assessor:', assessment.assessor || 'Not specified', yPos);
      yPos = addField('Status:', assessment.status || 'Not specified', yPos);
      yPos = addField('Priority:', assessment.priority || 'Not specified', yPos);
      yPos = addField('Category:', assessment.category || 'Not specified', yPos);
      
      // Add Additional Information section - check if we need a page break first
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = margin + 10;
      } else {
        // Add some spacing between sections
        yPos += 10;
      }
      
      yPos = addSectionTitle('Additional Information', yPos);
      
      // Include all additional fields regardless of content
      yPos = addField('Initial Assessment:', assessment.initialAssessment || 'No data entered', yPos);
      yPos = addField('Access Details:', assessment.accessDetails || 'No data entered', yPos);
      yPos = addField('Medical Background:', assessment.medicalBackground || 'No data entered', yPos);
      yPos = addField('Medication List:', assessment.medicationList || 'No data entered', yPos);
      yPos = addField('Support Required:', assessment.supportRequired || 'No data entered', yPos);
      yPos = addField('LPA Health:', assessment.lpaHealth || 'No data entered', yPos);
      yPos = addField('LPA Finance:', assessment.lpaFinance || 'No data entered', yPos);
      yPos = addField('Key Worker:', assessment.keyWorker || 'No data entered', yPos);
      yPos = addField('Gender:', assessment.gender || 'No data entered', yPos);
      yPos = addField('Ethnicity:', assessment.ethnicity || 'No data entered', yPos);
      yPos = addField('Care Plan Approval:', assessment.carePlanApproval || 'No data entered', yPos);
      
      // Add RAMP Assessment section - check if we need a page break first
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = margin + 10;
      } else {
        // Add some spacing between sections
        yPos += 10;
      }
      
      yPos = addSectionTitle('RAMP Assessment', yPos);
      
      // Process all RAMP fields - include all 20 standard fields
      for (let i = 1; i <= 20; i++) {
        const fieldId = `ramp${i}` as keyof typeof assessment;
        const fieldValue = assessment[fieldId] as string;
        const fieldTitle = assessment.rampFieldTitles?.[fieldId] || rampDefaultTitles[fieldId] || `RAMP ${i}`;
        
        // Check page break before each field if needed - leave at least 35mm to prevent cut-offs
        if (yPos > pageHeight - 35) {
          pdf.addPage();
          yPos = margin + 10;
        }
        
        yPos = addField(fieldTitle + ':', fieldValue || 'No data entered', yPos);
      }
      
      // Add custom RAMP fields if any
      if (assessment.customRampFields && assessment.customRampFields.length > 0) {
        // Check if we need a page break first - leave at least 45mm for the heading and first field
        if (yPos > pageHeight - 45) {
          pdf.addPage();
          yPos = margin + 10;
        }
        
        // Add a subheading for custom fields
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.text('Custom RAMP Fields', margin, yPos);
        yPos += 8;
        
        assessment.customRampFields.forEach(field => {
          // Check for page break before each field - leave at least 35mm
          if (yPos > pageHeight - 35) {
            pdf.addPage();
            yPos = margin + 10;
          }
          
          yPos = addField(field.title + ':', field.value || 'No data entered', yPos);
        });
      }
      
      // Add footer with page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      // Generate a filename based on service user name
      let fileName = '';
      if (assessment.serviceUser && assessment.serviceUser.trim() !== '') {
        // If service user name exists, include it in the filename
        const sanitizedName = assessment.serviceUser.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        fileName = `Care_Assessment_${sanitizedName}.pdf`;
      } else {
        // Fallback if no service user name
        fileName = `Care_Assessment_Report.pdf`;
      }
      
      // Save the PDF
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <button
      onClick={generatePdf}
      disabled={isGenerating}
      className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label="Download Assessment as PDF"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Download
        </>
      )}
    </button>
  );
} 