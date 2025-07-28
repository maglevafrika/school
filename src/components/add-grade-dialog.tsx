// Updated AddGradeDialog component
"use client";

import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import type { Grade } from '@/lib/types';

const gradeFormSchema = z.object({
  title: z.string().min(1, "Title is required."),
  subject: z.string().min(1, "Subject is required."),
  type: z.enum(["test", "assignment", "quiz"]),
  score: z.coerce.number().min(0, "Score cannot be negative."),
  maxScore: z.coerce.number().min(1, "Max score must be at least 1."),
  notes: z.string().optional(),
}).refine(data => data.score <= data.maxScore, {
  message: "Score cannot be greater than max score.",
  path: ["score"],
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

interface AddGradeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddGrade: (gradeData: Omit<Grade, 'id'>) => Promise<boolean>;
}

export function AddGradeDialog({ isOpen, onOpenChange, onAddGrade }: AddGradeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      title: "",
      subject: "",
      type: "test",
      score: 0,
      maxScore: 100,
      notes: "",
    },
  });

  const onSubmit = async (data: GradeFormValues) => {
    setIsLoading(true);
    const gradeData = {
        ...data,
        date: new Date().toISOString(),
    };
    const success = await onAddGrade(gradeData);
    setIsLoading(false);
    if (success) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Grade</DialogTitle>
          <DialogDescription>
            Enter the details for the grade and click save.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input placeholder="e.g., Mid-term Practical" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl><Input placeholder="e.g., Oud" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="score" render={({ field }) => (
                <FormItem>
                    <FormLabel>Score</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="maxScore" render={({ field }) => (
                <FormItem>
                    <FormLabel>Max Score</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl><Textarea placeholder="Any additional notes..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Grade
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}