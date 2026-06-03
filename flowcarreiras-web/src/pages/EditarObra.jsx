import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import InternalHeader from '../components/InternalHeader'
import { buscarObra, editarObra } from '../api/obras'
import FormularioUploadObra from '../components/FormularioUploadObra'

export default function EditarObra() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [obra, setObra] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    buscarObra(id).then(setObra).finally(() => setCarregando(false))
  }, [id])

  async function handleSubmit(dados, file, onProgress) {
    await editarObra(id, dados, file, onProgress)
    navigate('/portfolio/minhas-obras')
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Carregando obra...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <InternalHeader />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {obra ? (
          <FormularioUploadObra valorInicial={obra} onSubmit={handleSubmit} />
        ) : (
          <p className="text-red-400">Obra não encontrada.</p>
        )}
      </main>
    </div>
  )
}
