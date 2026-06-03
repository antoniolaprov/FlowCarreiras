import { useLocation } from 'react-router-dom'
import Boxes from './Boxes'

/**
 * Fundo animado global das páginas internas do sistema.
 * Fica fixo atrás de todo o conteúdo (z negativo) e é omitido no /login,
 * que mantém sua própria animação de partículas com texto.
 */
export default function AppBackground() {
  const { pathname } = useLocation()
  if (pathname === '/login') return null

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-surface">
      <Boxes />
    </div>
  )
}
