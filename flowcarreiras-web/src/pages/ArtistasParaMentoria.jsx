import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InternalHeader from '../components/InternalHeader'
import { useAuth } from '../context/AuthContext'
import { listarArtistasDisponiveis, selecionarArtistaParaMentoria } from '../api/mentorias'

function iniciais(nome) {
  return nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function compatibilidadeLabel(artista) {
  const qtd = artista.quantidadeTagsCompativeis ?? 0
  if (qtd === 0) return 'Sem tags em comum'
  return `${qtd} tag${qtd > 1 ? 's' : ''} em comum`
}

export default function ArtistasParaMentoria() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [artistas, setArtistas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [selecionandoId, setSelecionandoId] = useState(null)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(null)
  const [filtros, setFiltros] = useState({ cidade: '', tag: '', compatibilidadeMinima: '' })

  useEffect(() => {
    setCarregando(true)
    setErro(null)
    listarArtistasDisponiveis(filtros)
      .then(setArtistas)
      .catch(err => setErro(err.response?.data?.mensagem ?? 'Nao foi possivel carregar artistas disponiveis.'))
      .finally(() => setCarregando(false))
  }, [filtros])

  function setFiltro(campo, valor) {
    setFiltros(f => ({ ...f, [campo]: valor }))
  }

  function limparFiltros() {
    setFiltros({ cidade: '', tag: '', compatibilidadeMinima: '' })
  }

  async function selecionar(artista) {
    setSelecionandoId(artista.id)
    setErro(null)
    setSucesso(null)
    try {
      await selecionarArtistaParaMentoria(artista.id)
      setArtistas(prev => prev.filter(a => a.id !== artista.id))
      setSucesso(`${artista.nome} agora esta vinculado a sua mentoria.`)
    } catch (err) {
      setErro(err.response?.data?.mensagem ?? 'Erro ao selecionar artista para mentoria.')
    } finally {
      setSelecionandoId(null)
    }
  }

  return (
    <div className="min-h-screen">
      <InternalHeader />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold">Artistas sem mentoria ativa</h1>
            <p className="text-sm text-gray-400 mt-1">
              Selecione artistas que voce deseja acompanhar como mentor.
            </p>
          </div>
          <div className="w-full md:w-auto flex gap-2">
            <Link to="/mentoria/minhas" className="btn-secondary text-sm py-2 px-3">
              Minhas mentorias
            </Link>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            className="input"
            value={filtros.cidade}
            onChange={e => setFiltro('cidade', e.target.value)}
            placeholder="Cidade do artista"
          />
          <input
            className="input"
            value={filtros.tag}
            onChange={e => setFiltro('tag', e.target.value)}
            placeholder="Tag de necessidade"
          />
          <select
            className="input"
            value={filtros.compatibilidadeMinima}
            onChange={e => setFiltro('compatibilidadeMinima', e.target.value)}
          >
            <option value="">Compatibilidade</option>
            <option value="1">Com alguma compatibilidade</option>
            <option value="25">25% ou mais</option>
            <option value="50">50% ou mais</option>
            <option value="75">75% ou mais</option>
          </select>
          <div className="flex">
            <button onClick={limparFiltros} className="btn-secondary text-sm px-3 w-full">
              Limpar filtros
            </button>
          </div>
        </div>

        {erro && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm mb-4">
            <p>{erro}</p>
            <button onClick={() => navigate('/mentoria/configurar')} className="text-red-100 underline mt-2">
              Revisar configuracao de mentoria
            </button>
          </div>
        )}

        {sucesso && (
          <div className="bg-green-900/30 border border-green-700 rounded-xl px-4 py-3 text-green-300 text-sm mb-4">
            {sucesso}
          </div>
        )}

        {carregando ? (
          <div className="text-gray-400 text-sm">Carregando artistas...</div>
        ) : artistas.length === 0 ? (
          <div className="bg-card rounded-xl p-6 text-center">
            <p className="text-white font-medium">Nenhum artista disponivel agora.</p>
            <p className="text-sm text-gray-400 mt-1">
              Todos os artistas listaveis ja possuem mentoria ativa ou nao correspondem ao filtro.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {artistas.map(artista => (
              <article key={artista.id} className="bg-card rounded-xl p-5 flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-full bg-brand/20 text-brand-light flex items-center justify-center font-bold overflow-hidden shrink-0">
                    {artista.fotoPerfil ? (
                      <img src={artista.fotoPerfil} alt={artista.nome} className="w-full h-full object-cover" />
                    ) : (
                      iniciais(artista.nome)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-white truncate">{artista.nome}</h2>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm">
                      {artista.areaArtisticaPrincipal && (
                        <span className="text-brand-light">{artista.areaArtisticaPrincipal}</span>
                      )}
                      {artista.cidade && (
                        <span className="text-gray-400">{artista.cidade}</span>
                      )}
                    </div>
                  </div>
                </div>

                {artista.bio && (
                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">{artista.bio}</p>
                )}

                <div className="bg-surface/60 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-xs text-gray-400">{compatibilidadeLabel(artista)}</p>
                    <p className="text-sm font-semibold text-white">{artista.percentualCompatibilidade ?? 0}%</p>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full"
                      style={{ width: `${artista.percentualCompatibilidade ?? 0}%` }}
                    />
                  </div>
                  {artista.tagsCompativeis?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {artista.tagsCompativeis.map(tag => (
                        <span key={tag.id} className="tag-chip">{tag.nome}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Quer desenvolver</p>
                  {artista.tagsNecessidade?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {artista.tagsNecessidade.map(tag => (
                        <span key={tag.id} className="inline-flex items-center bg-indigo-900/30 text-indigo-300 border border-indigo-800/50 text-xs font-medium px-2 py-0.5 rounded-full">
                          {tag.nome}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhuma tag informada.</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 mt-auto">
                  <a
                    href={`/portfolio/${artista.urlPublica}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Ver portfolio
                  </a>
                  <button
                    onClick={() => selecionar(artista)}
                    disabled={selecionandoId === artista.id}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    {selecionandoId === artista.id ? 'Selecionando...' : 'Quero mentorear'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
