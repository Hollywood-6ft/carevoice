import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const pdf = formData.get('pdf') as File;

    if (!pdf) {
      return NextResponse.json(
        { success: false, error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    if (pdf.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large' },
        { status: 400 }
      );
    }

    if (pdf.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDFs are supported.' },
        { status: 400 }
      );
    }

    // Extract the filename and metadata for enhanced analysis
    const fileName = pdf.name.replace(/\.[^/.]+$/, "");
    const fileSize = (pdf.size / 1024 / 1024).toFixed(2); // Convert to MB

    // Get document insights from the filename and size
    let extractedInfo: string;
    
    try {
      // Use OpenAI to analyze the filename and other metadata
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a healthcare document analyzer specializing in care assessments. 
            Your task is to analyze document metadata and create a structured template.
            Based on the filename, infer what type of healthcare document this might be.
            Make educated guesses about possible content based on naming conventions in healthcare.
            Create a structured template that a healthcare professional could fill in.
            Your analysis should focus on providing a useful starting point for document review.`
          },
          {
            role: 'user',
            content: `I have a PDF document with the following details:
            
Filename: "${pdf.name}"
File size: ${fileSize} MB
File type: ${pdf.type}

Please analyze this document metadata and create a structured template for a healthcare assessment.
Based on the filename, infer what type of healthcare document this is likely to be.
Create a comprehensive structure that includes all typical sections for this document type.

The template should include:
1. Document type and purpose
2. Client information section
3. Medical history/conditions section
4. Assessment findings section
5. Care recommendations section
6. Risk factors section
7. Goals and outcomes section
8. Any other relevant sections for this document type

Format the response with Markdown headings and bullet points for readability.
Include placeholder text that guides the user on what information to enter in each section.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      extractedInfo = response.choices[0].message.content || '';
      
      // If the response is empty or too short, use the fallback
      if (!extractedInfo || extractedInfo.length < 100) {
        extractedInfo = generateEnhancedTemplate(fileName);
      }
      
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      // Use our enhanced template generator for all errors
      extractedInfo = generateEnhancedTemplate(fileName);
      
      return NextResponse.json({
        success: true,
        warning: "We couldn't process your PDF directly. We've created a template based on the filename that you can use as a starting point.",
        extractedInfo
      });
    }

    return NextResponse.json({
      success: true,
      warning: "We've created a template based on your document. You can now fill in the details from your PDF.",
      extractedInfo
    });

  } catch (error: any) {
    console.error('PDF processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process PDF' 
      },
      { status: 500 }
    );
  }
};

