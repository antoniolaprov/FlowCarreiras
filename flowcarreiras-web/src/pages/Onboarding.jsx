import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SeletorTags from '../components/SeletorTags'
import {
  obterPerfilOnboarding,
  salvarEtapaArea,
  salvarEtapaCidade,
  salvarEtapaBio,
  salvarEtapaTags,
  salvarEtapaFoto,
  salvarEtapaLinks,
  pularEtapa,
  concluirOnboarding,
} from '../api/perfil'

const ETAPAS = [
  { id: 'area', label: 'Area artistica', required: true },
  { id: 'tags', label: 'O que quer desenvolver', required: true },
  { id: 'cidade', label: 'Localizacao', required: true },
  { id: 'bio', label: 'Sobre voce', required: false },
  { id: 'foto', label: 'Foto de perfil', required: false },
  { id: 'links', label: 'Links externos', required: false },
]

const LIMIAR_BASICO = 40

const FEEDBACK = {
  area: 'Otimo! Agora as pessoas certas vao te encontrar.',
  tags: 'Incrivel! Ja conseguimos te conectar com os mentores certos.',
  cidade: 'Recife tem talento demais. Voce esta no mapa!',
  bio: 'Sua historia e unica. As pessoas vao adorar te conhecer!',
  foto: 'Perfeito! Seu perfil ficou mais humano e confiavel.',
  links: 'Show! Agora podemos destacar seu trabalho em outros lugares.',
}

// 0 = boas-vindas
const IDX_BOAS_VINDAS = 0

function statusKey(id) {
  return `statusEtapa${id.charAt(0).toUpperCase() + id.slice(1)}`
}

function calcularEtapaInicial(status) {
  if (!status) return IDX_BOAS_VINDAS
  const todasPendentes = ETAPAS.every(k => status[statusKey(k.id)] === 'PENDENTE')
  if (todasPendentes) return IDX_BOAS_VINDAS
  const primeiraIdx = ETAPAS.findIndex(e => status[statusKey(e.id)] === 'PENDENTE')
  return primeiraIdx === -1 ? ETAPAS.length + 1 : primeiraIdx + 1
}

function calcularProgresso(status) {
  return status?.percentualCompletude ?? 0
}

function etapasObrigatoriasConcluidas(status) {
  if (!status) return false
  return ETAPAS.filter(e => e.required).every(e => status[statusKey(e.id)] === 'CONCLUIDA')
}

