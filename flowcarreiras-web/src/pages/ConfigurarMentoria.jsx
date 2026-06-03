import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import InternalHeader from '../components/InternalHeader'
import SeletorTags from '../components/SeletorTags'
import { obterConfiguracaoMentoria, salvarConfiguracaoMentoria } from '../api/mentorias'

const MODALIDADES = [
  { value: 'REMOTA', label: 'Remota' },
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'HIBRIDA', label: 'Hibrida' },
]

export default function ConfigurarMentoria() {
  const navigate = useNavigate()
  const location = useLocation()
  const primeiraConfiguracao = Boolean(location.state?.primeiraConfiguracao)

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [configuracaoAtual, setConfiguracaoAtual] = useState(null)
  const [form, setForm] = useState({
    mentoriaGratuita: true,
    valorHoraMentoria: '',
    descricaoMentoria: '',
    modalidadeMentoria: 'REMOTA',
    cidadeMentoria: '',
    tagsExpertise: [],
  })

  useEffect(() => {
    obterConfiguracaoMentoria()
      .then(config => {
        setConfiguracaoAtual(config)
        setForm({
          mentoriaGratuita: config.mentoriaGratuita ?? true,
          valorHoraMentoria: config.valorHoraMentoria ?? '',
          descricaoMentoria: config.descricaoMentoria ?? '',
          modalidadeMentoria: config.modalidadeMentoria ?? 'REMOTA',
          cidadeMentoria: config.cidadeMentoria ?? '',
          tagsExpertise: config.tagsExpertise ?? [],
        })
      })
      .finally(() => setCarregando(false))
  }, [])

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    setErro(null)
  }

  function validarLocal() {
    if (!form.descricaoMentoria.trim()) return 'Descreva como sera sua mentoria.'
    if (!form.mentoriaGratuita && (!form.valorHoraMentoria || Number(form.valorHoraMentoria) <= 0)) {
      return 'Informe um valor por hora para mentoria paga.'
    }
    if ((form.modalidadeMentoria === 'PRESENCIAL' || form.modalidadeMentoria === 'HIBRIDA') && !form.cidadeMentoria.trim()) {
      return 'Informe a cidade/base para mentoria presencial ou hibrida.'
    }
    if (form.tagsExpertise.length === 0) return 'Adicione ao menos uma tag de expertise.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const erroValidacao = validarLocal()
    if (erroValidacao) {
      setErro(erroValidacao)
      return
    }

    setSalvando(true)
    setErro(null)
    try {
      await salvarConfiguracaoMentoria({
        mentoriaGratuita: form.mentoriaGratuita,
        valorHoraMentoria: form.mentoriaGratuita ? null : Number(form.valorHoraMentoria),
        descricaoMentoria: form.descricaoMentoria,
        modalidadeMentoria: form.modalidadeMentoria,
        cidadeMentoria: form.cidadeMentoria,
        disponivelParaMentorar: configuracaoAtual?.disponivelParaMentorar ?? true,
        tagsExpertiseIds: form.tagsExpertise.map(t => t.id),
      })
      navigate('/meu-perfil', { replace: primeiraConfiguracao })
    } catch (err) {
      setErro(err.response?.data?.mensagem ?? 'Erro ao salvar configuracao de mentoria.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Carregando configuracao...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <InternalHeader />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-5 md:p-6 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-white">Dados da sua mentoria</h1>
            <p className="text-sm text-gray-400 mt-1">
              Essas informacoes aparecem para artistas e ajudam no match por tags.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Descricao da mentoria</label>
            <textarea
              className="input resize-none"
              rows={5}
              value={form.descricaoMentoria}
              onChange={e => set('descricaoMentoria', e.target.value)}
              placeholder="Ex: Ajudo artistas emergentes a estruturar portfolio, precificacao e identidade visual."
              maxLength={1000}
            />
            <p className="text-xs text-gray-600 mt-1 text-right">{form.descricaoMentoria.length}/1000</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Preco</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set('mentoriaGratuita', true)}
                className={`py-2 rounded-lg border text-sm transition-colors ${form.mentoriaGratuita ? 'border-brand bg-brand/20 text-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}
              >
                Gratuita
              </button>
              <button
                type="button"
                onClick={() => set('mentoriaGratuita', false)}
                className={`py-2 rounded-lg border text-sm transition-colors ${!form.mentoriaGratuita ? 'border-brand bg-brand/20 text-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}
              >
                Paga por hora
              </button>
            </div>
            {!form.mentoriaGratuita && (
              <div className="mt-3">
                <label className="text-xs text-gray-400 mb-1 block">Valor por hora</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="input"
                  value={form.valorHoraMentoria}
                  onChange={e => set('valorHoraMentoria', e.target.value)}
                  placeholder="100.00"
                />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Modalidade</label>
              <select
                className="input"
                value={form.modalidadeMentoria}
                onChange={e => set('modalidadeMentoria', e.target.value)}
              >
                {MODALIDADES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Cidade/base</label>
              <input
                className="input"
                value={form.cidadeMentoria}
                onChange={e => set('cidadeMentoria', e.target.value)}
                placeholder={form.modalidadeMentoria === 'REMOTA' ? 'Opcional' : 'Ex: Recife, PE'}
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Tags de expertise</label>
            <p className="text-xs text-gray-500 mb-3">Escolha as areas em que voce pode orientar artistas.</p>
            <SeletorTags tagsSelecionadas={form.tagsExpertise} onChange={tags => set('tagsExpertise', tags)} maxTags={10} />
          </div>

          {erro && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm">
              {erro}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button type="button" onClick={() => navigate('/meu-perfil')} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="btn-primary flex-1">
              {salvando ? 'Salvando...' : 'Salvar mentoria'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
