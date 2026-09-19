import React from 'react'
import { NavjyotiBrandHeader } from '@/components/ui/NavjyotiBrandHeader'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { createClient } from '@/lib/supabase/server-client'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string, success?: string }> }) {
  const params = await searchParams
  
  async function signUp(formData: FormData) {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    if (!email || !password) {
      redirect('/admin/signup?error=Please provide email and password')
    }
    
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Automatically sign in the user after sign up in this MVP
      }
    })
    
    if (error) {
      redirect(`/admin/signup?error=${encodeURIComponent(error.message)}`)
    }
    
    redirect('/admin')
  }
  
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center">
      <NavjyotiBrandHeader title="Admin Sign Up" />
      
      <div className="w-full max-w-md p-6 mt-10">
        <form action={signUp} className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant space-y-4">
          <h2 className="text-xl font-bold text-primary text-center mb-6">Create Account</h2>
          
          {params.error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-4 border border-red-200">
              {params.error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-on-surface mb-1">Email</label>
            <input 
              name="email" 
              type="email" 
              required
              className="w-full h-12 px-4 rounded-xl border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="admin@navjyoti.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-on-surface mb-1">Password</label>
            <input 
              name="password" 
              type="password" 
              required
              className="w-full h-12 px-4 rounded-xl border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="••••••••"
            />
            <p className="text-xs text-on-surface-variant mt-1">Minimum 6 characters.</p>
          </div>
          
          <PrimaryButton type="submit" className="w-full h-12 text-base mt-2">
            Sign Up
          </PrimaryButton>
          
          <div className="text-center mt-4 pt-4 border-t border-outline-variant">
            <p className="text-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link href="/admin/login" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
