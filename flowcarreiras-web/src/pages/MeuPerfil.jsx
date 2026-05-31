import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { obterMeuPerfil, atualizarPerfil, atualizarFotoPerfil } from '../api/perfil'
import { ativarMentoria, pausarMentoria } from '../api/mentorias'
import SeletorTags from '../components/SeletorTags'

const GRADIENTES = [
  'from-violet-900 via-purple-800 to-indigo-900',
  'from-indigo-900 via-blue-800 to-cyan-900',
  'from-fuchsia-900 via-purple-800 to-violet-900',
  'from-purple-900 via-indigo-800 to-blue-900',
]

function gradienteParaArea(area) {
  if (!area) return GRADIENTES[0]
  const idx = area.charCodeAt(0) % GRADIENTES.length
  return GRADIENTES[idx]
}

// Etapas do onboarding (Historia 1.3) — usadas para listar pendencias no painel
// e permitir retomada direta, sem reiniciar o fluxo completo.
const ETAPAS_ONBOARDING = [
  { id: 'area', label: 'Area artistica', chave: 'statusEtapaArea' },
  { id: 'tags', label: 'O que quer desenvolver', chave: 'statusEtapaTags' },
  { id: 'cidade', label: 'Localizacao', chave: 'statusEtapaCidade' },
  { id: 'bio', label: 'Apresentacao (bio)', chave: 'statusEtapaBio' },
  { id: 'foto', label: 'Foto de perfil', chave: 'statusEtapaFoto' },
  { id: 'links', label: 'Links externos', chave: 'statusEtapaLinks' },
]

function calcularEtapasPendentes(perfil) {
  if (!perfil) return []
  return ETAPAS_ONBOARDING.filter(e => {
    const s = perfil[e.chave]
    return s === 'PENDENTE' || s === 'PULADA'
  })
}

