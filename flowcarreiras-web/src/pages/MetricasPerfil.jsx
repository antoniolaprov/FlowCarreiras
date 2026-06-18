import InternalHeader from '../components/InternalHeader'
import { useAuth } from '../context/AuthContext'

/**
 * Aba de métricas do perfil — embute o dashboard Streamlit (servido pelo Nginx
 * em /dashboard) num iframe. O token do usuário logado é passado por query param;
 * o Streamlit o valida (mesmo segredo do backend) e mostra só os dados dele.
 */
export default function MetricasPerfil() {
  const { token } = useAuth()
  // ?embed=true já remove menu, cabeçalho e rodapé do Streamlit
  const src = `/dashboard/?embed=true&token=${encodeURIComponent(token ?? '')}`

  return (
    <div className="min-h-screen">
      <InternalHeader />
      <main className="mx-auto w-full max-w-6xl px-2 py-2">
        <iframe
          title="Minhas Métricas"
          src={src}
          className="w-full rounded-xl border border-white/10 bg-surface"
          style={{ height: 'calc(100vh - 80px)' }}
        />
      </main>
    </div>
  )
}
