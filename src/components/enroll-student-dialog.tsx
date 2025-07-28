"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/db";
import { StudentProfile, Semester, Session } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";

const enrollStudentSchema = z.object({
  studentId: z.string().min(1, "Please select a student."),
  sessionIds: z.array(z.string()).min(1, "Please select at least one session."),
});

type EnrollStudentFormValues = z.infer<typeof enrollStudentSchema>;

interface EnrollStudentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentProfile[];
  semester: Semester;
  onEnrollmentSuccess: () => void;
}

export function EnrollStudentDialog({ isOpen, onOpenChange, students, semester, onEnrollmentSuccess }: EnrollStudentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EnrollStudentFormValues>({
    resolver: zodResolver(enrollStudentSchema),
    defaultValues: {
      studentId: "",
      sessionIds: [],
    },
  });
  
  const allSessions = useMemo(() => {
    if (!semester) return [];
    return Object.entries(semester.masterSchedule).flatMap(([teacher, schedule]) => 
        Object.entries(schedule).flatMap(([day, sessions]) => 
            sessions.map(session => ({
                ...session,
                teacher,
                day
            }))
        )
    )
  }, [semester]);

  async function onSubmit(data: EnrollStudentFormValues) {
    setIsLoading(true);
    const studentToEnroll = students.find(s => s.id === data.studentId);

    if (!studentToEnroll) {
      toast({ title: "Error", description: "Student not found.", variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
        // Start transaction
        await db.query('START TRANSACTION');

        // Get current semester data
        const getSemesterQuery = `
          SELECT * FROM semesters 
          WHERE id = ?
        `;
        const [semesterRows] = await db.query(getSemesterQuery, [semester.id]) as [any[], any];
        
        if (semesterRows.length === 0) {
          throw new Error("Semester not found");
        }

        const semesterData = semesterRows[0];
        const updatedMasterSchedule = JSON.parse(JSON.stringify(semester.masterSchedule)); // Deep copy from props
        const newEnrollments = [];

        // Process each selected session
        for (const sessionIdWithTeacher of data.sessionIds) {
            const [sessionId, teacher, day] = sessionIdWithTeacher.split('|');

            // Check if session exists in database
            const checkSessionQuery = `
              SELECT id FROM sessions 
              WHERE id = ? AND semester_id = ? AND teacher_name = ?
            `;
            const [sessionRows] = await db.query(checkSessionQuery, [sessionId, semester.id, teacher]) as [any[], any];
            
            if (sessionRows.length === 0) {
              throw new Error(`Session ${sessionId} not found`);
            }

            // Check if student is already enrolled in this session
            const checkEnrollmentQuery = `
              SELECT id FROM session_students 
              WHERE session_id = ? AND student_id = ?
            `;
            const [existingEnrollment] = await db.query(checkEnrollmentQuery, [sessionId, data.studentId]) as [any[], any];
            
            if (existingEnrollment.length === 0) {
              // Add student to session_students table
              const enrollmentId = `SE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const insertEnrollmentQuery = `
                INSERT INTO session_students (
                  id, session_id, student_id, pending_removal, created_at, updated_at
                ) VALUES (?, ?, ?, false, NOW(), NOW())
              `;
              await db.query(insertEnrollmentQuery, [enrollmentId, sessionId, data.studentId]);

              // Prepare enrollment data for student's enrolledIn array
              newEnrollments.push({ semesterId: semester.id, teacher, sessionId });

              // Update the master schedule in our copied object
              const daySessions = updatedMasterSchedule[teacher]?.[day];
              if(daySessions) {
                  const sessionIndex = daySessions.findIndex((s: Session) => s.id === sessionId);
                  if (sessionIndex !== -1) {
                      const studentInSession = daySessions[sessionIndex].students.some((s: any) => s.id === data.studentId);
                      if (!studentInSession) {
                          const studentData = { id: studentToEnroll.id, name: studentToEnroll.name, attendance: null, pendingRemoval: false };
                          updatedMasterSchedule[teacher][day][sessionIndex].students.push(studentData);
                      }
                  }
              }
            }
        }

        // Update semester's master schedule in database
        const updateSemesterQuery = `
          UPDATE semesters 
          SET teachers_json = ?, updated_at = NOW()
          WHERE id = ?
        `;
        // Note: We're updating teachers_json but storing the full master schedule structure
        // You might need to add a master_schedule_json column to your schema for this
        // For now, I'll assume the master schedule is reconstructed from sessions and session_students
        
        // Get current student's enrolledIn data
        const getStudentQuery = `
          SELECT ss.session_id, s.semester_id, s.teacher_name
          FROM session_students ss
          JOIN sessions s ON ss.session_id = s.id
          WHERE ss.student_id = ? AND ss.pending_removal = false
        `;
        const [currentEnrollments] = await db.query(getStudentQuery, [data.studentId]) as [any[], any];
        
        // Build the complete enrolledIn array
        const allEnrollments = currentEnrollments.map((row: any) => ({
          semesterId: row.semester_id,
          teacher: row.teacher_name,
          sessionId: row.session_id
        }));

        // Update the students table with the new enrolledIn data
        const updateStudentQuery = `
          UPDATE students
          SET enrolled_in = ?
          WHERE id = ?
        `;
        await db.query(updateStudentQuery, [JSON.stringify(allEnrollments), data.studentId]);

        // Commit transaction
        await db.query('COMMIT');
        
        toast({ title: "Enrollment Successful", description: `${studentToEnroll.name} has been enrolled.` });
        onEnrollmentSuccess();
        onOpenChange(false);
        form.reset();
    } catch (error: any) {
        // Rollback transaction on error
        await db.query('ROLLBACK');
        console.error("Enrollment failed:", error);
        toast({ title: "Enrollment Failed", description: error.message, variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enroll Student in Semester</DialogTitle>
          <DialogDescription>
            Select a student and the classes they will attend for the "{semester.name}" semester.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student to enroll" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>{student.name} ({student.level})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sessionIds"
              render={() => (
                 <FormItem>
                    <FormLabel>Classes</FormLabel>
                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                        <div className="space-y-4">
                            {Object.entries(semester.masterSchedule).map(([teacher, days]) => (
                                <div key={teacher}>
                                    <h4 className="font-medium text-sm mb-2">{teacher}</h4>
                                    <div className="space-y-2 pl-2">
                                    {Object.entries(days).map(([day, sessions]) => (
                                        sessions.map(session => (
                                        <FormField
                                            key={`${session.id}|${teacher}|${day}`}
                                            control={form.control}
                                            name="sessionIds"
                                            render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(`${session.id}|${teacher}|${day}`)}
                                                    onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...(field.value || []), `${session.id}|${teacher}|${day}`])
                                                        : field.onChange(
                                                            field.value?.filter(
                                                            (value) => value !== `${session.id}|${teacher}|${day}`
                                                            )
                                                        );
                                                    }}
                                                />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    {day} at {session.time} ({session.specialization})
                                                </FormLabel>
                                            </FormItem>
                                            )}
                                        />
                                        ))
                                    ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enroll Student
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}