import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import GridPortfolio from '../components/GridPortfolio'
import InternalHeader from '../components/InternalHeader'
import { useAuth } from '../context/AuthContext'

const GRADIENTES = [
  'from-violet-900 via-purple-800 to-indigo-900',
  'from-indigo-900 via-blue-800 to-violet-900',
  'from-purple-900 via-fuchsia-800 to-violet-900',
  'from-slate-800 via-purple-900 to-indigo-800',
]

function gradientePorNome(nome) {
  if (!nome) return GRADIENTES[0]
  return GRADIENTES[nome.charCodeAt(0) % GRADIENTES.length]
}

export default function PortfolioPublico() {
  const { urlPublica } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [obras, setObras] = useState([])
  const [artista, setArtista] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [copiado, setCopiado] = useState(false)

  const isProprioPortfolio = usuario?.urlPublica === urlPublica

  useEffect(() => {
    async function carregar() {
      try {
        const { data } = await api.get(`/obras/publico/${urlPublica}`)
        setArtista(data.artista)
        setObras(data.obras)
      } catch {
        setErro('Portfólio não encontrado')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [urlPublica])

  function copiarUrl() {
    navigator.clipboard.writeText(window.location.href)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // Sai da visualização pública de volta ao sistema (histórico ou fallback)
  function voltar() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/explorar')
  }

  if (erro) {
    return (
      <div className="min-h-screen">
        <InternalHeader />
        <div className="flex items-center justify-center text-center px-4 py-24">
          <div>
            <p className="text-6xl mb-4">🔍</p>
            <h1 className="text-2xl font-bold mb-2">Portfólio não encontrado</h1>
            <p className="text-gray-400">A URL pode estar incorreta ou o artista não existe.</p>
          </div>
        </div>
      </div>
    )
  }

  const gradiente = gradientePorNome(artista?.nome)
  const fotoUrl = artista?.fotoPerfil ?? null

  return (
    <div className="min-h-screen">
      <InternalHeader
        rightSlot={
          <div className="flex items-center gap-2">
            {usuario && (
              <button onClick={voltar} className="btn-secondary text-xs py-1.5 px-3">
                ← Voltar
              </button>
            )}
            {isProprioPortfolio && (
              <Link to="/meu-perfil" className="btn-secondary text-xs py-1.5 px-3">
                Editar perfil
              </Link>
            )}
            <button onClick={copiarUrl} className="btn-secondary text-xs py-1.5 px-3">
              {copiado ? '✅ Copiado!' : '🔗 Compartilhar'}
            </button>
          </div>
        }
      />

      {/* Hero card — perfil */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-gray-800">
          {/* Banner */}
          <div className={`h-32 bg-gradient-to-r ${gradiente}`} />

          {/* Avatar + info principal */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full border-4 border-card overflow-hidden bg-gray-700 shrink-0">
                {fotoUrl ? (
                  <img src={fotoUrl} alt={artista?.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${gradiente} flex items-center justify-center`}>
                    <span className="text-2xl font-bold text-white">
                      {artista?.nome?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                )}
              </div>

              {/* Badges de status */}
              <div className="flex flex-wrap gap-2">
                {artista?.disponivelParaMentorar && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Disponível para mentorar
                  </span>
                )}
              </div>
            </div>

            {/* Nome e área */}
            <h1 className="text-2xl font-bold text-white">{artista?.nome ?? '—'}</h1>
            {artista?.areaArtisticaPrincipal && (
              <p className="text-brand-light font-medium mt-0.5">{artista.areaArtisticaPrincipal}</p>
            )}
            {artista?.cidade && (
              <p className="text-gray-400 text-sm mt-1">📍 {artista.cidade}</p>
            )}

            {/* Bio */}
            {artista?.bio && (
              <p className="text-gray-300 text-sm mt-3 leading-relaxed max-w-prose">
                {artista.bio}
              </p>
            )}

            {/* Tags */}
            {(artista?.tagsExpertise?.length > 0 || artista?.tagsNecessidade?.length > 0) && (
              <div className="mt-4 space-y-2">
                {artista.tagsExpertise?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs text-gray-500 mr-1">Expertise:</span>
                    {artista.tagsExpertise.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-full bg-brand/20 text-brand-light border border-brand/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {artista.tagsNecessidade?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs text-gray-500 mr-1">Busca:</span>
                    {artista.tagsNecessidade.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/40"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Obras */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold mb-4">
          Obras
          {obras.length > 0 && <span className="text-gray-500 text-sm font-normal ml-2">({obras.length})</span>}
        </h2>
        <GridPortfolio
          obras={obras}
          carregando={carregando}
          modoEdicao={false}
        />
      </main>
    </div>
  )
}
