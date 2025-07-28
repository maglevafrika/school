// src/ai/flows/suggest-grades.ts
'use server';

/**
 * @fileOverview Generates suggested grades for a student based on their attendance and evaluation records.
 *
 * - suggestGrades - A function that generates suggested grades based on attendance records and evaluations.
 * - SuggestGradesInput - The input type for the suggestGrades function.
 * - SuggestGradesOutput - The return type for the suggestGrades function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestGradesInputSchema = z.object({
  attendanceRecords: z.string().describe('The attendance records of the student.'),
  evaluations: z.string().describe('The evaluations of the student.'),
  subject: z.string().describe('The subject for which to suggest the grade.'),
});

export type SuggestGradesInput = z.infer<typeof SuggestGradesInputSchema>;

const SuggestGradesOutputSchema = z.object({
  suggestedGrade: z.string().describe('The suggested grade for the student.'),
  reasoning: z.string().describe('The reasoning behind the suggested grade.'),
});

export type SuggestGradesOutput = z.infer<typeof SuggestGradesOutputSchema>;

export async function suggestGrades(input: SuggestGradesInput): Promise<SuggestGradesOutput> {
  return suggestGradesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestGradesPrompt',
  input: {schema: SuggestGradesInputSchema},
  output: {schema: SuggestGradesOutputSchema},
  prompt: `You are an AI assistant that suggests grades for students based on their attendance records and evaluations.

  Subject: {{{subject}}}
  Attendance Records: {{{attendanceRecords}}}
  Evaluations: {{{evaluations}}}

  Please provide a suggested grade and the reasoning behind it.
  Format your response as a JSON object:
  {
    "suggestedGrade": "",
    "reasoning": ""
  }
  `,
});

const suggestGradesFlow = ai.defineFlow(
  {
    name: 'suggestGradesFlow',
    inputSchema: SuggestGradesInputSchema,
    outputSchema: SuggestGradesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
