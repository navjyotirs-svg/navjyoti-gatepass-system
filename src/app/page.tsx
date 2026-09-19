import Link from 'next/link';
import Image from 'next/image';
import { UserPlus, LogOut, ShieldCheck } from 'lucide-react';

export default function KioskHub() {
  return (
    <main className="min-h-[100dvh] relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/visit-bg-new.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="relative w-full max-w-[360px] sm:max-w-[420px] -mt-6 -mb-8 sm:-mb-12 flex justify-center">
            <Image 
              src="/welcome-logo-white.png" 
              alt="Navjyoti" 
              width={420}
              height={140}
              className="object-contain drop-shadow-2xl" 
              priority 
            />
          </div>
          <p className="text-white/70 font-medium text-lg tracking-wide z-10 relative">Please select an option below</p>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <Link href="/visit" className="group relative w-full flex items-center justify-between p-6 rounded-3xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 shadow-xl transition-all hover:scale-[1.02] active:scale-95">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
                <UserPlus className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-white leading-tight">Visitor Entry</h2>
                <p className="text-sm font-medium text-white/50 mt-1">Apply for a new gate pass</p>
              </div>
            </div>
            <div className="text-white/30 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>

          <Link href="/checkout" className="group relative w-full flex items-center justify-between p-6 rounded-3xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 shadow-xl transition-all hover:scale-[1.02] active:scale-95">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-lg group-hover:shadow-rose-500/50 transition-shadow">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-white leading-tight">Check Out</h2>
                <p className="text-sm font-medium text-white/50 mt-1">Leaving the premises?</p>
              </div>
            </div>
            <div className="text-white/30 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center flex items-center justify-center gap-2 text-white/30">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-bold tracking-widest uppercase">Digital Gate Pass System</span>
        </div>

      </div>
    </main>
  );
}
