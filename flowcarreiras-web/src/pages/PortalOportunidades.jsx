import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import InternalHeader from '../components/InternalHeader'
import { BellIcon } from '../components/StateIcons'
import { useAuth } from '../context/AuthContext'
import { listarOportunidades } from '../api/oportunidades'
import { listarNotificacoesOportunidades, marcarNotificacaoOportunidadeLida } from '../api/notificacoes'
import CardOportunidade from '../components/CardOportunidade'

const TIPOS = [
  { id: 'EDITAL', label: 'Editais' },
  { id: 'VAGA', label: 'Vagas' },
  { id: 'WORKSHOP', label: 'Workshops' },
  { id: 'RESIDENCIA', label: 'Residencias' },
  { id: 'EVENTO', label: 'Eventos' },
]

export default function PortalOportunidades() {
  const { usuario, logout } = useAuth()
  const [carregando, setCarregando] = useState(true)
  const [oportunidades, setOportunidades] = useState([])

  const [area, setArea] = useState('')
  const [prazo, setPrazo] = useState('')
  const [tiposSelecionados, setTiposSelecionados] = useState(['EDITAL', 'VAGA', 'WORKSHOP', 'RESIDENCIA', 'EVENTO'])

  const [menuNotificacoes, setMenuNotificacoes] = useState(false)
  const [notificacoes, setNotificacoes] = useState([])
  const [totalNaoLidas, setTotalNaoLidas] = useState(0)

  async function carregar() {
    setCarregando(true)
    try {
      const dados = await listarOportunidades({
        area,
        prazo,
        tipos: tiposSelecionados,
      })
      setOportunidades(dados)
    } finally {
      setCarregando(false)
    }
  }

  async function carregarNotificacoes() {
    try {
      const dados = await listarNotificacoesOportunidades(8)
      setNotificacoes(dados.notificacoes || [])
      setTotalNaoLidas(dados.totalNaoLidas || 0)
    } catch {
      setNotificacoes([])
      setTotalNaoLidas(0)
    }
  }

  useEffect(() => {
    carregar()
    carregarNotificacoes()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handle = setTimeout(() => carregar(), 250)
    return () => clearTimeout(handle)
  }, [area, prazo, tiposSelecionados]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!carregando && oportunidades.length > 0 && window.location.hash) {
      const id = window.location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [carregando, oportunidades])

  function toggleTipo(tipo) {
    setTiposSelecionados(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    )
  }

  function limparFiltros() {
    setArea('')
    setPrazo('')
    setTiposSelecionados(['EDITAL', 'VAGA', 'WORKSHOP', 'RESIDENCIA', 'EVENTO'])
  }

  async function abrirNotificacao(notificacao) {
    if (!notificacao?.oportunidadeId) return
    setMenuNotificacoes(false)
    if (!notificacao.lida) {
      await marcarNotificacaoOportunidadeLida(notificacao.id)
      await carregarNotificacoes()
    }
    window.location.hash = `oportunidade-${notificacao.oportunidadeId}`
  }

  return (
    <div className="min-h-screen">
      <InternalHeader
        rightSlot={
          <div className="relative">
            <button
              onClick={() => setMenuNotificacoes(v => !v)}
              className="relative text-gray-400 hover:text-white"
              aria-label="Notificacoes"
            >
              <BellIcon active={totalNaoLidas > 0} className="h-5 w-5" />
              {totalNaoLidas > 0 && (
                <span className="absolute -top-1 -right-2 rounded-full bg-brand px-1.5 py-0.5 text-[10px] text-white">
                  {totalNaoLidas}
                </span>
              )}
            </button>
            {menuNotificacoes && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-800 bg-card shadow-lg z-20">
                <div className="flex items-center justify-between border-b border-gray-800 p-3">
                  <span className="text-sm font-semibold">Notificacoes</span>
                  <button onClick={carregarNotificacoes} className="text-xs text-gray-500 hover:text-white">Atualizar</button>
                </div>
                <div className="max-h-72 overflow-auto">
                  {notificacoes.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">Sem notificacoes recentes.</div>
                  ) : (
                    notificacoes.map(n => (
                      <button
                        key={n.id}
                        onClick={() => abrirNotificacao(n)}
                        className={`w-full border-b border-gray-800 p-3 text-left hover:bg-gray-900 ${n.lida ? 'text-gray-500' : 'text-white'}`}
                      >
                        <div className="mb-1 text-xs uppercase text-brand">{n.tipo}</div>
                        <div className="line-clamp-2 text-sm font-medium">{n.titulo}</div>
                        <div className="mt-1 text-xs text-gray-500">Prazo: {new Date(n.dataEncerramento).toLocaleDateString('pt-BR')}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        }
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!usuario?.onboardingConcluido && (
          <div className="bg-card border border-gray-800 rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm text-white font-semibold">Complete seu cadastro para desbloquear mais oportunidades</p>
                <p className="text-xs text-gray-500">{usuario?.percentualCompletude ?? 0}% concluido</p>
              </div>
              <Link to="/onboarding" className="btn-primary text-sm px-4 py-2">Continuar cadastro</Link>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-brand" style={{ width: `${usuario?.percentualCompletude ?? 0}%` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-3">Filtros</h2>
              <div className="space-y-3">
                <input
                  className="input"
                  placeholder="Area artistica"
                  value={area}
                  onChange={e => setArea(e.target.value)}
                />
                <select className="input" value={prazo} onChange={e => setPrazo(e.target.value)}>
                  <option value="">Sem filtro de prazo</option>
                  <option value="semana">Esta semana</option>
                  <option value="mes">Este mes</option>
                </select>
              </div>
            </div>

            <div className="bg-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Tipos</h3>
              <div className="flex flex-wrap gap-2">
                {TIPOS.map(tipo => (
                  <button
                    key={tipo.id}
                    onClick={() => toggleTipo(tipo.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      tiposSelecionados.includes(tipo.id)
                        ? 'border-brand text-brand'
                        : 'border-gray-700 text-gray-500 hover:text-white'
                    }`}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={limparFiltros} className="btn-secondary w-full">Limpar filtros</button>
          </aside>

          <section className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Portal de Oportunidades</h2>
                <p className="text-sm text-gray-400">{oportunidades.length} oportunidades encontradas</p>
              </div>
              <button onClick={carregar} className="btn-secondary text-sm px-3 py-1.5">Atualizar</button>
            </div>

            {carregando ? (
              <div className="text-gray-400 text-sm">Carregando oportunidades...</div>
            ) : oportunidades.length === 0 ? (
              <div className="bg-card rounded-xl p-6 text-center text-gray-400">
                <p>Nenhuma oportunidade encontrada para os filtros selecionados.</p>
                <button onClick={limparFiltros} className="btn-secondary mt-4">Limpar filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {oportunidades.map(o => (
                  <CardOportunidade key={o.id} oportunidade={o} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
