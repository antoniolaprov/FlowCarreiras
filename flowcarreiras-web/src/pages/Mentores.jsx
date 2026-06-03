import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InternalHeader from '../components/InternalHeader'
import { useAuth } from '../context/AuthContext'
import { listarMentores } from '../api/mentorias'

function iniciais(nome) {
  return nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function formatarValor(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function labelModalidade(modalidade) {
  if (modalidade === 'HIBRIDA') return 'Hibrida'
  if (modalidade === 'PRESENCIAL') return 'Presencial'
  return 'Remota'
}

export default function Mentores() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [mentores, setMentores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [filtros, setFiltros] = useState({
    cidade: '',
    modalidade: '',
    preco: '',
    tag: '',
    area: '',
  })

  useEffect(() => {
    setCarregando(true)
    setErro(null)
    listarMentores({
      cidade: filtros.cidade,
      modalidade: filtros.modalidade,
      gratuita: filtros.preco === 'gratuita' ? true : filtros.preco === 'paga' ? false : undefined,
      tag: filtros.tag,
      area: filtros.area,
    })
      .then(setMentores)
      .catch(err => setErro(err.response?.data?.mensagem ?? 'Nao foi possivel carregar mentores.'))
      .finally(() => setCarregando(false))
  }, [filtros])

  function setFiltro(campo, valor) {
    setFiltros(f => ({ ...f, [campo]: valor }))
  }

  function limparFiltros() {
    setFiltros({ cidade: '', modalidade: '', preco: '', tag: '', area: '' })
  }

  return (
    <div className="min-h-screen">
      <InternalHeader />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold">Mentores ativos</h1>
            <p className="text-sm text-gray-400 mt-1">
              Conheca artistas disponiveis para orientar a comunidade.
            </p>
          </div>
          <div className="w-full md:w-auto flex gap-2">
            <Link to="/mentoria/minhas" className="btn-secondary text-sm py-2 px-3">
              Minhas mentorias
            </Link>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 mb-6 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            className="input"
            value={filtros.cidade}
            onChange={e => setFiltro('cidade', e.target.value)}
            placeholder="Cidade"
          />
          <select
            className="input"
            value={filtros.modalidade}
            onChange={e => setFiltro('modalidade', e.target.value)}
          >
            <option value="">Modalidade</option>
            <option value="REMOTA">Remota</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="HIBRIDA">Hibrida</option>
          </select>
          <select
            className="input"
            value={filtros.preco}
            onChange={e => setFiltro('preco', e.target.value)}
          >
            <option value="">Preco</option>
            <option value="gratuita">Gratuita</option>
            <option value="paga">Paga</option>
          </select>
          <input
            className="input"
            value={filtros.area}
            onChange={e => setFiltro('area', e.target.value)}
            placeholder="Area"
          />
          <div className="flex gap-2">
            <input
              className="input min-w-0"
              value={filtros.tag}
              onChange={e => setFiltro('tag', e.target.value)}
              placeholder="Tag"
            />
            <button onClick={limparFiltros} className="btn-secondary text-xs px-3 shrink-0">
              Limpar
            </button>
          </div>
        </div>

        {erro && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm mb-4">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="text-gray-400 text-sm">Carregando mentores...</div>
        ) : mentores.length === 0 ? (
          <div className="bg-card rounded-xl p-6 text-center">
            <p className="text-white font-medium">Nenhum mentor ativo encontrado.</p>
            <p className="text-sm text-gray-400 mt-1">
              Tente outro filtro ou volte depois.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {mentores.map(mentor => (
              <article key={mentor.id} className="bg-card rounded-xl p-5 flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-full bg-brand/20 text-brand-light flex items-center justify-center font-bold overflow-hidden shrink-0">
                    {mentor.fotoPerfil ? (
                      <img src={mentor.fotoPerfil} alt={mentor.nome} className="w-full h-full object-cover" />
                    ) : (
                      iniciais(mentor.nome)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-white truncate">{mentor.nome}</h2>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm">
                      {mentor.areaArtisticaPrincipal && (
                        <span className="text-brand-light">{mentor.areaArtisticaPrincipal}</span>
                      )}
                      {mentor.cidade && (
                        <span className="text-gray-400">{mentor.cidade}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center text-xs bg-brand/20 text-brand-light border border-brand/30 px-2 py-0.5 rounded-full">
                    {labelModalidade(mentor.modalidadeMentoria)}
                  </span>
                  <span className="inline-flex items-center text-xs bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded-full">
                    {mentor.mentoriaGratuita ? 'Gratuita' : `${formatarValor(mentor.valorHoraMentoria)} / hora`}
                  </span>
                  {mentor.cidadeMentoria && (
                    <span className="inline-flex items-center text-xs bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded-full">
                      {mentor.cidadeMentoria}
                    </span>
                  )}
                </div>

                {(mentor.descricaoMentoria || mentor.bio) && (
                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">
                    {mentor.descricaoMentoria || mentor.bio}
                  </p>
                )}

                <div>
                  <p className="text-xs text-gray-500 mb-2">Expertise</p>
                  {mentor.tagsExpertise?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {mentor.tagsExpertise.map(tag => (
                        <span key={tag.id} className="tag-chip">{tag.nome}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhuma tag informada.</p>
                  )}
                </div>

                <div className="pt-2 mt-auto">
                  <a
                    href={`/portfolio/${mentor.urlPublica}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs py-1.5 px-3 inline-flex"
                  >
                    Ver portfolio
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