export default function Onboarding() {
  const { onboardingConcluido, marcarOnboardingConcluido } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Retomada de uma etapa especifica a partir do "Complete seu perfil" (Historia 1.3),
  // sem reiniciar o fluxo completo do onboarding.
  const etapaParam = searchParams.get('etapa')
  const modoRetomada = Boolean(etapaParam && ETAPAS.some(e => e.id === etapaParam))

  const [etapaAtual, setEtapaAtual] = useState(IDX_BOAS_VINDAS)
  const [status, setStatus] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const [area, setArea] = useState('')
  const [cidade, setCidade] = useState('')
  const [bio, setBio] = useState('')
  const [tagsSelecionadas, setTagsSelecionadas] = useState([])
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [linksExternos, setLinksExternos] = useState([])

  useEffect(() => {
    // Em modo retomada permitimos o acesso mesmo com onboarding ja concluido,
    // para preencher uma etapa opcional que foi pulada.
    if (onboardingConcluido && !modoRetomada) {
      navigate('/oportunidades', { replace: true })
      return
    }
    obterPerfilOnboarding()
      .then(s => {
        setStatus(s)
        setArea(s.areaArtisticaPrincipal || '')
        setCidade(s.cidade || '')
        setBio(s.bio || '')
        setTagsSelecionadas(s.tagsNecessidade || [])
        setFotoPreview(s.fotoPerfil || null)
        setLinksExternos(s.linksExternos || [])
        if (modoRetomada) {
          const idx = ETAPAS.findIndex(e => e.id === etapaParam)
          setEtapaAtual(idx + 1)
          return
        }
        const inicial = calcularEtapaInicial(s)
        if (inicial > ETAPAS.length && etapasObrigatoriasConcluidas(s)) {
          return concluirOnboarding().then(() => {
            marcarOnboardingConcluido()
            navigate('/oportunidades', { replace: true })
          })
        }
        setEtapaAtual(inicial)
      })
      .finally(() => setCarregando(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function mostrarFeedback(etapaId, novoStatus) {
    setStatus(novoStatus)
    setFeedback(FEEDBACK[etapaId])
    setTimeout(() => {
      setFeedback(null)
      if (modoRetomada) {
        navigate('/meu-perfil', { replace: true })
      } else {
        avancar()
      }
    }, 1500)
  }

  function avancar() {
    const proxima = etapaAtual + 1
    if (proxima > ETAPAS.length) {
      finalizarOnboarding()
    } else {
      setEtapaAtual(proxima)
    }
  }

  async function finalizarOnboarding() {
    if (modoRetomada) {
      return navigate('/meu-perfil', { replace: true })
    }
    if (!etapasObrigatoriasConcluidas(status)) {
      return sairAgora()
    }
    setSalvando(true)
    try {
      await concluirOnboarding()
      marcarOnboardingConcluido()
      navigate('/oportunidades', { replace: true })
    } finally {
      setSalvando(false)
    }
  }

  function sairAgora() {
    navigate('/oportunidades', { replace: true })
  }

  async function handleSalvarArea() {
    if (!area.trim()) return
    setSalvando(true)
    try {
      const novo = await salvarEtapaArea(area.trim())
      mostrarFeedback('area', novo)
    } finally {
      setSalvando(false)
    }
  }

  async function handleSalvarCidade() {
    if (!cidade.trim()) return
    setSalvando(true)
    try {
      const novo = await salvarEtapaCidade(cidade.trim())
      mostrarFeedback('cidade', novo)
    } finally {
      setSalvando(false)
    }
  }

  async function handleSalvarBio() {
    if (!bio.trim()) return
    setSalvando(true)
    try {
      const novo = await salvarEtapaBio(bio.trim())
      mostrarFeedback('bio', novo)
    } finally {
      setSalvando(false)
    }
  }

  async function handleSalvarTags() {
    if (tagsSelecionadas.length === 0) return
    setSalvando(true)
    try {
      const novo = await salvarEtapaTags(tagsSelecionadas.map(t => t.id))
      mostrarFeedback('tags', novo)
    } finally {
      setSalvando(false)
    }
  }

  async function handleSalvarFoto() {
    if (!fotoFile) return
    setSalvando(true)
    try {
      const novo = await salvarEtapaFoto(fotoFile)
      mostrarFeedback('foto', novo)
    } finally {
      setSalvando(false)
    }
  }

  async function handleSalvarLinks() {
    const linksValidos = linksExternos.map(l => l.trim()).filter(Boolean)
    if (linksValidos.length === 0) return
    setSalvando(true)
    try {
      const novo = await salvarEtapaLinks(linksValidos)
      mostrarFeedback('links', novo)
    } finally {
      setSalvando(false)
    }
  }

  async function handlePular(etapaId) {
    setSalvando(true)
    try {
      const novo = await pularEtapa(etapaId)
      setStatus(novo)
      if (modoRetomada) {
        navigate('/meu-perfil', { replace: true })
      } else {
        avancar()
      }
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Carregando...</div>
      </div>
    )
  }

  const progresso = calcularProgresso(status)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {modoRetomada ? (
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate('/meu-perfil')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Voltar ao perfil
            </button>
            <span className="text-xs text-gray-500">{progresso}% concluido</span>
          </div>
        ) : etapaAtual >= 1 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Etapa {etapaAtual} de {ETAPAS.length}</span>
              <span>{progresso}% concluido</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        )}

        {feedback && (
          <div className="mb-4 px-4 py-3 bg-green-900/30 border border-green-700 rounded-xl text-green-400 text-sm text-center animate-pulse">
            {feedback}
          </div>
        )}

        <div className="card p-6 md:p-8">
          {etapaAtual === IDX_BOAS_VINDAS && (
            <div className="text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h1 className="text-2xl font-bold text-brand mb-2">Bem-vinda ao Flow Carreiras</h1>
              <p className="text-gray-300 text-sm leading-relaxed mb-2">
                Uma plataforma feita <strong>por</strong> e <strong>para</strong> artistas emergentes de Recife.
              </p>
              <ul className="text-gray-400 text-sm space-y-2 text-left my-5 px-2">
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span><strong className="text-white">Portfolio profissional</strong> sem depender de outras plataformas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span><strong className="text-white">Mentoria entre artistas</strong> baseada em compatibilidade real</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span><strong className="text-white">Exposicao justa</strong> sem likes, sem algoritmo de popularidade</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span><strong className="text-white">Oportunidades centralizadas</strong> — editais, vagas, workshops</span>
                </li>
              </ul>
              <p className="text-gray-500 text-xs mb-6">
                Vamos configurar seu perfil em 6 etapas leves. Voce pode pular as opcionais.
              </p>
              <button
                onClick={() => setEtapaAtual(1)}
                className="btn-primary w-full py-3 text-base"
              >
                Comecar
              </button>
            </div>
          )}

          {etapaAtual === 1 && (
            <EtapaWrapper
              titulo="Qual e sua area artistica principal?"
              descricao="Isso ajuda outros artistas e mentores a te encontrarem."
              salvando={salvando}
              podeSalvar={area.trim().length > 0}
              onSalvar={handleSalvarArea}
              onPular={null}
              onPularTudo={finalizarOnboarding}
              progresso={progresso}
              modoRetomada={modoRetomada}
            >
              <input
                className="input"
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="Ex: Musica, Artes Visuais, Teatro, Danca..."
                maxLength={100}
                autoFocus
              />
            </EtapaWrapper>
          )}

          {etapaAtual === 2 && (
            <EtapaWrapper
              titulo="O que voce quer desenvolver?"
              descricao="Adicione tags das areas em que busca orientacao."
              salvando={salvando}
              podeSalvar={tagsSelecionadas.length > 0}
              onSalvar={handleSalvarTags}
              onPular={null}
              onPularTudo={finalizarOnboarding}
              progresso={progresso}
              modoRetomada={modoRetomada}
            >
              <SeletorTags
                tagsSelecionadas={tagsSelecionadas}
                onChange={setTagsSelecionadas}
                maxTags={10}
              />
              {tagsSelecionadas.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Selecione ao menos uma tag para encontrar mentores compativeis.
                </p>
              )}
            </EtapaWrapper>
          )}

          {etapaAtual === 3 && (
            <EtapaWrapper
              titulo="Em qual cidade voce esta sediada?"
              descricao="Conectamos artistas da mesma regiao para colaboracoes presenciais."
              salvando={salvando}
              podeSalvar={cidade.trim().length > 0}
              onSalvar={handleSalvarCidade}
              onPular={null}
              onPularTudo={finalizarOnboarding}
              progresso={progresso}
              modoRetomada={modoRetomada}
            >
              <input
                className="input"
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                placeholder="Ex: Recife, Olinda, Caruaru..."
                maxLength={100}
                autoFocus
              />
            </EtapaWrapper>
          )}

          {etapaAtual === 4 && (
            <EtapaWrapper
              titulo="Conte um pouco sobre voce"
              descricao="Uma apresentacao breve ajuda outras artistas a te conhecerem antes de fazer contato."
              salvando={salvando}
              podeSalvar={bio.trim().length > 0}
              onSalvar={handleSalvarBio}
              onPular={() => handlePular('bio')}
              onPularTudo={finalizarOnboarding}
              progresso={progresso}
              modoRetomada={modoRetomada}
            >
              <textarea
                className="input resize-none"
                rows={4}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Ex: Sou ilustradora independente com foco em identidade visual para artistas..."
                maxLength={1000}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{bio.length}/1000</p>
            </EtapaWrapper>
          )}

          {etapaAtual === 5 && (
            <EtapaWrapper
              titulo="Adicione uma foto de perfil"
              descricao="Perfis com foto geram mais confianca e conexoes reais."
              salvando={salvando}
              podeSalvar={Boolean(fotoFile)}
              onSalvar={handleSalvarFoto}
              onPular={() => handlePular('foto')}
              onPularTudo={finalizarOnboarding}
              progresso={progresso}
              modoRetomada={modoRetomada}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-900 border border-gray-800 flex items-center justify-center">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Previa" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">📷</span>
                  )}
                </div>
                <label className="btn-secondary text-sm px-4 py-2 cursor-pointer">
                  Selecionar foto
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setFotoFile(file)
                      setFotoPreview(URL.createObjectURL(file))
                    }}
                  />
                </label>
                {fotoFile && (
                  <p className="text-xs text-gray-500">{fotoFile.name}</p>
                )}
              </div>
            </EtapaWrapper>
          )}

          {etapaAtual === 6 && (
            <EtapaWrapper
              titulo="Onde podemos encontrar seu trabalho?"
              descricao="Adicione ate 5 links (portfolio, Instagram, Behance, etc)."
              salvando={salvando}
              podeSalvar={linksExternos.some(l => l.trim().length > 0)}
              onSalvar={handleSalvarLinks}
              onPular={() => handlePular('links')}
              onPularTudo={finalizarOnboarding}
              progresso={progresso}
              modoRetomada={modoRetomada}
              labelSalvar={etapasObrigatoriasConcluidas(status) ? 'Concluir cadastro' : 'Salvar e continuar'}
            >
              <div className="space-y-2">
                {linksExternos.map((link, idx) => (
                  <div key={`${idx}-${link}`} className="flex gap-2">
                    <input
                      className="input flex-1"
                      value={link}
                      onChange={e => {
                        const novo = [...linksExternos]
                        novo[idx] = e.target.value
                        setLinksExternos(novo)
                      }}
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => setLinksExternos(linksExternos.filter((_, i) => i !== idx))}
                      className="btn-danger text-xs px-3"
                    >
                      Remover
                    </button>
                  </div>
                ))}
                {linksExternos.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setLinksExternos([...linksExternos, ''])}
                    className="btn-secondary text-xs px-3 py-2"
                  >
                    + Adicionar link
                  </button>
                )}
              </div>
            </EtapaWrapper>
          )}
        </div>

        {!modoRetomada && etapaAtual >= 1 && (
          <div className="flex justify-center gap-2 mt-5">
            {ETAPAS.map((e, i) => {
              const s = status?.[statusKey(e.id)]
              const ativa = i + 1 === etapaAtual
              const concluida = s === 'CONCLUIDA'
              const pulada = s === 'PULADA'
              return (
                <div
                  key={e.id}
                  title={e.label}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    ativa ? 'w-6 bg-brand' :
                    concluida ? 'w-2 bg-brand/60' :
                    pulada ? 'w-2 bg-gray-600' :
                    'w-2 bg-gray-700'
                  }`}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function EtapaWrapper({ titulo, descricao, children, salvando, podeSalvar, onSalvar, onPular, onPularTudo, labelSalvar, progresso, modoRetomada }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">{titulo}</h2>
      {descricao && <p className="text-gray-400 text-sm mb-5">{descricao}</p>}

      <div className="mb-5">{children}</div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onSalvar}
          disabled={salvando || !podeSalvar}
          className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {salvando ? 'Salvando...' : (modoRetomada ? 'Salvar' : (labelSalvar || 'Proximo'))}
        </button>
        {onPular && (
          <button
            type="button"
            onClick={onPular}
            disabled={salvando}
            className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Pular por agora
          </button>
        )}
      </div>

      {!modoRetomada && progresso >= LIMIAR_BASICO && (
        <div className="mt-4 pt-4 border-t border-gray-800 text-center">
          <button
            type="button"
            onClick={onPularTudo}
            disabled={salvando}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Explorar a plataforma agora
          </button>
        </div>
      )}
    </div>
  )
}
