import { signIn } from '@/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-instructor-50 via-white to-learning-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-instructor-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">🎓</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Bienvenido a Instructoria
          </CardTitle>
          <CardDescription className="text-base">
            Tu plataforma de aprendizaje con instructores virtuales especializados
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Google OAuth - DESHABILITADO (solo usuarios corporativos) */}
          {/* <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/topics' })
            }}
          >
            <Button
              type="submit"
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
              variant="outline"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  style={{ fill: '#4285F4' }}
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  style={{ fill: '#34A853' }}
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  style={{ fill: '#FBBC05' }}
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  style={{ fill: '#EA4335' }}
                />
              </svg>
              Continuar con Google
            </Button>
          </form> */}

          <form
            action={async () => {
              'use server'
              await signIn('microsoft-entra-id', { redirectTo: '/topics' })
            }}
          >
            <Button
              type="submit"
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
              variant="outline"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 23 23">
                <path fill="#f35325" d="M0 0h11v11H0z" />
                <path fill="#81bc06" d="M12 0h11v11H12z" />
                <path fill="#05a6f0" d="M0 12h11v11H0z" />
                <path fill="#ffba08" d="M12 12h11v11H12z" />
              </svg>
              Continuar con Microsoft
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Seguro y confiable
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Al continuar, aceptas nuestros</p>
            <p>
              <a href="#" className="text-instructor-600 hover:underline">
                Términos de Servicio
              </a>
              {' y '}
              <a href="#" className="text-instructor-600 hover:underline">
                Política de Privacidad
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
