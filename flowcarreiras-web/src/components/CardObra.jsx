import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartIcon } from './StateIcons'

const ICONES_TIPO = {
  IMAGEM: '🖼️',
  AUDIO: '🎵',
  VIDEO: '🎬',
  EMBED: '▶️',
}

function Thumbnail({ obra }) {
  const [carregou, setCarregou] = useState(false)
  const [erro, setErro] = useState(false)

  if (obra.tipoMidia === 'IMAGEM' && obra.urlMidia) {
    return (
      <div className="relative w-full aspect-square bg-card">
        {!carregou && <div className="skeleton absolute inset-0" />}
        <img
          src={obra.urlMidia}
          alt={obra.titulo}
          loading="lazy"
          onLoad={() => setCarregou(true)}
          onError={() => { setErro(true); setCarregou(true) }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${carregou ? 'opacity-100' : 'opacity-0'}`}
        />
        {erro && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-4xl">🖼️</div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full aspect-square bg-card flex items-center justify-center text-5xl">
      {ICONES_TIPO[obra.tipoMidia] ?? '📁'}
    </div>
  )
}

export default function CardObra({ obra, modoEdicao, onRemover }) {
  const [curtido, setCurtido] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fc_curtidas') || '[]').includes(obra.id) } catch { return false }
  })

  function toggleCurtir(e) {
    e.preventDefault()
    e.stopPropagation()
    setCurtido(prev => {
      const next = !prev
      try {
        const set = new Set(JSON.parse(localStorage.getItem('fc_curtidas') || '[]'))
        next ? set.add(obra.id) : set.delete(obra.id)
        localStorage.setItem('fc_curtidas', JSON.stringify([...set]))
      } catch { /* ignora indisponibilidade do storage */ }
      return next
    })
  }

  return (
    <div className="card group relative hover:ring-2 hover:ring-brand transition-all">
      <Thumbnail obra={obra} />

      {!modoEdicao && (
        <button
          onClick={toggleCurtir}
          aria-label={curtido ? 'Descurtir' : 'Curtir'}
          aria-pressed={curtido}
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <HeartIcon filled={curtido} size={20} />
        </button>
      )}

      {obra.status === 'RASCUNHO' && (
        <span className="absolute top-2 left-2 bg-yellow-600/90 text-xs font-semibold px-2 py-0.5 rounded-full">
          Rascunho
        </span>
      )}

      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm leading-tight line-clamp-1">{obra.titulo}</h3>

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
    </div>
  )
}
