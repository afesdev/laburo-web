interface LaburoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  light?: boolean;
}

export default function LaburoLogo({ size = 'md', showText = true, light = false }: LaburoLogoProps) {
  const dim = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  const textSize = size === 'sm' ? 'text-[14px]' : size === 'lg' ? 'text-[22px]' : 'text-[18px]';

  return (
    <div className="flex items-center gap-2.5">
      <svg width={dim} height={dim} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="laburo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="laburo-shine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#laburo-bg)" />
        <rect x="4" y="4" width="92" height="50" rx="24" fill="url(#laburo-shine)" />
        <rect x="28" y="20" width="16" height="56" rx="5" fill="white" />
        <rect x="28" y="60" width="44" height="16" rx="5" fill="white" opacity="0.9" />
        <circle cx="72" cy="28" r="6" fill="white" opacity="0.3" />
      </svg>
      {showText && (
        <span className={`${textSize} font-black tracking-tight ${light ? 'text-white' : 'text-gray-900'}`}>
          OficiosApp
        </span>
      )}
    </div>
  );
}
