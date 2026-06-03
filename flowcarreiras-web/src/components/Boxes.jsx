import { useEffect, useRef } from 'react'

/**
 * Grade de caixas em perspectiva (adaptado de um template 21st.dev / Aceternity).
 * Reimplementado sem framer-motion: como é um fundo atrás do conteúdo
 * (pointer-events: none), o "acender no hover" foi trocado por um brilho
 * ambiente — células aleatórias acendem numa cor e desvanecem sozinhas.
 */
const COLORS = [
  'rgb(125 211 252)', // sky-300
  'rgb(249 168 212)', // pink-300
  'rgb(134 239 172)', // green-300
  'rgb(253 224 71)',  // yellow-300
  'rgb(252 165 165)', // red-300
  'rgb(216 180 254)', // purple-300
  'rgb(147 197 253)', // blue-300
  'rgb(165 180 252)', // indigo-300
  'rgb(196 181 253)', // violet-300
]
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]

const ROWS = 100
const COLS = 60

export default function Boxes({ className = '' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const cells = el.querySelectorAll('[data-cell]')
    if (!cells.length) return

    let timer
    const tick = () => {
      // Acende algumas células aleatórias e agenda o desvanecimento.
      for (let k = 0; k < 4; k++) {
        const cell = cells[Math.floor(Math.random() * cells.length)]
        cell.style.transition = 'background-color 0.15s ease-out'
        cell.style.backgroundColor = randomColor()
        setTimeout(() => {
          cell.style.transition = 'background-color 1.8s ease-out'
          cell.style.backgroundColor = 'transparent'
        }, 220)
      }
      timer = setTimeout(tick, 320)
    }
    tick()
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ transform: 'translate(-40%,-60%) skewX(-48deg) skewY(14deg) scale(0.675) rotate(0deg) translateZ(0)' }}
      className={`absolute left-1/4 -top-1/4 flex h-full w-full -translate-x-1/2 -translate-y-1/2 p-4 ${className}`}
    >
      {Array.from({ length: ROWS }).map((_, i) => (
        <div key={`row${i}`} className="relative h-8 w-16 border-l border-slate-700">
          {Array.from({ length: COLS }).map((_, j) => (
            <div key={`col${j}`} data-cell className="relative h-8 w-16 border-r border-t border-slate-700">
              {j % 2 === 0 && i % 2 === 0 ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="pointer-events-none absolute -top-[14px] -left-[22px] h-6 w-10 stroke-[1px] text-slate-700"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
