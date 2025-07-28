import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default function PlaceholderPage({ title, icon: Icon = Construction }: { title: string, icon?: LucideIcon }) {
  return (
    <div className="flex items-center justify-center h-[80vh]">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-4 text-2xl font-headline">
                    <Icon className="w-8 h-8 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This page is currently under construction. Please check back later!</p>
            </CardContent>
        </Card>
    </div>
  );
}
