import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({ title, description, ctaTo, ctaLabel }: { title: string; description: string; ctaTo?: string; ctaLabel?: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-lg">📋</span>
        </div>
        <h3 className="font-medium text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{description}</p>
        {ctaTo && (
          <Link to={ctaTo} className="inline-flex mt-4 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
            {ctaLabel ?? "Open"}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
