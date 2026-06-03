import apiClient from './client'

function params(filtros = {}) {
  const search = new URLSearchParams()
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      search.append(chave, valor)
    }
  })
  return search.toString() ? { params: Object.fromEntries(search.entries()) } : undefined
}

export const obterConfiguracaoMentoria = () =>
  apiClient.get('/mentorias/configuracao').then(r => r.data)

export const salvarConfiguracaoMentoria = (dados) =>
  apiClient.put('/mentorias/configuracao', dados).then(r => r.data)

export const ativarMentoria = () =>
  apiClient.patch('/mentorias/ativar').then(r => r.data)

export const pausarMentoria = () =>
  apiClient.patch('/mentorias/pausar').then(r => r.data)

export const listarMentores = (filtros) =>
  apiClient.get('/mentorias/mentores', params(filtros)).then(r => r.data)

export const listarArtistasDisponiveis = (filtros) =>
  apiClient.get('/mentorias/artistas-disponiveis', params(filtros)).then(r => r.data)

export const selecionarArtistaParaMentoria = (artistaId) =>
  apiClient.post(`/mentorias/artistas/${artistaId}/selecionar`).then(r => r.data)

export const listarMinhasMentorias = () =>
  apiClient.get('/mentorias/minhas').then(r => r.data)

export const encerrarMentoria = (mentoriaId) =>
  apiClient.patch(`/mentorias/${mentoriaId}/encerrar`).then(r => r.data)

export const listarMensagens = (mentoriaId) =>
  apiClient.get(`/mentorias/${mentoriaId}/mensagens`).then(r => r.data)

export const enviarMensagem = (mentoriaId, conteudo) =>
  apiClient.post(`/mentorias/${mentoriaId}/mensagens`, { conteudo }).then(r => r.data)
