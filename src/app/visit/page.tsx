import { getActiveEmployees } from '@/lib/data/employees';
import { VisitorForm } from '@/components/visitor/VisitorForm';
import { NavjyotiBrandHeader } from '@/components/ui/NavjyotiBrandHeader';

export default async function VisitPage() {
  const dbEmployees = await getActiveEmployees();
  
  // Inject HR as a department target
  const employees = [
    { id: 'dept_hr', name: 'HR', department: 'Human Resources' },
    ...dbEmployees
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full font-sans">
      
      {/* Left Column - Branding & Background */}
      <div 
        className="hidden md:flex w-full md:w-[45%] relative flex-col justify-end p-12 overflow-hidden"
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/visit-bg-new.jpg)' }}
        >
          {/* Subtle gradient at the bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 space-y-4 max-w-lg mb-8">
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight leading-tight text-white drop-shadow-md">
            SMART. SECURE. WELCOME.
          </h1>
          <p className="text-lg lg:text-xl text-gray-200 font-medium drop-shadow">
            A seamless digital check-in experience for our valued visitors.
          </p>
        </div>
      </div>

      {/* Right Column - Form Area */}
      <div className="flex-1 w-full flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8 bg-[#f0f4f8] min-w-0 overflow-x-hidden">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden w-full mb-2">
          <NavjyotiBrandHeader variant="compact" />
        </div>

        {/* White Form Card */}
        <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          
          <div className="p-4 sm:p-8 text-center border-b border-gray-100 space-y-3">
            <h2 className="text-[clamp(18px,5vw,24px)] font-black text-[#0133a1] uppercase tracking-wide leading-tight">
              DIGITAL VISITOR GATE PASS
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[2px] w-10 sm:w-12 bg-[#ff6600]"></div>
              <svg className="w-5 h-5 text-[#ff6600] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="h-[2px] w-10 sm:w-12 bg-[#ff6600]"></div>
            </div>
            <p className="text-[13px] sm:text-sm text-gray-500 font-medium leading-relaxed">
              Quick, secure visitor entry.<br />
              Enter your details below to request access.
            </p>
          </div>

          <div className="p-4 sm:p-8 pb-6 sm:pb-10">
            <VisitorForm employees={employees} />
          </div>
          
        </div>
        
      </div>

    </div>
  );
}
