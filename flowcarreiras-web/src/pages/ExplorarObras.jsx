import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import InternalHeader from '../components/InternalHeader'
import SeletorTags from '../components/SeletorTags'
import CardObra from '../components/CardObra'
import { explorarObras } from '../api/obras'

const FORMATOS = [
  { id: 'IMAGEM', label: 'Imagem' },
  { id: 'AUDIO', label: 'Audio' },
  { id: 'VIDEO', label: 'Video' },
]

export default function ExplorarObras() {
  const [obras, setObras] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [area, setArea] = useState('')
  const [recencia, setRecencia] = useState('')
  const [tagsSelecionadas, setTagsSelecionadas] = useState([])
  const [formatosSelecionados, setFormatosSelecionados] = useState([])

  async function carregar() {
    setCarregando(true)
    try {
      const dados = await explorarObras({
        area,
        recencia,
        formatos: formatosSelecionados,
        tags: tagsSelecionadas.map(t => t.nome ?? t),
      })
      setObras(dados)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handle = setTimeout(() => carregar(), 250)
    return () => clearTimeout(handle)
  }, [area, recencia, tagsSelecionadas, formatosSelecionados]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleFormato(id) {
    setFormatosSelecionados(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  function limparFiltros() {
    setArea('')
    setRecencia('')
    setTagsSelecionadas([])
    setFormatosSelecionados([])
  }

  return (
    <div className="min-h-screen">
      <InternalHeader />

      <main className="max-w-6xl mx-auto px-4 py-6">
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
                <select className="input" value={recencia} onChange={e => setRecencia(e.target.value)}>
                  <option value="">Sem filtro de recencia</option>
                  <option value="semana">Esta semana</option>
                  <option value="mes">Este mes</option>
                </select>
              </div>
            </div>

            <div className="bg-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Formato</h3>
              <div className="flex flex-wrap gap-2">
                {FORMATOS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => toggleFormato(f.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      formatosSelecionados.includes(f.id)
                        ? 'border-brand text-brand'
                        : 'border-gray-700 text-gray-500 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Tags</h3>
              <SeletorTags tagsSelecionadas={tagsSelecionadas} onChange={setTagsSelecionadas} maxTags={5} />
            </div>

            <button onClick={limparFiltros} className="btn-secondary w-full">Limpar filtros</button>
          </aside>

          <section className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Explorar obras</h2>
                <p className="text-sm text-gray-400">{obras.length} obras encontradas</p>
              </div>
              <button onClick={carregar} className="btn-secondary text-sm px-3 py-1.5">Atualizar</button>
            </div>

            {carregando ? (
              <div className="text-gray-400 text-sm">Carregando obras...</div>
            ) : obras.length === 0 ? (
              <div className="bg-card rounded-xl p-6 text-center text-gray-400">
                <p>Nenhuma obra encontrada. Tente outras tags ou remova filtros aplicados.</p>
                <button onClick={limparFiltros} className="btn-secondary mt-4">Limpar filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {obras.map(obra => (
                  <CardObra key={obra.id} obra={obra} modoEdicao={false} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
