import { Card, CardContent } from "@/components/ui/card"
import { Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface ObjectiveCardProps {
  objective: string
  className?: string
}

export function ObjectiveCard({ objective, className }: ObjectiveCardProps) {
  return (
    <Card className={cn("border-l-4 border-l-primary", className)}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Target className="h-6 w-6 text-primary mt-1 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Objetivo de Aprendizaje
            </h3>
            <p className="text-base leading-relaxed text-foreground">
              {objective}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
