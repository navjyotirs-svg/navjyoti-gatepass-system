'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { PublicEmployee } from '@/types/employee';
import { EmployeeSelector } from './EmployeeSelector';
import { ArrowRight, User, Phone, Building2, Lock, ShieldCheck, Mail } from 'lucide-react';

const visitorSchema = z.object({
  visitorName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  visitorMobile: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  visitorEmail: z.string().trim().email('Enter a valid email address').max(254),
  visitorCompany: z.string().trim().max(150, 'Company name is too long').optional().transform(val => val === '' ? undefined : val),
  hostSelection: z.object({
    type: z.enum(['employee', 'department']),
    id: z.string().min(1, 'Please select a person to meet')
  }),
  purpose: z.string().trim().min(3, 'Purpose must be at least 3 characters').max(500, 'Purpose is too long'),
});

export interface VisitorFormData {
  visitorName: string;
  visitorMobile: string;
  visitorEmail: string;
  visitorCompany?: string;
  hostSelection: {
    type: 'employee' | 'department';
    id: string;
  };
  purpose: string;
}

interface VisitorFormProps {
  employees: PublicEmployee[];
}

type OtpState = 'idle' | 'sending' | 'verifying' | 'verified';

export function VisitorForm({ employees }: VisitorFormProps) {
  const router = useRouter();
  const [otpState, setOtpState] = useState<OtpState>('idle');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors, isValid }, reset, getValues } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
    mode: 'onChange',
    defaultValues: {
      visitorName: '',
      visitorMobile: '',
      visitorEmail: '',
      visitorCompany: '',
      hostSelection: { type: 'employee', id: '' },
      purpose: '',
    }
  });

  useEffect(() => {
    const savedState = sessionStorage.getItem('visitorState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        reset(parsed);
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
  }, [reset]);

  const sendOtp = async () => {
    if (!isValid) return;
    setOtpState('sending');
    setOtpError('');
    setSimulatedOtp(null);
    try {
      const email = getValues('visitorEmail');
      const mobile = getValues('visitorMobile');
      // Prefer email (free 100/day SMTP). Mobile kept for contact but OTP via email.
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mobile }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpState('verifying');
      if (data._simulatedOtp) {
        setSimulatedOtp(data._simulatedOtp);
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Failed to send OTP');
      setOtpState('idle');
    }
  };

  const verifyOtpAndProceed = async (formData: VisitorFormData) => {
    if (otpState === 'idle') {
      // Step 1: User submitted form, intercept and send OTP
      await sendOtp();
      return;
    }

    if (otpState === 'verifying') {
      // Step 2: User is submitting the OTP
      if (otpInput.length !== 4) {
        setOtpError('Please enter a 4-digit OTP');
        return;
      }

      try {
        const res = await fetch('/api/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.visitorEmail, mobile: formData.visitorMobile, otp: otpInput }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Invalid OTP');
        }

        // OTP Verified! Proceed to save state and go to photo
        setOtpState('verified');
        proceedToPhoto(formData);

      } catch (err: unknown) {
        setOtpError(err instanceof Error ? err.message : 'Invalid OTP');
      }
      return;
    }

    if (otpState === 'verified') {
      proceedToPhoto(formData);
    }
  };

  const proceedToPhoto = (data: VisitorFormData) => {
    const stateToSave: Record<string, unknown> = {
      visitorName: data.visitorName,
      visitorMobile: data.visitorMobile,
      visitorEmail: data.visitorEmail,
      visitorCompany: data.visitorCompany,
      purpose: data.purpose,
    };
    const selectedEmp = employees.find(e => e.id === data.hostSelection.id);
    if (data.hostSelection.type === 'department') {
      stateToSave.type = 'department';
      stateToSave.departmentCode = data.hostSelection.id;
      stateToSave.hostName = selectedEmp ? selectedEmp.name : data.hostSelection.id;
    } else {
      stateToSave.employeeId = data.hostSelection.id;
      stateToSave.hostName = selectedEmp ? selectedEmp.name : 'Employee';
    }
    
    sessionStorage.setItem('visitorState', JSON.stringify(stateToSave));
    router.push('/visit/photo');
  };

  const isFormDisabled = otpState === 'sending' || otpState === 'verifying' || otpState === 'verified';

  return (
    <div className="relative flex flex-col space-y-4">
      {simulatedOtp && otpState === 'verifying' && (
        <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg text-sm font-bold text-center animate-pulse z-50">
          DEVELOPER MODE: Simulated OTP is {simulatedOtp}
        </div>
      )}

      <form onSubmit={handleSubmit(verifyOtpAndProceed)} className="space-y-6 flex flex-col w-full">
        {/* Full Name */}
        <div className="flex flex-col space-y-1 relative group">
          <label htmlFor="visitorName" className="text-sm font-bold text-[#0133a1] group-focus-within:text-[#0133a1] transition-colors">
            Full Name
          </label>
          <div className="flex relative rounded-xl shadow-sm min-w-0">
            <span className={`inline-flex items-center justify-center w-10 sm:w-12 shrink-0 rounded-l-xl border border-r-0 bg-[#f4f7fb] text-[#0133a1] ${errors.visitorName ? 'border-error' : 'border-gray-200'}`}>
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <input 
              type="text" 
              id="visitorName" 
              autoComplete="name"
              disabled={isFormDisabled}
              {...register('visitorName')}
              className={`h-[48px] sm:h-[52px] flex-1 min-w-0 block w-full rounded-none rounded-r-xl border bg-white px-3 sm:px-4 text-[16px] text-gray-800 focus:border-[#0133a1] focus:ring-1 focus:ring-[#0133a1] focus:outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 ${errors.visitorName ? 'border-error' : 'border-gray-200 hover:border-[#0133a1]'}`}
              placeholder="Enter your full name" 
            />
          </div>
          {errors.visitorName && <p className="text-xs text-error break-words">{errors.visitorName.message}</p>}
        </div>

          {/* Mobile Number */}
        <div className="flex flex-col space-y-1 relative group">
          <label htmlFor="visitorMobile" className="text-sm font-bold text-[#0133a1] group-focus-within:text-[#0133a1] transition-colors">
            Mobile Number
          </label>
          <div className="flex relative rounded-xl shadow-sm min-w-0">
            <span className={`inline-flex items-center justify-center w-10 sm:w-12 shrink-0 rounded-l-xl border border-r-0 bg-[#f4f7fb] text-[#0133a1] ${errors.visitorMobile ? 'border-error' : 'border-gray-200'}`}>
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className={`inline-flex items-center px-2 sm:px-3 shrink-0 border-y border-r-0 bg-white text-gray-500 text-sm sm:text-base ${errors.visitorMobile ? 'border-error' : 'border-gray-200'} disabled:bg-gray-50`}>
              +91
            </span>
            <input 
              type="tel" 
              inputMode="numeric"
              autoComplete="tel"
              id="visitorMobile" 
              disabled={isFormDisabled}
              {...register('visitorMobile')}
              className={`h-[48px] sm:h-[52px] flex-1 min-w-0 block w-full rounded-none rounded-r-xl border bg-white px-3 sm:px-4 text-[16px] text-gray-800 focus:border-[#0133a1] focus:ring-1 focus:ring-[#0133a1] focus:outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 ${errors.visitorMobile ? 'border-error' : 'border-gray-200 hover:border-[#0133a1]'}`}
              placeholder="98765 43210" 
            />
          </div>
          {errors.visitorMobile && <p className="text-xs text-error break-words">{errors.visitorMobile.message}</p>}
        </div>

        {/* Email */}
        <div className="flex flex-col space-y-1 relative group">
          <label htmlFor="visitorEmail" className="text-sm font-bold text-[#0133a1] group-focus-within:text-[#0133a1] transition-colors">
            Email Address
          </label>
          <div className="flex relative rounded-xl shadow-sm min-w-0">
            <span className={`inline-flex items-center justify-center w-10 sm:w-12 shrink-0 rounded-l-xl border border-r-0 bg-[#f4f7fb] text-[#0133a1] ${errors.visitorEmail ? 'border-error' : 'border-gray-200'}`}>
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <input
              type="email"
              id="visitorEmail"
              autoComplete="email"
              disabled={isFormDisabled}
              {...register('visitorEmail')}
              className={`h-[48px] sm:h-[52px] flex-1 min-w-0 block w-full rounded-none rounded-r-xl border bg-white px-3 sm:px-4 text-[16px] text-gray-800 focus:border-[#0133a1] focus:ring-1 focus:ring-[#0133a1] focus:outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 ${errors.visitorEmail ? 'border-error' : 'border-gray-200 hover:border-[#0133a1]'}`}
              placeholder="you@example.com"
            />
          </div>
          {errors.visitorEmail && <p className="text-xs text-error break-words">{errors.visitorEmail.message}</p>}
        </div>

        {/* Company / Organisation */}
        <div className="flex flex-col space-y-1 relative group">
          <div className="flex justify-between items-end gap-2">
            <label htmlFor="visitorCompany" className="text-sm font-bold text-[#0133a1] group-focus-within:text-[#0133a1] transition-colors">
              Company / Organisation
            </label>
            <span className="text-xs font-medium text-gray-500 shrink-0">Optional</span>
          </div>
          <div className="flex relative rounded-xl shadow-sm min-w-0">
            <span className={`inline-flex items-center justify-center w-10 sm:w-12 shrink-0 rounded-l-xl border border-r-0 bg-[#f4f7fb] text-[#0133a1] ${errors.visitorCompany ? 'border-error' : 'border-gray-200'}`}>
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <input 
              type="text" 
              id="visitorCompany" 
              autoComplete="organization"
              disabled={isFormDisabled}
              {...register('visitorCompany')}
              className={`h-[48px] sm:h-[52px] flex-1 min-w-0 block w-full rounded-none rounded-r-xl border bg-white px-3 sm:px-4 text-[16px] text-gray-800 focus:border-[#0133a1] focus:ring-1 focus:ring-[#0133a1] focus:outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 ${errors.visitorCompany ? 'border-error' : 'border-gray-200 hover:border-[#0133a1]'}`}
              placeholder="e.g. Acme Corp" 
            />
          </div>
          {errors.visitorCompany && <p className="text-xs text-error break-words">{errors.visitorCompany.message}</p>}
        </div>

        {/* Person to Meet */}
        <div className={isFormDisabled ? 'opacity-60 pointer-events-none' : ''}>
          <Controller
            name="hostSelection"
            control={control}
            render={({ field }) => (
              <EmployeeSelector 
                employees={employees} 
                value={field.value.id} 
                onChange={(id, type) => field.onChange({ id, type })} 
                error={errors.hostSelection?.id?.message}
              />
            )}
          />
        </div>

        {/* Purpose of Meeting */}
        <div className="flex flex-col space-y-1 relative group">
          <label htmlFor="purpose" className="text-sm font-bold text-[#0133a1] group-focus-within:text-[#0133a1] transition-colors">
            Purpose of Meeting
          </label>
          <textarea 
            id="purpose" 
            disabled={isFormDisabled}
            {...register('purpose')}
            rows={2}
            className={`w-full rounded-xl border bg-white p-3 sm:p-4 text-[16px] sm:text-base text-gray-800 focus:border-[#0133a1] focus:ring-1 focus:ring-[#0133a1] focus:outline-none transition-all placeholder:text-gray-400 resize-none disabled:bg-gray-50 disabled:text-gray-500 ${errors.purpose ? 'border-error' : 'border-gray-200 hover:border-[#0133a1]'}`}
            placeholder="Briefly describe the reason for your visit..." 
          />
          {errors.purpose && <p className="text-xs text-error break-words">{errors.purpose.message}</p>}
        </div>

        {/* OTP Entry Section (Visible only when verifying) */}
        {otpState === 'verifying' && (
          <div className="p-5 bg-[#f4f7fb] rounded-xl border border-[#0133a1]/20 mt-4 animate-in fade-in slide-in-from-bottom-4">
            <label htmlFor="otp" className="block text-sm font-bold text-[#0133a1] mb-2 text-center">
              Enter 4-Digit Verification Code
            </label>
            <p className="text-xs text-center text-gray-500 mb-4">
              Sent to {getValues('visitorEmail')} (check spam)
            </p>
            <div className="flex justify-center">
              <input
                type="text"
                id="otp"
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                className="h-14 w-32 text-center text-2xl tracking-[0.5em] font-bold rounded-xl border border-gray-300 focus:border-[#0133a1] focus:ring-2 focus:ring-[#0133a1] focus:outline-none transition-all"
                placeholder="••••"
                autoFocus
              />
            </div>
            {otpError && <p className="text-xs text-error text-center mt-3 font-bold">{otpError}</p>}
            
            <button
              type="button"
              onClick={() => {
                setOtpState('idle');
                setOtpInput('');
                setOtpError('');
                setSimulatedOtp(null);
              }}
              className="text-xs text-[#0133a1] font-bold text-center block w-full mt-4 hover:underline"
            >
              Edit Email / Mobile
            </button>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 sm:pt-4">
          <button 
            type="submit" 
            disabled={otpState === 'sending'}
            className="w-full min-h-[48px] sm:min-h-[52px] h-auto py-3 bg-[#0133a1] hover:bg-[#01257a] text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center transition-all disabled:opacity-70 shadow-lg text-sm sm:text-base px-4"
          >
            {otpState === 'sending' ? (
              'Sending Code...'
            ) : otpState === 'verifying' ? (
              <>
                VERIFY & CONTINUE
                <ShieldCheck className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                SEND VERIFICATION CODE
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
          {otpError && otpState !== 'verifying' && (
            <p className="text-xs text-error text-center mt-2 font-bold">{otpError}</p>
          )}
          <div className="mt-4 flex items-center justify-center text-gray-500 space-x-1">
            <Lock className="w-3 h-3" />
            <span className="text-xs font-medium">Your information is secure and confidential.</span>
          </div>
        </div>
      </form>
    </div>
  );
}
