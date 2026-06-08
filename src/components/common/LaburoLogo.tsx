interface LaburoLogoProps {
  size?: 'sm' | 'md';
  showText?: boolean;
}

export default function LaburoLogo({ showText = true }: LaburoLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5"/>
            <stop offset="100%" stopColor="#7C3AED"/>
          </linearGradient>
          <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#bg)"/>
        <rect x="4" y="4" width="92" height="50" rx="24" fill="url(#shine)"/>
        <rect x="28" y="20" width="16" height="56" rx="5" fill="white"/>
        <rect x="28" y="60" width="44" height="16" rx="5" fill="white" opacity="0.9"/>
        <circle cx="72" cy="28" r="6" fill="white" opacity="0.3"/>
      </svg>
      {showText && (
        <span className="text-[16px] font-black tracking-tight text-gray-900">Laburo</span>
      )}
    </div>
  );
}
