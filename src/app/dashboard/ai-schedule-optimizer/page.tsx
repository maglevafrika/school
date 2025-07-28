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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bot, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { suggestClassSchedule } from "@/ai/flows/suggest-class-schedule";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AiScheduleOptimizerPage() {
  const [studentAvailabilities, setStudentAvailabilities] = useState('');
  const [teacherExpertise, setTeacherExpertise] = useState('');
  const [classroomCapacity, setClassroomCapacity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
        const input = {
            studentAvailabilities: JSON.parse(studentAvailabilities || '[]'),
            teacherExpertise: JSON.parse(teacherExpertise || '{}'),
            classroomCapacity: JSON.parse(classroomCapacity || '[]')
        }
      const response = await suggestClassSchedule(input);
      setResult(response);
    } catch (error: any) {
        console.error(error);
        try {
            // Check if it's a JSON parsing error
            JSON.parse(studentAvailabilities);
            JSON.parse(teacherExpertise);
            JSON.parse(classroomCapacity);
        } catch(jsonError: any) {
            toast({
                title: "Invalid JSON format",
                description: "Please check your JSON inputs. " + jsonError.message,
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        toast({
            title: "An error occurred",
            description: error.message || "Failed to generate schedule suggestion.",
            variant: "destructive",
        });
    } finally {
      setIsLoading(false);
    }
  };

  const fillSampleData = () => {
    setStudentAvailabilities(JSON.stringify([
      { "studentId": "S001", "availability": ["Monday 9-11", "Wednesday 10-12"] },
      { "studentId": "S002", "availability": ["Monday 9-11", "Thursday 14-16"] }
    ], null, 2));
    setTeacherExpertise(JSON.stringify({
      "TeacherA": "Oud",
      "TeacherB": "Ney"
    }, null, 2));
    setClassroomCapacity(JSON.stringify([
      { "classroomId": "C101", "capacity": 10, "subject": "Oud" },
      { "classroomId": "C102", "capacity": 8, "subject": "Ney" }
    ], null, 2));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Bot className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">AI Schedule Optimizer</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Schedule</CardTitle>
          <CardDescription>
            Input student availabilities, teacher expertise, and classroom capacities in JSON format to generate an optimized schedule.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentAvailabilities">Student Availabilities (JSON Array)</Label>
              <Textarea
                id="studentAvailabilities"
                placeholder='[{"studentId": "S001", "availability": ["Monday 9-11"]}]'
                value={studentAvailabilities}
                onChange={(e) => setStudentAvailabilities(e.target.value)}
                rows={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacherExpertise">Teacher Expertise (JSON Object)</Label>
              <Textarea
                id="teacherExpertise"
                placeholder='{"TeacherA": "Oud"}'
                value={teacherExpertise}
                onChange={(e) => setTeacherExpertise(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classroomCapacity">Classroom Capacity (JSON Array)</Label>
              <Textarea
                id="classroomCapacity"
                placeholder='[{"classroomId": "C101", "capacity": 10, "subject": "Oud"}]'
                value={classroomCapacity}
                onChange={(e) => setClassroomCapacity(e.target.value)}
                rows={3}
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
            <CardTitle>Optimized Schedule Suggestion</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTitle>Generated Schedule</AlertTitle>
              <AlertDescription>
                The AI has generated the following optimized schedule to minimize conflicts and maximize resource usage.
              </AlertDescription>
            </Alert>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Classroom</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.optimizedSchedule.map((slot: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{slot.timeSlot}</TableCell>
                    <TableCell>{slot.classroomId}</TableCell>
                    <TableCell>{slot.teacherId}</TableCell>
                    <TableCell>{slot.studentId}</TableCell>
                    <TableCell>{slot.subject}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Alert className="mt-6">
              <AlertTitle>Conflict Resolution</AlertTitle>
              <AlertDescription>
                {result.conflictResolution || "No major conflicts detected."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
