'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Rings } from '@/components/ui/rings'

interface AvatarInstructorProps {
  name: string
  avatar?: string
  state?: 'idle' | 'thinking' | 'speaking'
  className?: string
}

/**
 * Avatar animado para instructor IA con anillos orbitales
 *
 * Estados:
 * - idle: Sin anillos (instructor-card sidebar)
 * - thinking: Anillos rápidos (typing indicator)
 * - speaking: Anillos normales (último mensaje del chat)
 */
export function AvatarInstructor({
  name,
  avatar,
  state = 'idle',
  className,
}: AvatarInstructorProps) {
  const initial = name.charAt(0).toUpperCase()

  // Mapear estado a velocidad de los anillos
  const ringSpeed = state === 'thinking' ? 'fast' : state === 'speaking' ? 'normal' : 'slow'

  return (
    <div className={className}>
      <Avatar className="h-10 w-10 relative overflow-visible">
        <Rings size={40} speed={ringSpeed} />
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback
          className="bg-instructor-100 text-instructor-700 text-sm font-semibold"
        >
          {/* Inicial del instructor */}
          {initial}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}
