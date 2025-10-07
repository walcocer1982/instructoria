/**
 * Layout compartido para páginas del profesor
 * Incluye header, navegación y logout
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen, BarChart3, Home } from 'lucide-react';

interface TeacherLayoutProps {
  children: React.ReactNode;
  userName?: string;
}

export function TeacherLayout({ children, userName }: TeacherLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navItems = [
    { href: '/teacher', label: 'Dashboard', icon: Home },
    { href: '/teacher/lessons', label: 'Lecciones', icon: BookOpen },
    { href: '/teacher/evaluations', label: 'Evaluaciones', icon: BarChart3 },
  ];

  const isActive = (href: string) => {
    if (href === '/teacher') {
      return pathname === '/teacher';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-xl">SOPHI</span>
            </div>

            {/* Navegación */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant={isActive(item.href) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => router.push(item.href)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* User info + Logout */}
          <div className="flex items-center gap-4">
            {userName && (
              <div className="hidden sm:block">
                <p className="text-sm text-muted-foreground">
                  👨‍🏫 {userName}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}
