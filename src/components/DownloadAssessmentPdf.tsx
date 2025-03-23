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
        if (y + (lines.length * lineHeight) > pageHeight - margin) {
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
      const addField = (label: string, value: string | undefined, y: number, checkPageBreak = true): number => {
        const estimatedHeight = 20; // Base height for label
        const valueLines = value ? pdf.splitTextToSize(value, contentWidth).length : 1;
        const totalEstimatedHeight = estimatedHeight + (valueLines * 5);
        
        // Check if near page bottom - leave more space to prevent content splitting
        if (checkPageBreak && y + totalEstimatedHeight > pageHeight - 35) {
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
      
      // Group related fields together to prevent page breaks between them
      const addFieldGroup = (fields: Array<[string, string | undefined]>, y: number): number => {
        let currentY = y;
        const totalHeight = fields.reduce((acc, [label, value]) => {
          const valueLines = value ? pdf.splitTextToSize(value, contentWidth).length : 1;
          return acc + 20 + (valueLines * 5);
        }, 0);
        
        // Check if the entire group needs to start on a new page
        if (currentY + totalHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin + 10;
        }
        
        // Add each field without individual page break checks
        fields.forEach(([label, value]) => {
          currentY = addField(label, value, currentY, false);
        });
        
        return currentY + 5; // Add extra spacing after group
      };
      
      // Group basic information fields
      yPos = addFieldGroup([
        ['Service User:', assessment.serviceUser],
        ['First Visit Date:', assessment.firstVisitDate],
        ['Assessor:', assessment.assessor],
        ['Status:', assessment.status],
        ['Priority:', assessment.priority],
        ['Category:', assessment.category]
      ], yPos);
      
      // Add some spacing between sections
      yPos += 10;
      
      // Add Additional Information section
      yPos = addSectionTitle('Additional Information', yPos);
      
      // Group additional information fields
      yPos = addFieldGroup([
        ['Initial Assessment:', assessment.initialAssessment],
        ['Access Details:', assessment.accessDetails],
        ['Medical Background:', assessment.medicalBackground],
        ['Medication List:', assessment.medicationList],
        ['Support Required:', assessment.supportRequired]
      ], yPos);
      
      // Group personal information fields
      yPos = addFieldGroup([
        ['LPA Health:', assessment.lpaHealth],
        ['LPA Finance:', assessment.lpaFinance],
        ['Key Worker:', assessment.keyWorker],
        ['Gender:', assessment.gender],
        ['Ethnicity:', assessment.ethnicity],
        ['Care Plan Approval:', assessment.carePlanApproval]
      ], yPos);
      
      // Add some spacing before RAMP section
      yPos += 10;
      
      // Add RAMP Assessment section
      yPos = addSectionTitle('RAMP Assessment', yPos);
      
      // Group RAMP fields in pairs to save space while maintaining readability
      for (let i = 1; i <= 20; i += 2) {
        const field1Id = `ramp${i}` as keyof typeof assessment;
        const field2Id = `ramp${i + 1}` as keyof typeof assessment;
        
        const field1Value = assessment[field1Id] as string;
        const field2Value = assessment[field2Id] as string;
        
        const field1Title = assessment.rampFieldTitles?.[field1Id] || rampDefaultTitles[field1Id] || `RAMP ${i}`;
        const field2Title = assessment.rampFieldTitles?.[field2Id] || rampDefaultTitles[field2Id] || `RAMP ${i + 1}`;
        
        yPos = addFieldGroup([
          [field1Title + ':', field1Value],
          [field2Title + ':', field2Value]
        ], yPos);
      }
      
      // Add custom RAMP fields if any
      if (assessment.customRampFields && assessment.customRampFields.length > 0) {
        yPos += 10;
        yPos = addSectionTitle('Custom RAMP Fields', yPos);
        
        // Group custom fields in pairs
        for (let i = 0; i < assessment.customRampFields.length; i += 2) {
          const field1 = assessment.customRampFields[i];
          const field2 = assessment.customRampFields[i + 1];
          
          const fields: Array<[string, string]> = [];
          if (field1) fields.push([field1.title + ':', field1.value]);
          if (field2) fields.push([field2.title + ':', field2.value]);
          
          yPos = addFieldGroup(fields, yPos);
        }
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