import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-md mx-4 bg-card border-border shadow-2xl">
        <CardContent className="pt-6 pb-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold font-display text-foreground">404 Page Not Found</h1>
          </div>
          
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            The page you are looking for does not exist or has been moved. 
            Return to the homepage to create a new 3D world.
          </p>

          <div className="mt-8">
            <Link href="/" className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-all duration-200">
              Return to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
