import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CriteriaChecklistProps {
  criterios: string[]
  criteriosCumplidos: string[]
  className?: string
}

export function CriteriaChecklist({
  criterios,
  criteriosCumplidos,
  className
}: CriteriaChecklistProps) {
  const isCumplido = (criterio: string) => {
    return criteriosCumplidos.some(c =>
      c.toLowerCase().includes(criterio.toLowerCase()) ||
      criterio.toLowerCase().includes(c.toLowerCase())
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
        ✅ Puntos Clave
      </h3>

      <div className="space-y-2">
        {criterios.map((criterio, index) => {
          const cumplido = isCumplido(criterio)

          return (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                cumplido ? "bg-secondary/10 border-secondary/30" : "bg-muted/30 border-border"
              )}
            >
              {cumplido && (
                <div className="mt-0.5 shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                </div>
              )}
              <p className={cn(
                "text-sm leading-relaxed transition-all",
                cumplido ? "text-secondary font-medium" : "text-foreground"
              )}>
                {criterio}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
