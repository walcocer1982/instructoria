'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface InstructorCardProps {
  instructorName: string
  instructorAvatar?: string
  instructorSpecialty?: string
}

export function InstructorCard({
  instructorName,
  instructorAvatar,
  instructorSpecialty,
}: InstructorCardProps) {
  return (
    <div className="bg-white border border-instructor-200 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-instructor-300">
          <AvatarImage src={instructorAvatar} alt={instructorName} />
          <AvatarFallback className="bg-instructor-100 text-instructor-700 text-xs font-semibold">
            {instructorName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-instructor-700 truncate">
            {instructorName}
          </div>
          {instructorSpecialty && (
            <div className="text-xs text-muted-foreground truncate">
              {instructorSpecialty}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
