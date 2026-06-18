import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartIcon } from './StateIcons'
import MidiaObra from './MidiaObra'
import ComentariosModal from './ComentariosModal'

/**
 * Tela ampliada de uma obra: mídia grande + ações de curtir e comentar.
 * O estado de curtida é controlado pelo CardObra (props), para ficar em sincronia
 * com o coração exibido no card.
 */
export default function ObraDetalheModal({
  obra, curtido, totalCurtidas, enviandoCurtida, onCurtir, onClose,
}) {
  const [comentariosAbertos, setComentariosAbertos] = useState(false)

  // Fecha com ESC e trava o scroll do body enquanto aberto
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-card flex w-full max-w-3xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
            <div className="min-w-0">
              <h2 className="font-semibold leading-tight">{obra.titulo}</h2>
              {obra.artistaNome && (
                obra.artistaUrlPublica ? (
                  <Link to={`/portfolio/${obra.artistaUrlPublica}`} className="text-xs text-brand-light hover:underline">
                    {obra.artistaNome}
                  </Link>
                ) : (
                  <span className="text-xs text-gray-400">{obra.artistaNome}</span>
                )
              )}
            </div>
            <button onClick={onClose} aria-label="Fechar"
              className="text-2xl leading-none text-gray-400 transition-colors hover:text-white">×</button>
          </div>

          {/* Mídia + informações */}
          <div className="flex-1 overflow-y-auto">
            <MidiaObra obra={obra} grande />
            <div className="space-y-3 p-4">
              {obra.descricao && (
                <p className="whitespace-pre-wrap break-words text-sm text-gray-300">{obra.descricao}</p>
              )}
              {obra.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {obra.tags.map(tag => (<span key={tag.id} className="tag-chip">{tag.nome}</span>))}
                </div>
              )}
            </div>
          </div>

          {/* Ações: curtir e comentar */}
          <div className="flex items-center gap-3 border-t border-white/10 p-4">
            <button
              onClick={onCurtir}
              disabled={enviandoCurtida}
              aria-label={curtido ? 'Descurtir' : 'Curtir'}
              aria-pressed={curtido}
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm text-gray-200 transition-colors hover:border-white/40 disabled:opacity-70"
            >
              <HeartIcon filled={curtido} size={20} />
              <span className="tabular-nums">{totalCurtidas}</span>
            </button>
            <button
              onClick={() => setComentariosAbertos(true)}
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm text-gray-200 transition-colors hover:border-white/40"
            >
              <span>💬</span> Comentários
            </button>
          </div>
        </div>
      </div>

      {/* Renderizado como irmão do backdrop para o clique não fechar o detalhe */}
      {comentariosAbertos && (
        <ComentariosModal obra={obra} onClose={() => setComentariosAbertos(false)} />
      )}
    </>
  )
}
