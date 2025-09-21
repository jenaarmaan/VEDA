
'use server';
/**
 * @fileOverview An AI flow to analyze and fact-check the content of a given URL.
 *
 * - analyzeContent - A function that handles the content analysis process.
 * - AnalyzeContentInput - The input type for the analyzeContent function.
 * - AnalyzeContentOutput - The return type for the analyzeContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';


const AnalyzeContentInputSchema = z.object({
  url: z.string().url().describe('The URL of the content to be fact-checked.'),
});
export type AnalyzeContentInput = z.infer<typeof AnalyzeContentInputSchema>;

const AnalyzeContentOutputSchema = z.object({
  status: z.enum(['Verified', 'Questionable', 'False', 'Unverified']).describe('A single-word verdict on the content.'),
  confidence: z.number().min(0).max(100).describe('A numeric confidence percentage (0-100) in the verdict.'),
  explanation: z.string().describe('A 3-5 sentence plain-language explanation of the verdict, including key evidence and reliable sources.'),
  draftEmail: z.object({
    subject: z.string().describe('A standard subject line for the report email.'),
    body: z.string().describe('A polite, professional email body summarizing the fact-check and asking authorities to take appropriate action.'),
  }),
});
export type AnalyzeContentOutput = z.infer<typeof AnalyzeContentOutputSchema>;

const prompt = ai.definePrompt({
    name: 'analyzeContentPrompt',
    input: { schema: AnalyzeContentInputSchema },
    output: { schema: AnalyzeContentOutputSchema },
    prompt: `You are a highly advanced AI fact-checking expert for an organization named VEDA.
Your task is to analyze the content at the provided URL and determine its authenticity based on publicly available, reliable sources.

Follow these steps for your analysis:
1.  **Read and Understand**: Access and thoroughly read the content at the provided URL to identify the main claims.
2.  **Fact-Check**: Search for evidence from credible sources (major news organizations, scientific journals, official government websites, established fact-checking organizations) to verify or debunk the claims.
3.  **Formulate Verdict**: Based on your research, determine the status of the content.
    *   'Verified': The main claims are accurate and supported by strong evidence.
    *   'Questionable': The content contains some inaccuracies, is biased, or uses unverified information.
    *   'False': The main claims are demonstrably false, misleading, or fabricated.
    *   'Unverified': There is not enough credible information to make a confident determination.
4.  **Determine Confidence**: Assign a confidence score from 0 to 100 on how certain you are about your verdict.
5.  **Write Explanation**: Provide a neutral, concise, 3-5 sentence explanation of your findings. Summarize the key evidence and cite reliable sources that support your conclusion.
6.  **Draft Email**: Compose a polite and professional email body summarizing the fact-check. The email should be addressed to relevant authorities, asking them to take appropriate action against the misinformation. The subject line should be "Fact-check report from VEDA".

Here is an example of the expected output quality and format:

EXAMPLE INPUT:
https://timesofindia.indiatimes.com/city/kolkata/fake-news-say-police-after-bjps-noa-charges/articleshow/123930163.cms

EXAMPLE OUTPUT:
{
  "status": "False",
  "confidence": 100,
  "explanation": "This news was fact-checked by East Burdwan Police and reported by mainstream outlets (Times of India, Millennium Post). The viral claim that SSC candidates were forced to remove their iron bangle (noa) was proven false. The candidate was allowed to write the exam with the bangle. Police concluded the viral content was politically motivated and misleading.",
  "draftEmail": {
      "subject": "Fact-check report from VEDA",
      "body": "Dear Sir/Madam,\\n\\nI would like to report misinformation circulating online regarding SSC candidates allegedly being forced to remove their iron bangle (noa). After verifying with East Burdwan Police and mainstream outlets, this claim is proven false and politically motivated.\\n\\nKindly take appropriate steps to counter this misinformation.\\n\\nThank you,\\n[Your Name]"
  }
}

Now, analyze the following URL:

URL to Analyze: {{{url}}}

Produce the output in the required JSON format only. Do not output any other text or formatting.
`,
});


const analyzeContentFlow = ai.defineFlow(
  {
    name: 'analyzeContentFlow',
    inputSchema: AnalyzeContentInputSchema,
    outputSchema: AnalyzeContentOutputSchema,
  },
  async (input) => {
    // const response = await prompt(input);
    // const output = response.output;
    // if (!output) {
    //     throw new Error("AI analysis failed to produce a valid output.");
    // }
    // return output;
    
    // Return dummy data
    return {
      status: "False",
      confidence: 0,
      explanation: "This news was fact-checked by East Burdwan Police and reported by mainstream outlets (Times of India, Millennium Post). The viral claim that SSC candidates were forced to remove their iron bangle (noa) was proven false. The candidate was allowed to write the exam with the bangle. Police concluded the viral content was politically motivated and misleading.",
      draftEmail": {
          "subject": "Fact-check report from VEDA",
          "body": "Dear Sir/Madam,\\n\\nI would like to report misinformation circulating online regarding SSC candidates allegedly being forced to remove their iron bangle (noa). After verifying with East Burdwan Police and mainstream outlets, this claim is proven false and politically motivated.\\n\\nKindly take appropriate steps to counter this misinformation.\\n\\nThank you,\\n[Your Name]"
      }
    };
  }
);


export async function analyzeContent(input: AnalyzeContentInput): Promise<AnalyzeContentOutput> {
  return analyzeContentFlow(input);
}
