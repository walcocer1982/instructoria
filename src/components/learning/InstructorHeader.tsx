'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings } from 'lucide-react'

interface InstructorHeaderProps {
  instructorName: string
  instructorAvatar?: string
  instructorSpecialty?: string
  userName?: string
  userAvatar?: string
  onLogout?: () => void
}

export function InstructorHeader({
  instructorName,
  instructorAvatar,
  instructorSpecialty,
  userName = 'Usuario',
  userAvatar,
  onLogout,
}: InstructorHeaderProps) {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6">
      {/* Logo + Instructor Info */}
      <div className="flex items-center gap-6">
        {/* Logo Placeholder */}
        <div className="h-10 w-32 bg-gradient-to-r from-instructor-500 to-learning-500 rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">INSTRUCTORIA</span>
        </div>

        {/* Instructor Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-instructor-200">
            <AvatarImage src={instructorAvatar} alt={instructorName} />
            <AvatarFallback className="bg-instructor-100 text-instructor-700 text-sm font-semibold">
              {instructorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-instructor-600">
              Instructora: {instructorName}
            </span>
            {instructorSpecialty && (
              <span className="text-xs text-muted-foreground">{instructorSpecialty}</span>
            )}
          </div>
        </div>
      </div>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-student-100 text-student-700">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">Estudiante</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