function Secao({ titulo, children, editando, onEditar, onSalvar, onCancelar, salvando, podeSalvar = true }) {
  return (
    <div className="bg-card rounded-xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white">{titulo}</h3>
        {!editando && onEditar && (
          <button onClick={onEditar} className="text-gray-500 hover:text-brand transition-colors p-1 rounded-lg hover:bg-brand/10" title="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
        {editando && (
          <div className="flex gap-2">
            <button onClick={onCancelar} disabled={salvando} className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
              Cancelar
            </button>
            <button onClick={onSalvar} disabled={salvando || !podeSalvar} className="text-xs bg-brand hover:bg-brand-dark text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

export default function MeuPerfil() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [uploadandoFoto, setUploadandoFoto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erroFoto, setErroFoto] = useState(null)
  const [acaoMentoria, setAcaoMentoria] = useState(null)
  const [erroMentoria, setErroMentoria] = useState(null)
  const [lembreteVisivel, setLembreteVisivel] = useState(false)

  // Formulários por seção
  const [formInfo, setFormInfo] = useState({ areaArtisticaPrincipal: '', cidade: '' })
  const [formBio, setFormBio] = useState('')
  const [formExpertise, setFormExpertise] = useState([])
  const [formNecessidade, setFormNecessidade] = useState([])
  const [receberNotificacoes, setReceberNotificacoes] = useState(true)

  useEffect(() => {
    obterMeuPerfil()
      .then(p => {
        setPerfil(p)
        sincronizarForms(p)
        // Lembrete discreto de etapas pendentes: no maximo 1x por sessao (Historia 1.3)
        if (calcularEtapasPendentes(p).length > 0 && !sessionStorage.getItem('fc_lembrete_etapas')) {
          setLembreteVisivel(true)
          sessionStorage.setItem('fc_lembrete_etapas', '1')
        }
      })
      .finally(() => setCarregando(false))
  }, [])

  function sincronizarForms(p) {
    setFormInfo({
      areaArtisticaPrincipal: p.areaArtisticaPrincipal || '',
      cidade: p.cidade || '',
    })
    setFormBio(p.bio || '')
    setFormExpertise(p.tagsExpertise || [])
    setFormNecessidade(p.tagsNecessidade || [])
    setReceberNotificacoes(p.receberNotificacoesOportunidades ?? true)
  }

  function cancelar() {
    sincronizarForms(perfil)
    setEditando(null)
  }

  async function salvarSecao(payload) {
    setSalvando(true)
    try {
      const novo = await atualizarPerfil(payload)
      setPerfil(novo)
      sincronizarForms(novo)
      setEditando(null)
    } finally {
      setSalvando(false)
    }
  }

  async function handleFotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setErroFoto(null)
    setUploadandoFoto(true)
    try {
      const novo = await atualizarFotoPerfil(file)
      setPerfil(novo)
    } catch (err) {
      setErroFoto(err.response?.data?.mensagem ?? 'Erro ao fazer upload da foto.')
    } finally {
      setUploadandoFoto(false)
      e.target.value = ''
    }
  }

  async function handleAtivarMentoria() {
    if (!perfil?.perfilMentorConfigurado) {
      navigate('/mentoria/configurar')
      return
    }
    setErroMentoria(null)
    setAcaoMentoria('ativar')
    try {
      const config = await ativarMentoria()
      setPerfil(p => ({ ...p, ...config }))
    } catch (err) {
      setErroMentoria(err.response?.data?.mensagem ?? 'Complete os dados da mentoria antes de ativar.')
    } finally {
      setAcaoMentoria(null)
    }
  }

  async function handlePausarMentoria() {
    setErroMentoria(null)
    setAcaoMentoria('pausar')
    try {
      const config = await pausarMentoria()
      setPerfil(p => ({ ...p, ...config }))
    } catch (err) {
      setErroMentoria(err.response?.data?.mensagem ?? 'Erro ao pausar mentoria.')
    } finally {
      setAcaoMentoria(null)
    }
  }

  function formatarValorMentoria(valor) {
    if (valor === null || valor === undefined || valor === '') return null
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Carregando perfil...</div>
      </div>
    )
  }

  const gradiente = gradienteParaArea(perfil?.areaArtisticaPrincipal)
  const iniciais = perfil?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
  const etapasPendentes = calcularEtapasPendentes(perfil)

  return (
    <div className="min-h-screen">
      {/* Header fixo */}
      <header className="bg-card border-b border-gray-800 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/portfolio/minhas-obras')} className="text-gray-400 hover:text-white transition-colors">
              ←
            </button>
            <span className="font-semibold text-brand">Meu Perfil</span>
          </div>
          <div className="flex items-center gap-3">
            <a href={`/portfolio/${perfil?.urlPublica}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-brand transition-colors">
              Ver público →
            </a>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-white">Sair</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Lembrete discreto de etapas pendentes — nao bloqueia a navegacao (Historia 1.3) */}
        {lembreteVisivel && etapasPendentes.length > 0 && (
          <div className="flex items-center justify-between gap-3 bg-brand/10 border border-brand/30 rounded-xl px-4 py-3">
            <span className="text-sm text-brand-light">
              Voce tem {etapasPendentes.length} etapa{etapasPendentes.length !== 1 ? 's' : ''} do perfil para completar quando quiser.
            </span>
            <button
              onClick={() => setLembreteVisivel(false)}
              className="text-gray-400 hover:text-white text-sm shrink-0"
              aria-label="Dispensar lembrete"
            >
              ✕
            </button>
          </div>
        )}

        {/* Card principal — banner + avatar + info */}
        <div className="bg-card rounded-xl overflow-hidden">
          {/* Banner */}
          <div className={`h-32 md:h-40 bg-gradient-to-r ${gradiente} relative`}>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
          </div>

          <div className="px-5 md:px-6 pb-5">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-10 mb-3">
              <div className="relative group">
                <div
                  onClick={() => !uploadandoFoto && fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-4 border-card bg-card overflow-hidden cursor-pointer relative"
                  title="Alterar foto de perfil"
                >
                  {perfil?.fotoPerfil ? (
                    <img src={perfil.fotoPerfil} alt={perfil.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradiente} text-white text-xl font-bold select-none`}>
                      {iniciais}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    {uploadandoFoto ? (
                      <span className="text-white text-xs">...</span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                      </svg>
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleFotoChange} className="hidden" />
              </div>

              {/* Completude */}
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">{perfil?.percentualCompletude ?? 0}% completo</p>
                <div className="w-28 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${perfil?.percentualCompletude ?? 0}%` }} />
                </div>
              </div>
            </div>

            {erroFoto && <p className="text-red-400 text-xs mb-2">{erroFoto}</p>}

            {/* Nome e info básica */}
            {editando === 'info' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Área artística</label>
                  <input className="input" value={formInfo.areaArtisticaPrincipal} onChange={e => setFormInfo(f => ({ ...f, areaArtisticaPrincipal: e.target.value }))} placeholder="Ex: Música, Ilustração, Teatro..." maxLength={100} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Cidade</label>
                  <input className="input" value={formInfo.cidade} onChange={e => setFormInfo(f => ({ ...f, cidade: e.target.value }))} placeholder="Ex: Recife, PE" maxLength={100} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => cancelar()} disabled={salvando} className="flex-1 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors">Cancelar</button>
                  <button onClick={() => salvarSecao({ areaArtisticaPrincipal: formInfo.areaArtisticaPrincipal, cidade: formInfo.cidade })} disabled={salvando} className="flex-1 py-2 text-sm bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors disabled:opacity-50">
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h1 className="text-xl font-bold text-white">{perfil?.nome}</h1>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      {perfil?.areaArtisticaPrincipal && (
                        <span className="text-brand-light text-sm font-medium">{perfil.areaArtisticaPrincipal}</span>
                      )}
                      {perfil?.areaArtisticaPrincipal && perfil?.cidade && (
                        <span className="text-gray-600 text-sm">·</span>
                      )}
                      {perfil?.cidade && (
                        <span className="text-gray-400 text-sm">📍 {perfil.cidade}</span>
                      )}
                    </div>
                    {perfil?.disponivelParaMentorar && (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs bg-green-900/40 text-green-400 border border-green-800/60 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                        Disponível para mentorar
                      </span>
                    )}
                  </div>
                  <button onClick={() => setEditando('info')} className="text-gray-500 hover:text-brand transition-colors p-1 rounded-lg hover:bg-brand/10 shrink-0 mt-1" title="Editar informações">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
                {!perfil?.areaArtisticaPrincipal && !perfil?.cidade && (
                  <button onClick={() => setEditando('info')} className="mt-2 text-xs text-gray-500 hover:text-brand transition-colors">
                    + Adicionar área artística e cidade
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Complete seu perfil — etapas pendentes com retomada direta (Historia 1.3) */}
        {etapasPendentes.length > 0 && (
          <div className="bg-card rounded-xl p-5 md:p-6">
            <div className="mb-3">
              <h3 className="font-semibold text-white">Complete seu perfil</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {etapasPendentes.length} etapa{etapasPendentes.length !== 1 ? 's' : ''} pendente{etapasPendentes.length !== 1 ? 's' : ''}. Continue de onde parou.
              </p>
            </div>
            <ul className="space-y-2">
              {etapasPendentes.map(etapa => (
                <li
                  key={etapa.id}
                  className="flex items-center justify-between gap-3 bg-gray-900/40 border border-gray-800 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-gray-300">{etapa.label}</span>
                  <button
                    onClick={() => navigate(`/onboarding?etapa=${etapa.id}`)}
                    className="text-xs text-brand hover:text-brand-light transition-colors shrink-0"
                  >
                    Completar →
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sobre (bio) */}
        <Secao
          titulo="Sobre"
          editando={editando === 'bio'}
          onEditar={() => setEditando('bio')}
          onSalvar={() => salvarSecao({ bio: formBio })}
          onCancelar={cancelar}
          salvando={salvando}
        >
          {editando === 'bio' ? (
            <div>
              <textarea
                className="input resize-none"
                rows={5}
                value={formBio}
                onChange={e => setFormBio(e.target.value)}
                placeholder="Fale sobre sua trajetória, seu trabalho e o que te motiva como artista..."
                maxLength={1000}
                autoFocus
              />
              <p className="text-xs text-gray-600 mt-1 text-right">{formBio.length}/1000</p>
            </div>
          ) : perfil?.bio ? (
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{perfil.bio}</p>
          ) : (
            <button onClick={() => setEditando('bio')} className="text-sm text-gray-500 hover:text-brand transition-colors">
              + Adicionar uma apresentação sobre você
            </button>
          )}
        </Secao>

        <Secao
          titulo="Notificacoes de oportunidades"
          editando={editando === 'notificacoes'}
          onEditar={() => setEditando('notificacoes')}
          onSalvar={() => salvarSecao({ receberNotificacoesOportunidades: receberNotificacoes })}
          onCancelar={cancelar}
          salvando={salvando}
        >
          {editando === 'notificacoes' ? (
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-300">Receber alertas de novas oportunidades</span>
              <input
                type="checkbox"
                checked={receberNotificacoes}
                onChange={e => setReceberNotificacoes(e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Alertas de novas oportunidades</span>
              <span className={`text-xs px-2 py-1 rounded-full ${perfil?.receberNotificacoesOportunidades ? 'bg-brand/20 text-brand-light' : 'bg-gray-800 text-gray-400'}`}>
                {perfil?.receberNotificacoesOportunidades ? 'Ativo' : 'Desativado'}
              </span>
            </div>
          )}
        </Secao>

        {/* Expertise */}
        <Secao
          titulo="Expertise"
          editando={editando === 'expertise'}
          onEditar={() => setEditando('expertise')}
          onSalvar={() => salvarSecao({ tagsExpertiseIds: formExpertise.map(t => t.id) })}
          onCancelar={cancelar}
          salvando={salvando}
        >
          {editando === 'expertise' ? (
            <div>
              <p className="text-xs text-gray-500 mb-3">As áreas em que você tem experiência e pode ensinar.</p>
              <SeletorTags tagsSelecionadas={formExpertise} onChange={setFormExpertise} maxTags={10} />
            </div>
          ) : perfil?.tagsExpertise?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {perfil.tagsExpertise.map(tag => (
                <span key={tag.id} className="tag-chip">{tag.nome}</span>
              ))}
            </div>
          ) : (
            <button onClick={() => setEditando('expertise')} className="text-sm text-gray-500 hover:text-brand transition-colors">
              + Adicionar suas áreas de expertise
            </button>
          )}
        </Secao>

        {/* O que quero aprender */}
        <Secao
          titulo="O que quero desenvolver"
          editando={editando === 'necessidade'}
          onEditar={() => setEditando('necessidade')}
          onSalvar={() => salvarSecao({ tagsNecessidadeIds: formNecessidade.map(t => t.id) })}
          onCancelar={cancelar}
          salvando={salvando}
        >
          {editando === 'necessidade' ? (
            <div>
              <p className="text-xs text-gray-500 mb-3">As áreas em que você busca mentoria e desenvolvimento.</p>
              <SeletorTags tagsSelecionadas={formNecessidade} onChange={setFormNecessidade} maxTags={10} />
            </div>
          ) : perfil?.tagsNecessidade?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {perfil.tagsNecessidade.map(tag => (
                <span key={tag.id} className="inline-flex items-center bg-indigo-900/30 text-indigo-300 border border-indigo-800/50 text-xs font-medium px-2 py-0.5 rounded-full">{tag.nome}</span>
              ))}
            </div>
          ) : (
            <button onClick={() => setEditando('necessidade')} className="text-sm text-gray-500 hover:text-brand transition-colors">
              + Adicionar o que você quer aprender
            </button>
          )}
        </Secao>

        {/* Mentoria */}
        <div className="bg-card rounded-xl p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold text-white">Mentoria</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure sua oferta, modalidade e disponibilidade como mentor.
              </p>
            </div>
            {perfil?.perfilMentorConfigurado && (
              <button
                onClick={() => navigate('/mentoria/configurar')}
                className="text-xs text-brand hover:text-brand-light transition-colors shrink-0"
              >
                Editar
              </button>
            )}
          </div>

          {!perfil?.perfilMentorConfigurado ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Voce ainda nao configurou seus dados de mentor.
              </p>
              <button onClick={() => navigate('/mentoria/configurar')} className="btn-primary text-sm py-2 px-3">
                Tornar-me mentor
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1 text-xs border px-2 py-0.5 rounded-full ${perfil.disponivelParaMentorar ? 'bg-green-900/40 text-green-400 border-green-800/60' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${perfil.disponivelParaMentorar ? 'bg-green-400' : 'bg-gray-500'}`} />
                  {perfil.disponivelParaMentorar ? 'Mentoria ativa' : 'Mentoria pausada'}
                </span>
                <span className="inline-flex items-center text-xs bg-brand/20 text-brand-light border border-brand/30 px-2 py-0.5 rounded-full">
                  {perfil.modalidadeMentoria === 'HIBRIDA' ? 'Hibrida' : perfil.modalidadeMentoria === 'PRESENCIAL' ? 'Presencial' : 'Remota'}
                </span>
                <span className="inline-flex items-center text-xs bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded-full">
                  {perfil.mentoriaGratuita ? 'Gratuita' : `${formatarValorMentoria(perfil.valorHoraMentoria)} / hora`}
                </span>
              </div>

              {perfil.cidadeMentoria && (
                <p className="text-sm text-gray-400">Base: {perfil.cidadeMentoria}</p>
              )}
              {perfil.descricaoMentoria && (
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{perfil.descricaoMentoria}</p>
              )}

              {erroMentoria && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm">
                  {erroMentoria}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                {perfil.disponivelParaMentorar ? (
                  <button
                    onClick={handlePausarMentoria}
                    disabled={acaoMentoria === 'pausar'}
                    className="btn-secondary text-sm py-2 px-3"
                  >
                    {acaoMentoria === 'pausar' ? 'Pausando...' : 'Pausar mentoria'}
                  </button>
                ) : (
                  <button
                    onClick={handleAtivarMentoria}
                    disabled={acaoMentoria === 'ativar'}
                    className="btn-primary text-sm py-2 px-3"
                  >
                    {acaoMentoria === 'ativar' ? 'Ativando...' : 'Reativar mentoria'}
                  </button>
                )}
                <button onClick={() => navigate('/mentoria/configurar')} className="btn-secondary text-sm py-2 px-3">
                  Editar dados
                </button>
                <button onClick={() => navigate('/mentoria/minhas')} className="btn-secondary text-sm py-2 px-3">
                  Minhas mentorias
                </button>
                {perfil.disponivelParaMentorar && (
                  <button onClick={() => navigate('/mentoria/artistas')} className="btn-primary text-sm py-2 px-3">
                    Ver artistas disponiveis
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Portfólio */}
        <div className="bg-card rounded-xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Portfólio</h3>
            <Link to="/portfolio/minhas-obras" className="text-xs text-brand hover:text-brand-light transition-colors">
              Gerenciar obras →
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{perfil?.totalObras ?? 0}</p>
              <p className="text-xs text-gray-500">{perfil?.totalObras === 1 ? 'obra' : 'obras'}</p>
            </div>
            <div className="flex-1 text-sm text-gray-400">
              {perfil?.totalObras === 0
                ? 'Você ainda não publicou nenhuma obra.'
                : `${perfil?.totalObras} obra${perfil?.totalObras !== 1 ? 's' : ''} no portfólio.`
              }
            </div>
            <a
              href={`/portfolio/${perfil?.urlPublica}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3 shrink-0"
            >
              Ver público
            </a>
          </div>
        </div>

      </main>
    </div>
  )
}
