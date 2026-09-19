import Image from 'next/image';

interface NavjyotiBrandHeaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'page' | 'gatePass' | 'compact' | 'approval';
  className?: string;
}

export function NavjyotiBrandHeader({ title, subtitle, variant = 'page', className = '' }: NavjyotiBrandHeaderProps) {
  const isGatePass = variant === 'gatePass';
  const isCompact = variant === 'compact';

  // Header Container Classes — compact premium
  let headerClasses = "w-full flex flex-col items-center justify-center transition-all duration-300 overflow-hidden";
  if (isGatePass) {
    headerClasses += " bg-[#050505] px-4 py-4 sm:py-[22px] rounded-t-[18px]";
  } else if (isCompact) {
    headerClasses += " pt-[max(12px,env(safe-area-inset-top))] pb-2 md:pt-4 md:pb-4 px-3 sm:px-4 bg-surface";
  } else {
    headerClasses += " pt-[max(16px,env(safe-area-inset-top))] md:pt-10 pb-3 sm:pb-4 md:pb-6 px-3 sm:px-4 bg-surface/80 backdrop-blur-md sticky top-0 z-10";
  }

  // Logo Container Classes + inline clamp for reliable constraint — compact gatePass 280-340 desktop, 200-250 mobile
  let logoClasses = "flex justify-center transition-all duration-300 mx-auto w-full max-w-full";
  let logoStyle: React.CSSProperties | undefined = undefined;
  if (isGatePass) {
    logoClasses += " relative overflow-hidden aspect-[2.65/1]";
    logoStyle = { width: 'clamp(200px, 62vw, 320px)', maxWidth: '320px' };
  } else if (isCompact) {
    logoStyle = { maxWidth: 'clamp(140px, 60vw, 200px)' };
  } else {
    logoStyle = { maxWidth: 'clamp(160px, 72vw, 250px)' };
  }
  if (!isGatePass) {
    logoClasses += isCompact ? " md:max-w-[280px]" : " md:max-w-[390px]";
  }

  // Text Spacing
  const textSpacing = isCompact ? "mt-3" : "mt-5 md:mt-8";

  return (
    <header className={`${headerClasses} ${className}`}>
      <div className={logoClasses} style={logoStyle}>
        <Image
          src={isGatePass ? "/navjyoti-gatepass-logo.png" : "/navjyoti-logo.png"}
          alt="Navjyoti - Enterprise Software, AI & Digital Solutions"
          width={isGatePass ? 1447 : 1024}
          height={isGatePass ? 1087 : 682}
          sizes={isGatePass ? "(max-width: 768px) 76vw, 580px" : "(max-width: 768px) 72vw, 390px"}
          className={isGatePass ? "absolute inset-x-0 -top-[19%] w-full h-auto max-w-full" : "w-full h-auto object-contain max-w-full"}
          style={{ maxWidth: '100%' }}
          unoptimized
        />
      </div>
      {(title || subtitle) && (
        <div className={`w-full space-y-1 text-center px-2 ${textSpacing}`}>
          {title && <h2 className="text-[clamp(20px,2.5vw,28px)] font-bold text-primary tracking-tight leading-tight">{title}</h2>}
          {subtitle && <p className="text-[clamp(13px,1.5vw,15px)] font-medium text-on-surface-variant max-w-[280px] sm:max-w-[340px] mx-auto leading-relaxed">{subtitle}</p>}
        </div>
      )}
    </header>
  );
}