// Enhanced template generator with more intelligent analysis
function generateEnhancedTemplate(fileName: string): string {
  // Analyze filename components
  const parts = fileName.split(/[_\-\s.]/);
  
  // Extract potential client initials or name
  let clientName = 'Unknown Client';
  
  // Look for patterns like initials (L.Rand) or names
  const nameRegex = /^[A-Z][a-z]*\.?[A-Z][a-z]*/;
  const initialsRegex = /^[A-Z]\.[A-Z][a-z]+/;
  
  // Check for initial.lastname pattern (e.g., L.Rand)
  const initialsMatch = fileName.match(initialsRegex);
  if (initialsMatch) {
    clientName = initialsMatch[0];
    // Convert L.Rand to L. Rand (add space after period if needed)
    clientName = clientName.replace(/\.([A-Z])/, '. $1');
  } else {
    // Look for other name patterns
    const nameMatches = parts.filter(part => nameRegex.test(part));
    if (nameMatches.length > 0) {
      clientName = nameMatches[0].replace('.', ' ');
    }
  }
  
  // Determine assessment type with more advanced logic
  let assessmentType = 'Care Assessment';
  let assessmentPurpose = 'Evaluate care needs and recommend support services';
  
  // Check common healthcare document abbreviations and terms
  if (fileName.match(/ISP|IndividualSupportPlan/i)) {
    assessmentType = 'Individual Support Plan (ISP)';
    assessmentPurpose = 'Document support needs and outline intervention strategies';
  } else if (fileName.match(/care[\s_-]?assess/i)) {
    assessmentType = 'Care Needs Assessment';
    assessmentPurpose = 'Evaluate daily living support requirements and care services needed';
  } else if (fileName.match(/health[\s_-]?assess/i)) {
    assessmentType = 'Health Assessment';
    assessmentPurpose = 'Evaluate overall health status and medical support needs';
  } else if (fileName.match(/risk[\s_-]?assess/i)) {
    assessmentType = 'Risk Assessment';
    assessmentPurpose = 'Identify potential risks and establish mitigation strategies';
  } else if (fileName.match(/behav(ior|iour)/i)) {
    assessmentType = 'Behavioral Support Plan';
    assessmentPurpose = 'Document behavioral patterns and intervention strategies';
  } else if (fileName.match(/psych|mental/i)) {
    assessmentType = 'Psychological Assessment';
    assessmentPurpose = 'Evaluate mental health status and support needs';
  }

  // Generate comprehensive template
  return `# ${assessmentType} for ${clientName}

## Document Overview
- **Client Name**: ${clientName}
- **Document Type**: ${assessmentType}
- **Purpose**: ${assessmentPurpose}
- **Source File**: ${fileName}

## Client Information
- **Full Name**: [Enter client's full name]
- **Date of Birth**: [Enter DOB]
- **Address**: [Enter address]
- **Contact Information**: [Enter phone/email]
- **NHS/ID Number**: [Enter relevant identification numbers]
- **Primary Language**: [Enter language preferences]
- **Emergency Contact**: [Enter name and relationship]

## Medical History
- **Diagnoses**: [List all confirmed medical diagnoses]
- **Current Medications**: [List medications, dosages, and schedules]
- **Allergies**: [Document all known allergies and reactions]
- **Previous Hospitalizations**: [List relevant hospital admissions]
- **Specialists Involved**: [List healthcare specialists currently seeing the client]

## Assessment Findings
- **Current Health Status**: [Summarize current health condition]
- **Physical Abilities**: [Describe mobility and physical capabilities]
- **Cognitive Status**: [Describe cognitive function and capabilities]
- **Communication Abilities**: [Describe communication methods and capabilities]
- **Activities of Daily Living**: [Describe independence level with personal care tasks]
- **Nutritional Status**: [Describe dietary needs and restrictions]

## Care Recommendations
- **Personal Care Support**: [Detail assistance needed with bathing, dressing, etc.]
- **Mobility Support**: [Detail transfer assistance, mobility aids required]
- **Medication Management**: [Detail level of support needed with medications]
- **Nutritional Support**: [Detail dietary requirements and mealtime assistance]
- **Healthcare Appointments**: [Detail support needed for attending appointments]
- **Social Engagement**: [Detail recommendations for social activities]

## Risk Factors
- **Fall Risk**: [Document fall risk level and prevention strategies]
- **Skin Integrity Risk**: [Document pressure sore risk and prevention]
- **Nutritional Risk**: [Document risks related to nutrition]
- **Medication-Related Risks**: [Document any medication risks]
- **Behavioral Risks**: [Document any behavioral concerns]
- **Environmental Risks**: [Document home safety concerns]

## Goals and Outcomes
- **Short-term Goals**: [List goals to be achieved within 3 months]
- **Long-term Goals**: [List goals to be achieved within 12 months]
- **Client's Personal Goals**: [Document goals expressed by the client]
- **Outcome Measures**: [Define how progress will be measured]

## Additional Information
- **Cultural Considerations**: [Document relevant cultural factors]
- **Spiritual/Religious Needs**: [Document spiritual support requirements]
- **Family Involvement**: [Detail family support and involvement]
- **Financial Considerations**: [Document relevant financial information]

## Review Information
- **Assessment Date**: [Enter date assessment was conducted]
- **Assessor Name & Role**: [Enter name and professional role]
- **Review Date**: [Enter date for next review]
- **Approvals Required**: [List any required approvals]

*Note: This template has been generated based on the document filename. Please review and complete all sections with information from the actual PDF document.*
`;
} 