"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { suggestGrades } from "@/ai/flows/suggest-grades";
import { useToast } from "@/hooks/use-toast";

export default function AiGradeSuggesterPage() {
  const [attendanceRecords, setAttendanceRecords] = useState('');
  const [evaluations, setEvaluations] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ suggestedGrade: string; reasoning: string } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await suggestGrades({ attendanceRecords, evaluations, subject });
      setResult(response);
    } catch (error: any) {
        console.error(error);
        toast({
            title: "An error occurred",
            description: error.message || "Failed to generate grade suggestion.",
            variant: "destructive",
        });
    } finally {
      setIsLoading(false);
    }
  };

  const fillSampleData = () => {
    setSubject("Oud");
    setAttendanceRecords("Attended 18/20 sessions. 2 absences were excused with a doctor's note.");
    setEvaluations("Showed excellent progress in maqam recognition. Needs improvement in rhythmic precision. Teacher evaluation score: 85/100. Mid-term practical exam: 92/100.");
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <GraduationCap className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">AI Grade Suggester</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suggest a Grade</CardTitle>
          <CardDescription>
            Provide student's attendance records and evaluations to receive an AI-powered grade suggestion.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                    id="subject"
                    placeholder="e.g., Oud, Nay, Music Theory"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendance">Attendance Records</Label>
              <Textarea
                id="attendance"
                placeholder="e.g., Attended 15/20 classes. 3 unexcused absences."
                value={attendanceRecords}
                onChange={(e) => setAttendanceRecords(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evaluations">Evaluations & Performance</Label>
              <Textarea
                id="evaluations"
                placeholder="e.g., Mid-term score: 88%. Strong practical skills but struggles with theory."
                value={evaluations}
                onChange={(e) => setEvaluations(e.target.value)}
                rows={5}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={fillSampleData}>Fill Sample Data</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Suggestion
            </Button>
          </CardFooter>
        </form>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>AI Grade Suggestion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle className="text-2xl font-bold text-primary">{result.suggestedGrade}</AlertTitle>
              <AlertDescription>
                This is the AI's suggested grade based on the provided data.
              </AlertDescription>
            </Alert>
            <Alert variant="default" className="mt-4">
                <AlertTitle>Reasoning</AlertTitle>
                <AlertDescription>
                   <p className="whitespace-pre-wrap">{result.reasoning}</p>
                </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
