'use client'

import { AvatarInstructor } from './avatar-instructor'

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
    <div className="bg-white border rounded-lg p-3">
      <div className="flex items-center gap-3">
        <AvatarInstructor
          name={instructorName}
          avatar={instructorAvatar}
          state="idle"
        />
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
