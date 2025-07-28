// Updated UpdateLevelDialog component
"use client";

import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';

const levelFormSchema = z.object({
  level: z.string().min(1, "Please select a level."),
  review: z.string().min(10, "A brief review is required (min 10 characters)."),
});

type LevelFormValues = z.infer<typeof levelFormSchema>;

interface UpdateLevelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentLevel: string;
  onUpdateLevel: (newLevel: string, review: string) => Promise<boolean>;
}

export function UpdateLevelDialog({ isOpen, onOpenChange, currentLevel, onUpdateLevel }: UpdateLevelDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LevelFormValues>({
    resolver: zodResolver(levelFormSchema),
    defaultValues: {
      level: currentLevel,
      review: "",
    },
  });
  
  // Reset form when dialog opens with a new currentLevel
  useEffect(() => {
    form.reset({ level: currentLevel, review: "" });
  }, [currentLevel, form, isOpen]);

  const onSubmit = async (data: LevelFormValues) => {
    setIsLoading(true);
    const success = await onUpdateLevel(data.level, data.review);
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
          <DialogTitle>Update Student Level</DialogTitle>
          <DialogDescription>
            Change the student's level and provide a reason for the update. This will be recorded in their history.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student's new level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="review" render={({ field }) => (
              <FormItem>
                <FormLabel>Review / Reason for Change</FormLabel>
                <FormControl><Textarea placeholder="e.g., 'Student has mastered all intermediate techniques and is ready for advanced repertoire.'" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}