// Updated StudentEvaluationDialog component
"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from '@/context/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import type { Evaluation } from '@/lib/types';

const evaluationFormSchema = z.object({
  notes: z.string().min(1, "Evaluation notes are required."),
  criteria: z.array(z.object({
    name: z.string().min(1, "Criterion name is required."),
    score: z.coerce.number().min(0).max(10),
  })).min(1, "At least one criterion is required."),
});

type EvaluationFormValues = z.infer<typeof evaluationFormSchema>;

interface StudentEvaluationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEvaluation: (evaluationData: Omit<Evaluation, 'id'>) => Promise<boolean>;
}

export function StudentEvaluationDialog({ isOpen, onOpenChange, onAddEvaluation }: StudentEvaluationDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: {
      notes: "",
      criteria: [{ name: "Technique", score: 5 }, { name: "Rhythm", score: 5 }, { name: "Musicality", score: 5 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "criteria",
  });

  const onSubmit = async (data: EvaluationFormValues) => {
    if (!user) return;
    setIsLoading(true);
    const evaluationData = {
        ...data,
        evaluator: user.name,
        date: new Date().toISOString(),
    };
    const success = await onAddEvaluation(evaluationData);
    setIsLoading(false);
    if (success) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Evaluation</DialogTitle>
          <DialogDescription>
            Provide evaluation details and scores for each criterion.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Overall Notes</FormLabel>
                <FormControl><Textarea placeholder="e.g., Excellent progress this month, but needs to focus on..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <div>
              <FormLabel>Criteria</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField control={form.control} name={`criteria.${index}.name`} render={({ field }) => (
                      <FormItem className="flex-grow"><FormControl><Input placeholder="Criterion Name" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name={`criteria.${index}.score`} render={({ field }) => (
                      <FormItem><FormControl><Input type="number" min="0" max="10" {...field} /></FormControl></FormItem>
                    )} />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ name: '', score: 5 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Criterion
              </Button>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Evaluation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}