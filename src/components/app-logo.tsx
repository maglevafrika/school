import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import Image from "next/image";

export function AppLogo({ className }: { className?: string }) {
  const { customLogoUrl } = useAuth();
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {customLogoUrl ? (
        <Image src={customLogoUrl} alt="Custom Logo" width={32} height={32} className="rounded-md" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M17.5 1.5 22 6l-1 4-3.5-3.5-8.5 8.5L2 15l4-1 8.5-8.5L11 2l6.5-.5z"/>
            <path d="m22 6-5 5"/>
            <path d="M7.5 10.5 2 16l1 4 3.5-3.5"/>
            <path d="M14 7.5 10.5 11l-3 3-3.5 3.5L2 22l5-1.5 3.5-3.5 3-3"/>
        </svg>
      )}
      <h1 className="text-lg font-semibold text-sidebar-foreground">JadwalyAI</h1>
    </div>
  );
}
