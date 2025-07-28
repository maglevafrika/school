"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
// Remove this line: import { db } from "@/lib/db"; 
import type { 
  StudentProfile, 
  Grade, 
  Evaluation, 
  LevelChange
} from "@/lib/types";

interface StudentProfileContextType {
  student: StudentProfile | null;
  loading: boolean;
  handleAddGrade: (gradeData: Omit<Grade, 'id'>) => Promise<boolean>;
  handleUpdateStudentLevel: (newLevel: string, review: string) => Promise<boolean>;
  handleEvaluateStudent: (evaluationData: Omit<Evaluation, 'id'>) => Promise<boolean>;
}

const StudentProfileContext = createContext<StudentProfileContextType | undefined>(undefined);

export function StudentProfileProvider({ children, studentId }: { children: ReactNode; studentId: string; }) {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch student data via API
  const fetchStudentData = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/students/${studentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch student data');
      }
      
      const studentData = await response.json();
      setStudent(studentData);
    } catch (error) {
      console.error("Error fetching student:", error);
      setStudent(null);
      toast({ 
        title: "Error", 
        description: "Failed to load student data.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [studentId, toast]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);
  
  const handleAddGrade = useCallback(async (gradeData: Omit<Grade, 'id'>): Promise<boolean> => {
    if (!studentId) return false;
    
    try {
      const response = await fetch(`/api/students/${studentId}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gradeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add grade');
      }

      // Refresh student data to reflect the new grade
      await fetchStudentData();
      
      toast({ title: "Grade Added", description: "The new grade has been successfully recorded." });
      return true;
    } catch (error: any) {
      console.error("Error adding grade:", error);
      toast({ title: "Error", description: `Failed to add grade. ${error.message}`, variant: "destructive" });
      return false;
    }
  }, [studentId, toast, fetchStudentData]);

  const handleUpdateStudentLevel = useCallback(async (newLevel: string, review: string): Promise<boolean> => {
    if (!studentId || !student) return false;
    
    if (newLevel === student.level) {
      toast({ title: "No Change", description: "The selected level is the same as the current level.", variant: "default" });
      return false;
    }

    try {
      const response = await fetch(`/api/students/${studentId}/level`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newLevel,
          review,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update level');
      }

      // Refresh student data
      await fetchStudentData();
      
      toast({ title: "Level Updated", description: `${student.name}'s level has been changed to ${newLevel}.` });
      return true;
    } catch (error: any) {
      console.error("Error updating level:", error);
      toast({ title: "Error", description: `Failed to update level. ${error.message}`, variant: "destructive" });
      return false;
    }
  }, [studentId, student, toast, fetchStudentData]);

  const handleEvaluateStudent = useCallback(async (evaluationData: Omit<Evaluation, 'id'>): Promise<boolean> => {
    if (!studentId) return false;
    
    try {
      const response = await fetch(`/api/students/${studentId}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add evaluation');
      }

      // Refresh student data to reflect the new evaluation
      await fetchStudentData();
      
      toast({ title: "Evaluation Added", description: "The new evaluation has been successfully recorded." });
      return true;
    } catch (error: any) {
      console.error("Error adding evaluation:", error);
      toast({ title: "Error", description: `Failed to add evaluation. ${error.message}`, variant: "destructive" });
      return false;
    }
  }, [studentId, toast, fetchStudentData]);

  const value = { student, loading, handleAddGrade, handleUpdateStudentLevel, handleEvaluateStudent };

  return <StudentProfileContext.Provider value={value}>{children}</StudentProfileContext.Provider>;
}

export function useStudentProfile() {
  const context = useContext(StudentProfileContext);
  if (context === undefined) {
    throw new Error('useStudentProfile must be used within a StudentProfileProvider');
  }
  return context;
}