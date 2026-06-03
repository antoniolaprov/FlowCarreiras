/**
 * Ícones de estado animados (adaptados de um template 21st.dev).
 * Reimplementados sem framer-motion — as animações são CSS/SVG e os ícones
 * são controlados por props (estado real), não em loop de demonstração.
 */

/* Olho mostrar/ocultar — a barra é "desenhada" quando hidden=true */
export function EyeToggleIcon({ hidden = false, size = 18, className = '' }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" className={className} style={{ width: size, height: size }}>
      <path
        d="M4 20s6-10 16-10 16 10 16 10-6 10-16 10S4 20 4 20z"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ opacity: hidden ? 0.4 : 1, transition: 'opacity .3s' }}
      />
      <circle cx="20" cy="20" r="5" strokeWidth="2.5"
        style={{ opacity: hidden ? 0.25 : 1, transition: 'opacity .3s' }}
      />
      <line x1="6" y1="34" x2="34" y2="6" strokeWidth="3" strokeLinecap="round" pathLength="1"
        style={{ strokeDasharray: 1, strokeDashoffset: hidden ? 0 : 1, transition: 'stroke-dashoffset .25s ease-out' }}
      />
    </svg>
  )
}

/* Spinner de carregamento que vira ✓ quando done=true */
export function SuccessIcon({ done = false, size = 22, className = '' }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" className={className} style={{ width: size, height: size }}>
      {done ? (
        <>
          <circle cx="20" cy="20" r="16" strokeWidth="2.5" opacity="0.9" />
          <path d="M12 20l6 6 10-12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="icon-draw" />
        </>
      ) : (
        <circle cx="20" cy="20" r="16" strokeWidth="3" strokeLinecap="round" strokeDasharray="25 75" pathLength="100" className="icon-spin" />
      )}
    </svg>
  )
}

/* Sino — balança em loop sutil quando active=true (notificações não lidas) */
export function BellIcon({ active = false, size = 20, className = '' }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" className={`${active ? 'bell-ring' : ''} ${className}`} style={{ width: size, height: size }}>
      <path d="M28 16a8 8 0 00-16 0c0 8-4 10-4 10h24s-4-2-4-10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.5 30a3 3 0 005 0" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* Coração — preenche em vermelho com "pop" quando filled=true */
export function HeartIcon({ filled = false, size = 20, className = '' }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} style={{ width: size, height: size }}>
      <path
        d="M20 34s-12-7.5-12-16a7.5 7.5 0 0112-6 7.5 7.5 0 0112 6c0 8.5-12 16-12 16z"
        stroke={filled ? '#EF4444' : 'currentColor'}
        strokeWidth="2"
        fill={filled ? '#EF4444' : 'none'}
        className={filled ? 'heart-pop' : ''}
        style={{ transition: 'fill .2s, stroke .2s' }}
      />
    </svg>
  )
}
