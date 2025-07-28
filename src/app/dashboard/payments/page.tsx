"use client";

import { useState, useEffect, useMemo } from 'react';
import type { StudentProfile, Installment } from "@/lib/types";

// Define missing types
type PaymentPlanType = 'monthly' | 'quarterly' | 'yearly';
type PaymentMethod = 'visa' | 'mada' | 'cash' | 'transfer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Wallet, FileText, CalendarClock, UserPlus, FileDown, Calendar as CalendarIcon, Edit, Printer } from "lucide-react";
import { format, isPast, isToday, addMonths, addQuarters, addYears, setDate, startOfDay } from 'date-fns';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/app-logo';

// --- Dialog Components ---

// 1. AssignPlanDialog
const assignPlanSchema = z.object({
  plan: z.enum(['monthly', 'quarterly', 'yearly']),
  startDate: z.date({ required_error: "A start date is required." }),
});

function AssignPlanDialog({ student, onPlanAssigned }: { student: StudentProfile, onPlanAssigned: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof assignPlanSchema>>({
        resolver: zodResolver(assignPlanSchema),
        defaultValues: {
            plan: (student.paymentPlan && student.paymentPlan !== 'none' ? student.paymentPlan : undefined) as PaymentPlanType | undefined,
            startDate: student.subscriptionStartDate ? new Date(student.subscriptionStartDate) : new Date(),
        }
    });

    const assignPaymentPlan = async (values: z.infer<typeof assignPlanSchema>) => {
        setIsLoading(true);
        const { plan, startDate } = values;
        
        try {
            const response = await fetch('/api/payments/assign-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: student.id,
                    plan,
                    startDate: startDate.toISOString(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to assign plan');
            }

            toast({ title: "Success", description: `Payment plan assigned to ${student.name}.` });
            onPlanAssigned();
            setIsOpen(false);
            form.reset();
        } catch (error: any) {
            console.error("Error assigning plan:", error);
            toast({ title: "Error", description: `Failed to assign plan. ${error.message}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><Edit className="mr-2" /> Assign / Change Plan</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Payment Plan to {student.name}</DialogTitle>
                    <DialogDescription>Select a plan and start date. This will generate installments for one year.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(assignPaymentPlan)} className="space-y-4">
                        <FormField control={form.control} name="plan" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Plan</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly (SAR 500)</SelectItem>
                                        <SelectItem value="quarterly">Quarterly (SAR 1500)</SelectItem>
                                        <SelectItem value="yearly">Yearly (SAR 5500)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="startDate" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Subscription Start Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Plan</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// 2. MarkAsPaidDialog
const markAsPaidSchema = z.object({
  paymentMethod: z.enum(['visa', 'mada', 'cash', 'transfer'], { required_error: "Payment method is required." }),
});

function MarkAsPaidDialog({ student, installment, onUpdate }: { student: StudentProfile, installment: Installment, onUpdate: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof markAsPaidSchema>>({
        resolver: zodResolver(markAsPaidSchema),
    });

    const handleMarkAsPaid = async (values: z.infer<typeof markAsPaidSchema>) => {
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/payments/mark-paid', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    installmentId: installment.id,
                    paymentMethod: values.paymentMethod,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to mark as paid');
            }

            toast({ title: "Success", description: "Payment recorded." });
            onUpdate();
            setIsOpen(false);
            form.reset();
        } catch (error: any) {
            console.error("Error marking as paid:", error);
            toast({ title: "Error", description: `Failed to update. ${error.message}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm">Mark as Paid</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Payment for Installment</DialogTitle>
                    <DialogDescription>Amount: SAR {installment.amount.toFixed(2)}. Due: {format(new Date(installment.dueDate), 'PPP')}</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleMarkAsPaid)} className="space-y-4">
                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a payment method" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="visa">Visa</SelectItem>
                                        <SelectItem value="mada">Mada</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="transfer">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Payment</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// 3. SetGracePeriodDialog
function SetGracePeriodDialog({ student, installment, onUpdate }: { student: StudentProfile, installment: Installment, onUpdate: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const originalDueDate = startOfDay(new Date(installment.dueDate));

    const handleSetGracePeriod = async () => {
        if (!date) {
            toast({ title: "Error", description: "Please select a new date.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/payments/set-grace-period', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    installmentId: installment.id,
                    gracePeriodDate: date.toISOString(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to set grace period');
            }

            toast({ title: "Success", description: "Grace period has been set." });
            onUpdate();
            setIsOpen(false);
            setDate(undefined);
        } catch (error: any) {
            console.error("Error setting grace period:", error);
            toast({ title: "Error", description: `Failed to update. ${error.message}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm"><CalendarClock className="mr-2 h-3 w-3" /> Grace Period</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Grace Period</DialogTitle>
                    <DialogDescription>Select a new due date for this installment.</DialogDescription>
                </DialogHeader>
                <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(day) => day < originalDueDate}
                    initialFocus
                />
                <DialogFooter>
                    <Button onClick={handleSetGracePeriod} disabled={!date || isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save New Date</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// 4. ChangeAllDueDatesDialog
function ChangeAllDueDatesDialog({ student, onUpdate }: { student: StudentProfile, onUpdate: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [day, setDay] = useState<string | undefined>(student.preferredPayDay?.toString());
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateDueDates = async () => {
        if (!day) {
            toast({ title: "Error", description: "Please select a day.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        const preferredDay = parseInt(day, 10);
        
        try {
            const response = await fetch('/api/payments/change-due-dates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: student.id,
                    preferredDay,
                    currentPreferredDay: student.preferredPayDay,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update due dates');
            }

            toast({ title: "Success", description: "Future due dates have been updated." });
            onUpdate();
            setIsOpen(false);
        } catch (error: any) {
            console.error("Error updating due dates:", error);
            toast({ title: "Error", description: `Failed to update. ${error.message}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><CalendarClock className="mr-2 h-4 w-4" /> Change All Due Dates</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change All Future Due Dates</DialogTitle>
                    <DialogDescription>Set a preferred day of the month for all future unpaid installments.</DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 py-4">
                    <Label htmlFor="day-select" className="shrink-0">Preferred Day of Month</Label>
                    <Select onValueChange={setDay} defaultValue={day}>
                        <SelectTrigger id="day-select" className="w-full"><SelectValue placeholder="Select a day" /></SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={handleUpdateDueDates} disabled={!day || isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Dates</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// 5. InvoiceDialog
function InvoiceDialog({ student, installment, summary, isOpen, onOpenChange }: { student: StudentProfile, installment: Installment, summary: { paid: number, due: number }, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    
    const handlePrint = () => {
        const printContent = document.getElementById('invoice-content');
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=800');
            printWindow?.document.write('<html><head><title>Invoice</title>');
            printWindow?.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">'); // Basic tailwind for printing
            printWindow?.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none; } }</style>');
            printWindow?.document.write('</head><body>');
            printWindow?.document.write(printContent.innerHTML);
            printWindow?.document.write('</body></html>');
            printWindow?.document.close();
            printWindow?.focus();
            setTimeout(() => { printWindow?.print(); }, 500);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0">
                <div id="invoice-content" className="p-8">
                    <header className="flex justify-between items-center pb-4 border-b">
                        <AppLogo />
                        <div className="text-right">
                            <h2 className="text-2xl font-bold">فاتورة / Invoice</h2>
                            <p className="text-muted-foreground">#{installment.invoiceNumber}</p>
                        </div>
                    </header>
                    <section className="grid grid-cols-2 gap-8 my-8">
                        <div>
                            <h3 className="font-semibold mb-2">الفاتورة إلى / Billed To:</h3>
                            <p>{student.name}</p>
                            <p>Student ID: {student.id}</p>
                        </div>
                        <div className="text-right">
                             <p><span className="font-semibold">تاريخ الفاتورة / Invoice Date:</span> {installment.paymentDate ? format(new Date(installment.paymentDate), 'yyyy-MM-dd') : 'N/A'}</p>
                             <p><span className="font-semibold">تاريخ الاستحقاق / Due Date:</span> {format(new Date(installment.dueDate), 'yyyy-MM-dd')}</p>
                        </div>
                    </section>
                    <section>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الوصف / Description</TableHead>
                                    <TableHead className="text-right">المبلغ / Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Installment for {student.paymentPlan} plan</TableCell>
                                    <TableCell className="text-right">SAR {installment.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                            <TableFooter>
                                 <TableRow>
                                    <TableCell>طريقة الدفع / Payment Method</TableCell>
                                    <TableCell className="text-right uppercase">{installment.paymentMethod}</TableCell>
                                </TableRow>
                                <TableRow className="font-bold text-lg">
                                    <TableCell>المجموع / Total</TableCell>
                                    <TableCell className="text-right">SAR {installment.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </section>
                    <section className="mt-8 border-t pt-4 text-sm">
                         <h4 className="font-semibold mb-2">ملخص الحساب / Account Summary</h4>
                         <div className="flex justify-between">
                            <p>إجمالي المدفوع / Total Paid:</p>
                            <p>SAR {summary.paid.toFixed(2)}</p>
                         </div>
                         <div className="flex justify-between">
                            <p>إجمالي المستحق / Total Due:</p>
                            <p>SAR {summary.due.toFixed(2)}</p>
                         </div>
                    </section>
                    <footer className="text-center text-xs text-muted-foreground mt-8">
                        <p>شكراً لتعاملكم معنا. / Thank you for your business.</p>
                        <p>بيت العود | Bait Al Oud</p>
                    </footer>
                </div>
                <DialogFooter className="p-4 border-t no-print bg-muted">
                    <Button onClick={handlePrint}><Printer className="mr-2"/> Print Invoice</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Page Component ---
export default function PaymentsPage() {
    const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [today, setToday] = useState<Date | null>(null);
    const [forceUpdate, setForceUpdate] = useState(0);

    const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

    // Fetch all students with their installments
    const fetchStudents = async () => {
        try {
            setLoading(true);
            
            const response = await fetch('/api/payments/students');
            if (!response.ok) {
                throw new Error('Failed to fetch students');
            }
            
            const students = await response.json();
            setAllStudents(students);
        } catch (error) {
            console.error("Error fetching students:", error);
            setAllStudents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setToday(new Date()); // Avoid hydration mismatch
        fetchStudents();
    }, [forceUpdate]);
    
    const getStatus = (installment: Installment): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
        if (installment.status === 'paid') return { text: 'Paid', variant: 'default' };
        if (!today) return { text: 'Unpaid', variant: 'secondary' }; // Default before hydration
        const dueDate = new Date(installment.gracePeriodUntil || installment.dueDate);
        if (isPast(dueDate) && !isToday(dueDate)) return { text: 'Overdue', variant: 'destructive' };
        return { text: 'Unpaid', variant: 'secondary' };
    };
    
    const categorizedStudents = useMemo(() => {
        const lists: {
            overdue: StudentProfile[];
            upToDate: StudentProfile[];
            planNotSet: StudentProfile[];
            cancelled: StudentProfile[];
        } = { overdue: [], upToDate: [], planNotSet: [], cancelled: [] };
        
        if (!today) return lists;

        allStudents.forEach(student => {
            const isActive = student.enrolledIn && student.enrolledIn.length > 0;
            if (!isActive && student.installments && student.installments.length > 0) {
                lists.cancelled.push(student);
            } else if (!student.paymentPlan || student.paymentPlan === 'none' || !student.installments) {
                if (isActive) {
                    lists.planNotSet.push(student);
                }
            } else {
                const isOverdue = student.installments.some(inst => getStatus(inst).text === 'Overdue');
                if (isOverdue) {
                    lists.overdue.push(student);
                } else {
                    lists.upToDate.push(student);
                }
            }
        });
        return lists;
    }, [allStudents, today]);

    const selectedStudent = useMemo(() => {
        return allStudents.find(s => s.id === selectedStudentId);
    }, [allStudents, selectedStudentId]);

    const paymentSummary = useMemo(() => {
        if (!selectedStudent || !selectedStudent.installments) return { paid: 0, due: 0, nextDueDate: null };
        const summary = selectedStudent.installments.reduce((acc, inst) => {
            if (inst.status === 'paid') acc.paid += inst.amount;
            else acc.due += inst.amount;
            return acc;
        }, { paid: 0, due: 0 });
        
        const nextDueDate = selectedStudent.installments
            .filter(i => i.status === 'unpaid')
            .map(i => new Date(i.dueDate))
            .sort((a,b) => a.getTime() - b.getTime())[0];
        return { ...summary, nextDueDate: nextDueDate ? format(nextDueDate, 'yyyy-MM-dd') : null };
    }, [selectedStudent]);

    const handleRefresh = () => {
        setForceUpdate(prev => prev + 1);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <Wallet className="w-8 h-8" />
                    Payment Management
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Student Categories */}
                <div className="lg:col-span-2 space-y-4">
                    <Accordion type="multiple" defaultValue={["overdue", "planNotSet"]} className="w-full">
                        {/* Overdue Students */}
                        <AccordionItem value="overdue">
                            <AccordionTrigger className="text-lg font-semibold text-red-700">
                                Overdue Students ({categorizedStudents.overdue.length})
                            </AccordionTrigger>
                            <AccordionContent>
                                {categorizedStudents.overdue.length === 0 ? (
                                    <p className="text-muted-foreground">No overdue students.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {categorizedStudents.overdue.map(student => (
                                            <Card key={student.id} className="border-red-200 bg-red-50">
                                                <CardContent className="p-4 flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-medium">{student.name}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Plan: {student.paymentPlan}
                                                        </p>
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => setSelectedStudentId(student.id)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>

                        {/* Plan Not Set */}
                        <AccordionItem value="planNotSet">
                            <AccordionTrigger className="text-lg font-semibold text-orange-700">
                                Payment Plan Not Set ({categorizedStudents.planNotSet.length})
                            </AccordionTrigger>
                            <AccordionContent>
                                {categorizedStudents.planNotSet.length === 0 ? (
                                    <p className="text-muted-foreground">All active students have payment plans.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {categorizedStudents.planNotSet.map(student => (
                                            <Card key={student.id} className="border-orange-200 bg-orange-50">
                                                <CardContent className="p-4 flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-medium">{student.name}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Enrolled in {student.enrolledIn?.length} session(s)
                                                        </p>
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => setSelectedStudentId(student.id)}
                                                    >
                                                        Set Plan
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>

                        {/* Up to Date Students */}
                        <AccordionItem value="upToDate">
                            <AccordionTrigger className="text-lg font-semibold text-green-700">
                                Up to Date Students ({categorizedStudents.upToDate.length})
                            </AccordionTrigger>
                            <AccordionContent>
                                {categorizedStudents.upToDate.length === 0 ? (
                                    <p className="text-muted-foreground">No students are up to date.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {categorizedStudents.upToDate.map(student => (
                                            <Card key={student.id} className="border-green-200 bg-green-50">
                                                <CardContent className="p-4 flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-medium">{student.name}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Plan: {student.paymentPlan}
                                                        </p>
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => setSelectedStudentId(student.id)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>

                        {/* Cancelled Students */}
                        <AccordionItem value="cancelled">
                            <AccordionTrigger className="text-lg font-semibold text-gray-700">
                                Cancelled Students ({categorizedStudents.cancelled.length})
                            </AccordionTrigger>
                            <AccordionContent>
                                {categorizedStudents.cancelled.length === 0 ? (
                                    <p className="text-muted-foreground">No cancelled students with payment history.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {categorizedStudents.cancelled.map(student => (
                                            <Card key={student.id} className="border-gray-200 bg-gray-50">
                                                <CardContent className="p-4 flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-medium">{student.name}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Not enrolled in any sessions
                                                        </p>
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => setSelectedStudentId(student.id)}
                                                    >
                                                        View History
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                {/* Right Panel - Student Details */}
                <div className="space-y-4">
                    {selectedStudent ? (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserPlus className="w-5 h-5" />
                                        {selectedStudent.name}
                                    </CardTitle>
                                    <CardDescription>
                                        Payment Plan: {selectedStudent.paymentPlan || 'Not Set'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Total Paid</p>
                                            <p className="font-semibold text-green-600">SAR {paymentSummary.paid.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Total Due</p>
                                            <p className="font-semibold text-red-600">SAR {paymentSummary.due.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    {paymentSummary.nextDueDate && (
                                        <div>
                                            <p className="text-muted-foreground text-sm">Next Due Date</p>
                                            <p className="font-semibold">{paymentSummary.nextDueDate}</p>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                    <AssignPlanDialog student={selectedStudent} onPlanAssigned={handleRefresh} />
                                    <ChangeAllDueDatesDialog student={selectedStudent} onUpdate={handleRefresh} />
                                </CardFooter>
                            </Card>

                            {selectedStudent.installments && selectedStudent.installments.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            Installments
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {selectedStudent.installments.map(installment => {
                                                const status = getStatus(installment);
                                                return (
                                                    <div key={installment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                        <div>
                                                            <p className="font-medium">SAR {installment.amount.toFixed(2)}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Due: {format(new Date(installment.dueDate), 'MMM dd, yyyy')}
                                                            </p>
                                                            {installment.gracePeriodUntil && (
                                                                <p className="text-xs text-orange-600">
                                                                    Grace until: {format(new Date(installment.gracePeriodUntil), 'MMM dd, yyyy')}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={status.variant}>{status.text}</Badge>
                                                            {installment.status === 'unpaid' && (
                                                                <div className="flex gap-1">
                                                                    <MarkAsPaidDialog 
                                                                        student={selectedStudent} 
                                                                        installment={installment} 
                                                                        onUpdate={handleRefresh} 
                                                                    />
                                                                    <SetGracePeriodDialog 
                                                                        student={selectedStudent} 
                                                                        installment={installment} 
                                                                        onUpdate={handleRefresh} 
                                                                    />
                                                                </div>
                                                            )}
                                                            {installment.status === 'paid' && installment.invoiceNumber && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedInstallment(installment);
                                                                        setIsInvoiceOpen(true);
                                                                    }}
                                                                >
                                                                    <FileDown className="mr-2 h-3 w-3" /> Invoice
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Select a Student</h3>
                                <p className="text-muted-foreground">Choose a student from the left panel to view their payment details.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Invoice Dialog */}
            {selectedInstallment && (
                <InvoiceDialog 
                    student={selectedStudent!} 
                    installment={selectedInstallment} 
                    summary={paymentSummary}
                    isOpen={isInvoiceOpen}
                    onOpenChange={setIsInvoiceOpen}
                />
            )}
        </div>
    );
}