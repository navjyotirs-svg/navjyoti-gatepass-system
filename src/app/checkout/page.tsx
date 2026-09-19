'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { processSelfCheckout } from '@/app/actions/checkoutActions';
import { ArrowLeft, CheckCircle2, LogOut } from 'lucide-react';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [visitorName, setVisitorName] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await processSelfCheckout(formData);
    
    if (res.success) {
      setVisitorName(res.visitorName || 'Visitor');
      setSuccess(true);
    } else {
      setError(res.message || 'An error occurred.');
    }
    
    setLoading(false);
  }

  if (success) {
    return (
      <main className="min-h-[100dvh] relative flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/visit-bg-new.jpg" alt="Background" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </div>
        
        <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-500">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-2xl text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-3xl font-black text-white leading-tight mb-2">Check Out<br/>Successful</h1>
            <p className="text-lg text-white/80 font-medium mb-6">Thank you for visiting Navjyoti, {visitorName}!</p>
            <p className="text-sm text-white/50 mb-8">Your exit time has been securely logged.</p>
            
            <Link href="/" className="inline-flex w-full items-center justify-center h-14 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 font-bold text-white transition-colors">
              Return to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] relative flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/visit-bg-new.jpg" alt="Background" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white font-bold mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back
        </Link>
        
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-[2rem] shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-lg shrink-0">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Check Out</h1>
              <p className="text-white/60 text-sm font-medium">Leaving the premises?</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-white mb-2">Mobile or Pass Number</label>
              <input 
                type="text" 
                name="identifier" 
                required
                placeholder="e.g. 9876543210 or NGP-..."
                className="w-full h-14 px-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 transition-all text-lg"
              />
              <p className="mt-2 text-xs text-white/40 font-medium">Enter the mobile number you used to apply, or your exact Gate Pass number.</p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-error/20 border border-error/50 text-error text-sm font-bold text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-lg shadow-xl hover:shadow-rose-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Confirm Check Out'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
