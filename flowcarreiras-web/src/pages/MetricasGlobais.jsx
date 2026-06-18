import InternalHeader from '../components/InternalHeader'

/**
 * Seção de Métricas Globais — embute o dashboard analítico Streamlit (visão
 * agregada de todos os perfis). Diferente de /metricas, NÃO envia token, então
 * o Streamlit renderiza o modo analítico (não o por-usuário).
 */
export default function MetricasGlobais() {
  const src = '/dashboard/?embed=true'

  return (
    <div className="min-h-screen">
      <InternalHeader />
      <main className="mx-auto w-full max-w-7xl px-2 py-2">
        <iframe
          title="Métricas Globais"
          src={src}
          className="w-full rounded-xl border border-white/10 bg-surface"
          style={{ height: 'calc(100vh - 80px)' }}
        />
      </main>
    </div>
  )
}
