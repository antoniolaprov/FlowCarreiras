import { useEffect, useRef, useState } from 'react'
import { listarMensagens, enviarMensagem } from '../api/mentorias'

const INTERVALO_POLLING = 4000

function formatarHora(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function ChatMentoriaModal({ mentoria, pessoa, onClose }) {
  const ativa = mentoria.status === 'ATIVA'
  const [mensagens, setMensagens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const fimRef = useRef(null)
  const listaRef = useRef(null)

  // Carga inicial + polling enquanto o modal está aberto
  useEffect(() => {
    let ativo = true

    async function buscar(primeira) {
      try {
        const dados = await listarMensagens(mentoria.id)
        if (!ativo) return
        setMensagens(prev => (prev.length === dados.length && !primeira ? prev : dados))
      } catch {
        if (ativo && carregando) setErro('Não foi possível carregar as mensagens.')
      } finally {
        if (ativo && primeira) setCarregando(false)
      }
    }

    buscar(true)
    const timer = setInterval(() => buscar(false), INTERVALO_POLLING)
    return () => { ativo = false; clearInterval(timer) }
  }, [mentoria.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fecha com ESC e trava o scroll do body
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Rola para a última mensagem quando a contagem muda
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensagens.length])

  async function enviar(e) {
    e.preventDefault()
    const limpo = texto.trim()
    if (!limpo) return
    setEnviando(true)
    setErro(null)
    try {
      const nova = await enviarMensagem(mentoria.id, limpo)
      setMensagens(prev => [...prev, nova])
      setTexto('')
    } catch (err) {
      setErro(err.response?.data?.mensagem ?? 'Erro ao enviar mensagem. Tente novamente.')
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
        className="bg-card flex h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
          <div className="min-w-0">
            <h2 className="font-semibold leading-tight line-clamp-1">{pessoa?.nome ?? 'Conversa'}</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              {ativa ? 'Mentoria ativa' : 'Mentoria encerrada · somente leitura'}
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

        {/* Mensagens */}
        <div ref={listaRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {carregando ? (
            <p className="text-sm text-gray-400">Carregando mensagens...</p>
          ) : mensagens.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Nenhuma mensagem ainda. {ativa && 'Diga olá!'}
            </p>
          ) : (
            mensagens.map(m => (
              <div key={m.id} className={`flex ${m.ehMinha ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                    m.ehMinha
                      ? 'rounded-br-sm bg-brand text-white'
                      : 'rounded-bl-sm bg-white/5 text-gray-100'
                  }`}
                >
                  {!m.ehMinha && (
                    <p className="mb-0.5 text-xs font-medium text-brand-light">{m.remetenteNome}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words text-sm">{m.conteudo}</p>
                  <p className={`mt-1 text-right text-[10px] ${m.ehMinha ? 'text-white/60' : 'text-gray-500'}`}>
                    {formatarHora(m.dataEnvio)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={fimRef} />
        </div>

        {/* Caixa de envio */}
        <div className="border-t border-white/10 p-3">
          {erro && <p className="mb-2 text-xs text-red-400">{erro}</p>}
          {ativa ? (
            <form onSubmit={enviar} className="flex items-end gap-2">
              <textarea
                className="input resize-none"
                rows={1}
                maxLength={2000}
                placeholder="Escreva uma mensagem..."
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(e) } }}
              />
              <button
                type="submit"
                disabled={enviando || !texto.trim()}
                className="btn-primary shrink-0 px-4 py-2 text-sm"
              >
                {enviando ? '...' : 'Enviar'}
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-gray-500">
              Esta mentoria foi encerrada. Não é possível enviar novas mensagens.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
