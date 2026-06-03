import api from './client'

// Lista os comentários de uma obra (endpoint público)
export async function listarComentarios(obraId) {
  const { data } = await api.get(`/obras/${obraId}/comentarios`)
  return data
}

// Cria um comentário em uma obra (requer autenticação)
export async function criarComentario(obraId, texto) {
  const { data } = await api.post(`/obras/${obraId}/comentarios`, { texto })
  return data
}
