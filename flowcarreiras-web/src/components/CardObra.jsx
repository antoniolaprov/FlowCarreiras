import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartIcon } from './StateIcons'
import ComentariosModal from './ComentariosModal'
import MidiaObra from './MidiaObra'
import ObraDetalheModal from './ObraDetalheModal'
import { useAuth } from '../context/AuthContext'
import { obterStatusCurtida, curtir, descurtir } from '../api/curtidas'

export default function CardObra({ obra, modoEdicao, onRemover }) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [comentariosAbertos, setComentariosAbertos] = useState(false)
  const [detalheAberto, setDetalheAberto] = useState(false)
  const [curtido, setCurtido] = useState(false)
  const [totalCurtidas, setTotalCurtidas] = useState(0)
  const [enviandoCurtida, setEnviandoCurtida] = useState(false)

  // Mídia interativa (vídeo/áudio/embed) não abre o modal ao clicar, para não
  // conflitar com os controles do player — esses usam o botão "Ampliar".
  const midiaInterativa = ['VIDEO', 'AUDIO', 'EMBED'].includes(obra.tipoMidia)

  // Carrega o estado real de curtidas (contagem + se o usuário logado curtiu)
  useEffect(() => {
    let ativo = true
    obterStatusCurtida(obra.id)
      .then(status => {
        if (!ativo) return
        setTotalCurtidas(status.total)
        setCurtido(status.curtidoPeloUsuario)
      })
      .catch(() => { /* falha silenciosa: card continua utilizável sem o contador */ })
    return () => { ativo = false }
  }, [obra.id])

  async function toggleCurtir(e) {
    e?.preventDefault()
    e?.stopPropagation()

    // Sem login não há como persistir a curtida — leva ao login
    if (!token) {
      navigate('/login')
      return
    }
    if (enviandoCurtida) return

    // Atualização otimista, revertida em caso de erro
    const anterior = { curtido, total: totalCurtidas }
    const proximo = !curtido
    setCurtido(proximo)
    setTotalCurtidas(t => t + (proximo ? 1 : -1))
    setEnviandoCurtida(true)
    try {
      const status = proximo ? await curtir(obra.id) : await descurtir(obra.id)
      setTotalCurtidas(status.total)
      setCurtido(status.curtidoPeloUsuario)
    } catch {
      setCurtido(anterior.curtido)
      setTotalCurtidas(anterior.total)
    } finally {
      setEnviandoCurtida(false)
    }
  }

  return (
    <div className="card group relative hover:ring-2 hover:ring-brand transition-all">
      {/* Mídia — abre o detalhe ao clicar (exceto players interativos) */}
      <div
        className={midiaInterativa ? '' : 'cursor-zoom-in'}
        onClick={midiaInterativa ? undefined : () => setDetalheAberto(true)}
      >
        <MidiaObra obra={obra} />
      </div>

      {!modoEdicao && (
        <button
          onClick={toggleCurtir}
          disabled={enviandoCurtida}
          aria-label={curtido ? 'Descurtir' : 'Curtir'}
          aria-pressed={curtido}
          className="absolute right-2 top-2 z-10 flex h-9 items-center gap-1 rounded-full bg-black/40 px-2.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60 disabled:opacity-70"
        >
          <HeartIcon filled={curtido} size={20} />
          {totalCurtidas > 0 && (
            <span className="text-xs font-semibold tabular-nums">{totalCurtidas}</span>
          )}
        </button>
      )}

      {obra.status === 'RASCUNHO' && (
        <span className="absolute top-2 left-2 bg-yellow-600/90 text-xs font-semibold px-2 py-0.5 rounded-full">
          Rascunho
        </span>
      )}

      <div className="p-3 space-y-2">
        <h3
          onClick={() => setDetalheAberto(true)}
          className="font-semibold text-sm leading-tight line-clamp-1 cursor-pointer hover:text-brand-light"
        >
          {obra.titulo}
        </h3>

        {obra.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {obra.tags.slice(0, 3).map(tag => (
              <span key={tag.id} className="tag-chip">{tag.nome}</span>
            ))}
            {obra.tags.length > 3 && (
              <span className="tag-chip">+{obra.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDetalheAberto(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-brand-light"
          >
            <span>⤢</span> Ampliar
          </button>
          <button
            onClick={() => setComentariosAbertos(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-brand-light"
          >
            <span>💬</span> Comentários
          </button>
        </div>

        {modoEdicao && (
          <div className="flex gap-2 pt-1">
            <Link
              to={`/portfolio/editar/${obra.id}`}
              className="flex-1 text-center text-xs btn-secondary py-1 px-2"
            >
              Editar
            </Link>
            <button
              onClick={() => onRemover(obra)}
              className="flex-1 text-xs btn-danger py-1 px-2"
            >
              Remover
            </button>
          </div>
        )}
      </div>

      {detalheAberto && (
        <ObraDetalheModal
          obra={obra}
          curtido={curtido}
          totalCurtidas={totalCurtidas}
          enviandoCurtida={enviandoCurtida}
          onCurtir={toggleCurtir}
          onClose={() => setDetalheAberto(false)}
        />
      )}

      {comentariosAbertos && (
        <ComentariosModal obra={obra} onClose={() => setComentariosAbertos(false)} />
      )}
    </div>
  )
}
