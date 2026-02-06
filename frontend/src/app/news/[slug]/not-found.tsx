import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-6xl font-black text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        The article you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Link href="/news">
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to News
        </Button>
      </Link>
    </div>
  );
}
