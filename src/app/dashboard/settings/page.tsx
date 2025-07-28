
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { customLogoUrl, setCustomLogo } = useAuth();
  const { toast } = useToast();
  const [newLogoUrl, setNewLogoUrl] = useState(customLogoUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    setIsLoading(true);
    setCustomLogo(newLogoUrl);
    toast({
      title: "Settings Saved",
      description: "Your new logo has been applied.",
    });
    setIsLoading(false);
  };

  const handleReset = () => {
    setIsLoading(true);
    setNewLogoUrl('');
    setCustomLogo(null);
    toast({
      title: "Logo Reset",
      description: "The default logo has been restored.",
    });
    setIsLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Settings className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Application Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customize Application</CardTitle>
          <CardDescription>Change global settings for the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Custom Logo URL</Label>
              <Input 
                id="logoUrl"
                placeholder="https://example.com/logo.png"
                value={newLogoUrl}
                onChange={(e) => setNewLogoUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter the full URL of an image to use as a custom logo in the sidebar.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>Reset to Default</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
