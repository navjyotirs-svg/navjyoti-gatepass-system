import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const supabaseResponse = await updateSession(request)
  
  // Custom logic to protect the /admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check if the user is authenticated by fetching the token from the response or request
    // Alternatively, we can use the supabase client created in updateSession
    // But since middleware in Supabase SSR requires us to just use the updated response,
    // it's cleaner to check auth state here.
    
    // Session already refreshed via updateSession; no lightweight cookie check needed
    
    // For robust check, we could import createServerClient again and use getUser(),
    // but the session is already updated by updateSession.
    
    if (
      !request.nextUrl.pathname.startsWith('/admin/login') && 
      !request.nextUrl.pathname.startsWith('/admin/signup')
    ) {
      // Let's use a full client check to be safe
      const { createServerClient } = await import('@supabase/ssr')
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll() {} // read-only in proxy
          }
        }
      )
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
