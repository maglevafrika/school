'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting an optimized class schedule.
 *
 * The flow takes into account student availability, teacher expertise, and classroom capacity
 * to minimize conflicts and maximize resource utilization.
 *
 * @interface SuggestClassScheduleInput - Input type for the suggestClassSchedule function.
 * @interface SuggestClassScheduleOutput - Output type for the suggestClassSchedule function.
 * @function suggestClassSchedule - A function that triggers the class schedule suggestion flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SuggestClassScheduleInputSchema = z.object({
  studentAvailabilities: z.array(
    z.object({
      studentId: z.string().describe('The unique identifier of the student.'),
      availability: z
        .array(z.string())
        .describe(
          'Array of available time slots for the student (e.g., "Monday 9-11").'
        ),
    })
  ).describe('A list of students and their available time slots.'),
  teacherExpertise: z.record(z.string(), z.string()).describe('A mapping of teacher IDs to their subject expertise.'),
  classroomCapacity: z.array(
    z.object({
      classroomId: z.string().describe('The unique identifier of the classroom.'),
      capacity: z.number().describe('The maximum number of students the classroom can hold.'),
      subject: z.string().describe('The subject for which the classroom is equipped (e.g., "Oud", "Piano").'),
    })
  ).describe('A list of classrooms with their capacities and designated subjects.'),
});

export type SuggestClassScheduleInput = z.infer<typeof SuggestClassScheduleInputSchema>;

const SuggestClassScheduleOutputSchema = z.object({
  optimizedSchedule: z.array(
    z.object({
      timeSlot: z.string().describe('The scheduled time slot.'),
      classroomId: z.string().describe('The ID of the assigned classroom.'),
      teacherId: z.string().describe('The ID of the assigned teacher.'),
      studentId: z.string().describe('The ID of the assigned student.'),
      subject: z.string().describe('The subject being taught.'),
    })
  ).describe('The optimized class schedule.'),
  conflictResolution: z.string().describe('A summary of how any scheduling conflicts were resolved.'),
});

export type SuggestClassScheduleOutput = z.infer<typeof SuggestClassScheduleOutputSchema>;

export async function suggestClassSchedule(input: SuggestClassScheduleInput): Promise<SuggestClassScheduleOutput> {
  return suggestClassScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestClassSchedulePrompt',
  input: {schema: SuggestClassScheduleInputSchema},
  output: {schema: SuggestClassScheduleOutputSchema},
  prompt: `You are an AI assistant that creates an optimized class schedule.

  Inputs:
  - Student Availabilities: {{{jsonStringify studentAvailabilities}}}
  - Teacher Expertise: {{{jsonStringify teacherExpertise}}}
  - Classroom Capacity: {{{jsonStringify classroomCapacity}}}

  Task:
  1. Create a weekly class schedule that assigns each student to a teacher and a classroom based on their availability.
  2. The teacher's subject expertise must match the subject of the class.
  3. The number of students in a classroom at any time must not exceed its capacity.
  4. Minimize scheduling conflicts and maximize resource utilization.
  5. Provide a summary of how you resolved any potential conflicts.

  Format your response as a single JSON object.
  `,
});

const suggestClassScheduleFlow = ai.defineFlow(
  {
    name: 'suggestClassScheduleFlow',
    inputSchema: SuggestClassScheduleInputSchema,
    outputSchema: SuggestClassScheduleOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
