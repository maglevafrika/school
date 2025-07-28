"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  User,
  Calendar,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { TeacherRequest } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function RequestsPage() {
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch requests from API route
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher-requests');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error: any) {
      console.error("Error fetching requests: ", error);
      toast({
        title: "Error fetching data",
        description: "Could not load teacher requests from the database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, action: "approved" | "denied") => {
    try {
      const response = await fetch('/api/teacher-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Update local state
      setRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? { ...request, status: action }
            : request
        )
      );

      toast({
        title: `Request ${action}`,
        description: `The request has been successfully ${action}.`,
      });
    } catch (error: any) {
      console.error(`Error updating request ${requestId}: `, error);
      toast({
        title: `Failed to ${action} request`,
        description: `There was a problem updating the request. ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getRequestTitle = (request: TeacherRequest) => {
    switch (request.type) {
      case "remove-student":
        return `Request to Remove Student`;
      case "change-time":
        return `Request to Change Time`;
      case "add-student":
        return `Request to Add Student`;
      default:
        return `New Request`;
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Teacher Requests</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pendingRequests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              There are no pending requests from teachers at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{getRequestTitle(request)}</span>
                  <Badge variant={
                    request.type === 'remove-student' 
                      ? 'destructive' 
                      : request.type === 'add-student'
                      ? 'default'
                      : 'secondary'
                  }>
                    {request.type.replace("-", " ")}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Submitted on{" "}
                  {format(new Date(request.date), "MMMM dd, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{request.details.studentName}</p>
                    <p className="text-muted-foreground">Student</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{request.teacherName}</p>
                    <p className="text-muted-foreground">Teacher</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{request.details.day}</p>
                    <p className="text-muted-foreground">Class Day</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{request.details.sessionTime}</p>
                    <p className="text-muted-foreground">Class Time</p>
                  </div>
                </div>
                <div className="border-l-2 pl-3 ml-1.5">
                  <p className="font-semibold text-muted-foreground">Reason:</p>
                  <p className="italic">"{request.details.reason}"</p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  className="w-full"
                  onClick={() => handleAction(request.id, "approved")}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleAction(request.id, "denied")}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Deny
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}