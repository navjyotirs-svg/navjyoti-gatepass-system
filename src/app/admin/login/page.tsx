import React from 'react'
import { createClient } from '@/lib/supabase/server-client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  
  async function signIn(formData: FormData) {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    if (!email || !password) {
      redirect('/admin/login?error=Please provide email and password')
    }
    
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      redirect(`/admin/login?error=${encodeURIComponent(error.message)}`)
    }
    
    redirect('/admin')
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/visit-bg-new.jpg" 
          alt="Background" 
          fill 
          className="object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0133a1]/80 to-slate-900/95" />
      </div>

      <div className="z-10 w-full max-w-[420px] p-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
          
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-48 h-16 mb-4 bg-white/90 p-2 rounded-xl shadow-inner">
              <Image 
                src="/navjyoti-brand-logo-3d.png" 
                alt="Navjyoti Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide uppercase">Admin Portal</h1>
            <p className="text-white/70 text-sm mt-1">Sign in to manage gate pass requests</p>
          </div>

          <form action={signIn} className="space-y-5">
            {params.error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm mb-4 backdrop-blur-sm font-medium flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {params.error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-white/90 ml-1">Email Address</label>
              <div className="relative">
                <input 
                  name="email" 
                  type="email" 
                  required
                  defaultValue="admin@navjyoti.com"
                  className="w-full h-12 pl-4 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:bg-white/10 focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] outline-none transition-all"
                  placeholder="admin@navjyoti.com"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-white/90 ml-1">Password</label>
              <div className="relative">
                <input 
                  name="password" 
                  type="password" 
                  required
                  className="w-full h-12 pl-4 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:bg-white/10 focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button type="submit" className="w-full h-12 mt-4 bg-gradient-to-r from-[#FF6A00] to-[#e65c00] hover:from-[#ff7a1a] hover:to-[#ff6a00] text-white font-bold rounded-xl shadow-lg shadow-[#FF6A00]/20 transition-all transform active:scale-[0.98]">
              SIGN IN
            </button>
            
            <div className="text-center mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-white/60">
                Don't have an account?{' '}
                <Link href="/admin/signup" className="text-white font-bold hover:text-[#FF6A00] transition-colors">
                  Request Access
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
