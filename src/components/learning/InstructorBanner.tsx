'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface InstructorBannerProps {
  instructorName: string
  instructorAvatar?: string
  instructorSpecialty?: string
}

export function InstructorBanner({
  instructorName,
  instructorAvatar,
  instructorSpecialty,
}: InstructorBannerProps) {
  return (
    <div className="h-14 border-b bg-instructor-50/50 flex items-center px-6">
      {/* Instructor Info */}
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border-2 border-instructor-300">
          <AvatarImage src={instructorAvatar} alt={instructorName} />
          <AvatarFallback className="bg-instructor-100 text-instructor-700 text-sm font-semibold">
            {instructorName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-instructor-700">
            Instructora: {instructorName}
          </span>
          {instructorSpecialty && (
            <span className="text-xs text-muted-foreground">{instructorSpecialty}</span>
          )}
        </div>
      </div>
    </div>
  )
}
