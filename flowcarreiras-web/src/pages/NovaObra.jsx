import { useNavigate } from 'react-router-dom'
import InternalHeader from '../components/InternalHeader'
import { useAuth } from '../context/AuthContext'
import { criarObra } from '../api/obras'
import FormularioUploadObra from '../components/FormularioUploadObra'

export default function NovaObra() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  async function handleSubmit(dados, file, onProgress) {
    await criarObra(dados, file, onProgress)
    navigate('/portfolio/minhas-obras')
  }

  return (
    <div className="min-h-screen">
      <InternalHeader />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <FormularioUploadObra onSubmit={handleSubmit} />
      </main>
    </div>
  )
}
