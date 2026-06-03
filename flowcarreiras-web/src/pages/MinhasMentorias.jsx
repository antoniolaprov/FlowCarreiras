import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InternalHeader from '../components/InternalHeader'
import { useAuth } from '../context/AuthContext'
import { encerrarMentoria, listarMinhasMentorias } from '../api/mentorias'

function iniciais(nome) {
  return nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function formatarData(valor) {
  if (!valor) return ''
  return new Date(valor).toLocaleDateString('pt-BR')
}

function PessoaResumo({ perfil }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-12 h-12 rounded-full bg-brand/20 text-brand-light flex items-center justify-center font-bold overflow-hidden shrink-0">
        {perfil?.fotoPerfil ? (
          <img src={perfil.fotoPerfil} alt={perfil.nome} className="w-full h-full object-cover" />
        ) : (
          iniciais(perfil?.nome)
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-white truncate">{perfil?.nome}</p>
        <p className="text-sm text-gray-400 truncate">
          {[perfil?.areaArtisticaPrincipal, perfil?.cidade].filter(Boolean).join(' - ')}
        </p>
      </div>
    </div>
  )
}

export default function MinhasMentorias() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [dados, setDados] = useState({ comoMentor: [], comoArtista: [] })
  const [carregando, setCarregando] = useState(true)
  const [encerrandoId, setEncerrandoId] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    listarMinhasMentorias()
      .then(setDados)
      .catch(err => setErro(err.response?.data?.mensagem ?? 'Nao foi possivel carregar suas mentorias.'))
      .finally(() => setCarregando(false))
  }, [])

  async function encerrar(mentoria) {
    setEncerrandoId(mentoria.id)
    setErro(null)
    try {
      const atualizada = await encerrarMentoria(mentoria.id)
      setDados(prev => ({
        ...prev,
        comoMentor: prev.comoMentor.map(item => item.id === atualizada.id ? atualizada : item),
      }))
    } catch (err) {
      setErro(err.response?.data?.mensagem ?? 'Erro ao encerrar mentoria.')
    } finally {
      setEncerrandoId(null)
    }
  }

  function Secao({ titulo, vazio, mentorias, tipo }) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">{titulo}</h2>
        {mentorias.length === 0 ? (
          <div className="bg-card rounded-xl p-5 text-sm text-gray-400">{vazio}</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {mentorias.map(mentoria => {
              const pessoa = tipo === 'mentor' ? mentoria.artista : mentoria.mentor
              const ativa = mentoria.status === 'ATIVA'
              return (
                <article key={mentoria.id} className="bg-card rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <PessoaResumo perfil={pessoa} />
                    <span className={`text-xs border px-2 py-0.5 rounded-full shrink-0 ${ativa ? 'bg-green-900/40 text-green-400 border-green-800/60' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                      {ativa ? 'Ativa' : 'Encerrada'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Inicio: {formatarData(mentoria.dataCriacao)}
                    {mentoria.dataEncerramento && ` - Encerrada em ${formatarData(mentoria.dataEncerramento)}`}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/portfolio/${pessoa?.urlPublica}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      Ver portfolio
                    </a>
                    {tipo === 'mentor' && ativa && (
                      <button
                        onClick={() => encerrar(mentoria)}
                        disabled={encerrandoId === mentoria.id}
                        className="btn-danger text-xs py-1.5 px-3"
                      >
                        {encerrandoId === mentoria.id ? 'Encerrando...' : 'Encerrar'}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="min-h-screen">
      <InternalHeader />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-xl font-semibold">Acompanhe seus vinculos de mentoria</h1>
          <p className="text-sm text-gray-400 mt-1">
            Mentores podem encerrar mentorias ativas por aqui.
          </p>
        </div>

        {erro && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="text-gray-400 text-sm">Carregando mentorias...</div>
        ) : (
          <>
            <Secao
              titulo="Como mentor"
              vazio="Voce ainda nao selecionou artistas para mentoria."
              mentorias={dados.comoMentor || []}
              tipo="mentor"
            />
            <Secao
              titulo="Como artista"
              vazio="Voce ainda nao foi selecionado por um mentor."
              mentorias={dados.comoArtista || []}
              tipo="artista"
            />
          </>
        )}
      </main>
    </div>
  )
}
