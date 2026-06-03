import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarComentarios, criarComentario } from '../api/comentarios'
import { useAuth } from '../context/AuthContext'

function formatarData(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function ComentariosModal({ obra, onClose }) {
  const { token } = useAuth()
  const [comentarios, setComentarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      try {
        const dados = await listarComentarios(obra.id)
        if (ativo) setComentarios(dados)
      } catch {
        if (ativo) setErro('Não foi possível carregar os comentários.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    carregar()
    return () => { ativo = false }
  }, [obra.id])

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

  async function enviar(e) {
    e.preventDefault()
    const limpo = texto.trim()
    if (!limpo) return
    setEnviando(true)
    setErro(null)
    try {
      const novo = await criarComentario(obra.id, limpo)
      setComentarios(prev => [novo, ...prev])
      setTexto('')
    } catch (err) {
      setErro(err.response?.data?.mensagem ?? 'Erro ao enviar comentário. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card flex w-full max-w-lg max-h-[85vh] flex-col rounded-2xl border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <div className="min-w-0">
            <h2 className="font-semibold leading-tight line-clamp-1">{obra.titulo}</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              {comentarios.length} {comentarios.length === 1 ? 'comentário' : 'comentários'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-xl leading-none text-gray-400 transition-colors hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Lista de comentários */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {carregando ? (
            <p className="text-sm text-gray-400">Carregando comentários...</p>
          ) : comentarios.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Ainda não há comentários. Seja o primeiro!
            </p>
          ) : (
            comentarios.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand-light">
                  {c.autorNome?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{c.autorNome}</span>
                    <span className="text-xs text-gray-500">{formatarData(c.dataCriacao)}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-gray-200">{c.texto}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Caixa de envio */}
        <div className="border-t border-white/10 p-4">
          {token ? (
            <form onSubmit={enviar} className="space-y-2">
              <textarea
                className="input resize-none"
                rows={2}
                maxLength={1000}
                placeholder="Escreva um comentário..."
                value={texto}
                onChange={e => setTexto(e.target.value)}
              />
              {erro && <p className="text-xs text-red-400">{erro}</p>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={enviando || !texto.trim()}
                  className="btn-primary px-4 py-1.5 text-sm"
                >
                  {enviando ? 'Enviando...' : 'Comentar'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-center text-sm text-gray-400">
              <Link to="/login" className="text-brand hover:underline">Entre</Link> para deixar um comentário.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
