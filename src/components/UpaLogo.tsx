import React from 'react';

interface UpaLogoProps {
  strokeColor?: string;
  className?: string;
}

/**
 * Emblema vetorial oficial da UPA (União Presbiteriana de Adolescentes)
 * Desenvolvido com traços precisos, cruz clássica, chama do Espírito Santo e monograma UPA.
 */
export const UpaLogo: React.FC<UpaLogoProps> = ({ 
  strokeColor = '#0F2A4A', 
  className = 'w-16 h-16' 
}) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Círculo institucional com anel duplo */}
      <circle cx="50" cy="50" r="46" stroke={strokeColor} strokeWidth="2.5" opacity="0.95" />
      <circle cx="50" cy="50" r="41.5" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 2" opacity="0.45" />

      {/* Cruz Cristã */}
      <line x1="50" y1="18" x2="50" y2="74" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
      <line x1="33" y1="36" x2="67" y2="36" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />

      {/* Chama do Espírito Santo / Avivamento */}
      <path 
        d="M 50 14 C 45 22 42 27 50 32 C 58 27 55 22 50 14 Z" 
        fill="#F59E0B"
      />
      <path 
        d="M 50 18 C 47 23 45 26 50 29 C 55 26 53 23 50 18 Z" 
        fill="#FDE68A"
      />

      {/* Tipografia Oficial UPA */}
      <text 
        x="50" 
        y="87" 
        fill={strokeColor} 
        fontSize="13.5" 
        fontFamily="'DM Sans', system-ui, -apple-system, sans-serif" 
        fontWeight="900" 
        letterSpacing="3.5" 
        textAnchor="middle"
      >
        UPA
      </text>
    </svg>
  );
};
