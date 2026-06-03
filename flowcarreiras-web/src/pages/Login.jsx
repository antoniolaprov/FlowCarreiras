import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin, registrar as apiRegistrar } from '../api/auth'
import ParticleTextEffect from '../components/ParticleTextEffect'
import TopNavbar from '../components/TopNavbar'
import Gallery4 from '../components/Gallery4'
import { EyeToggleIcon, SuccessIcon } from '../components/StateIcons'

/* Ícones SVG inline (substituem o lucide-react do template) */
const IconMail = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>
)
const IconLock = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
)
const IconUser = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
)
const IconEye = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
)
const IconEyeOff = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
)
const IconArrowRight = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
)

export default function Login() {
  const [modo, setModo] = useState('login')
  const [form, setForm] = useState({ nome: '', email: '', senha: '', desejaSerMentor: false })
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [mostrarAuth, setMostrarAuth] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [sucesso, setSucesso] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function abrirAuth(novoModo) {
    setModo(novoModo)
    setErros({})
    setErroGeral(null)
    setMostrarAuth(true)
  }

  function fecharAuth() {
    setMostrarAuth(false)
  }

  function rolarPara(id) {
    setMostrarAuth(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fecha o painel de autenticação com a tecla Esc.
  useEffect(() => {
    if (!mostrarAuth) return
    const onKey = (e) => { if (e.key === 'Escape') setMostrarAuth(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mostrarAuth])

  // Efeito de inclinação 3D do card seguindo o cursor.
  function handleTilt(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - r.left - r.width / 2
    const y = e.clientY - r.top - r.height / 2
    setTilt({ rx: -(y / (r.height / 2)) * 8, ry: (x / (r.width / 2)) * 8 })
  }
  function resetTilt() {
    setTilt({ rx: 0, ry: 0 })
  }

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }))
  }

  function validar() {
    const novosErros = {}
    if (modo === 'registro' && !form.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório'
    }
    if (!form.email.trim()) {
      novosErros.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      novosErros.email = 'Informe um e-mail válido (ex: usuario@dominio.com)'
    }
    if (!form.senha) {
      novosErros.senha = 'Senha é obrigatória'
    } else if (modo === 'registro' && form.senha.length < 8) {
      novosErros.senha = 'A senha deve ter no mínimo 8 caracteres'
    }
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const podeContinuar = modo === 'registro'
    ? form.nome.trim() && form.email.trim() && form.senha
    : form.email.trim() && form.senha

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validar()) return
    setErroGeral(null)
    setCarregando(true)
    try {
      let data
      if (modo === 'login') {
        data = await apiLogin(form.email, form.senha)
      } else {
        data = await apiRegistrar(form.nome, form.email, form.senha, form.desejaSerMentor)
      }
      login(data)
      setSucesso(true)
      // Mostra o ✓ por um instante antes de navegar.
      setTimeout(() => {
        if (data.desejaConfigurarMentoria) {
          navigate('/mentoria/configurar', { state: { primeiraConfiguracao: true } })
        } else if (!data.onboardingConcluido && (data.percentualCompletude ?? 0) < 40) {
          navigate('/onboarding')
        } else {
          navigate('/oportunidades')
        }
      }, 750)
    } catch (err) {
      const msg = err.response?.data?.mensagem ?? 'Erro ao autenticar. Verifique seus dados.'
      if (msg.toLowerCase().includes('e-mail') || msg.toLowerCase().includes('email')) {
        setErros(e => ({ ...e, email: 'Este e-mail já está em uso. Faça login ou recupere sua senha.' }))
      } else {
        setErroGeral(msg)
      }
    } finally {
      setCarregando(false)
    }
  }

  const inputBase = 'h-11 w-full rounded-lg bg-white/5 pl-10 text-white placeholder:text-white/30 outline-none transition-all duration-300 focus:bg-white/10 border'

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface">
      {/* Fundo animado FIXO cobrindo a tela inteira (atrás de tudo) */}
      <div className="fixed inset-0 z-0">
        <ParticleTextEffect
          words={['FLOW', 'CARREIRAS', 'ARTE', 'TALENTO', 'RECIFE']}
          className="absolute inset-0"
        />
        {/* Vinheta sutil para profundidade */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface/30 via-transparent to-surface/60" />
      </div>

      {/* Navbar flutuante no topo */}
      <TopNavbar
        onEntrar={() => abrirAuth('login')}
        onCadastrar={() => abrirAuth('registro')}
        onInicio={() => rolarPara('topo')}
        onSobre={() => rolarPara('sobre')}
      />

      {/* Conteúdo rolável por cima da animação */}
      <div className="relative z-10">
        {/* Hero — deixa a animação aparecer atrás */}
        <section id="topo" className="relative h-screen">
          {/* Chamada discreta no rodapé, sem competir com a animação */}
          {!mostrarAuth && (
            <p className="absolute inset-x-0 bottom-8 text-center text-sm text-gray-400">
              Plataforma para artistas emergentes de Recife · clique em{' '}
              <button onClick={() => abrirAuth('login')} className="font-medium text-brand-light hover:underline">
                Entrar
              </button>{' '}
              para começar
            </p>
          )}
        </section>

        {/* Sobre nós — painel flutuante translúcido por cima da animação */}
        <section id="sobre" className="border-t border-white/10 bg-surface/70 shadow-2xl backdrop-blur-md">
          <Gallery4 onItemClick={() => abrirAuth('registro')} />
        </section>
      </div>

      {/* Painel de autenticação sob demanda */}
      {mostrarAuth && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-12">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={fecharAuth} />

          <div className="relative z-10 w-full max-w-sm" style={{ perspective: 1500 }}>
            <div
              className="group relative transition-transform duration-150 ease-out"
              style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`, willChange: 'transform' }}
              onMouseMove={handleTilt}
              onMouseLeave={resetTilt}
            >
              {/* Brilho externo pulsante */}
              <div className="pointer-events-none absolute -inset-px rounded-2xl bg-brand/40 blur-lg [animation:glow-breathe_4s_ease-in-out_infinite]" />

              {/* Feixes de luz viajando nas bordas + brilhos de canto */}
              <div className="beam-track pointer-events-none absolute -inset-px overflow-hidden rounded-2xl">
                <span className="beam beam-top bg-gradient-to-r from-transparent via-white to-transparent opacity-70 blur-[1px]" />
                <span className="beam beam-right bg-gradient-to-b from-transparent via-white to-transparent opacity-70 blur-[1px]" />
                <span className="beam beam-bottom bg-gradient-to-r from-transparent via-white to-transparent opacity-70 blur-[1px]" />
                <span className="beam beam-left bg-gradient-to-b from-transparent via-white to-transparent opacity-70 blur-[1px]" />
                <span className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-white/50 blur-[1px] [animation:soft-pulse_2s_ease-in-out_infinite]" />
                <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-white/60 blur-[2px] [animation:soft-pulse_2.4s_ease-in-out_infinite]" style={{ animationDelay: '.5s' }} />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-white/60 blur-[2px] [animation:soft-pulse_2.2s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
                <span className="absolute bottom-0 left-0 h-1.5 w-1.5 rounded-full bg-white/50 blur-[1px] [animation:soft-pulse_2.3s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }} />
              </div>

              {/* Card de vidro */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
                {/* Padrão interno sutil */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.03]"
                  style={{ backgroundImage: 'linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}
                />

                {/* Botão fechar */}
                <button
                  type="button"
                  onClick={fecharAuth}
                  aria-label="Fechar"
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Cabeçalho */}
                <div className="relative mb-5 space-y-1 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10">
                    <span className="bg-gradient-to-b from-brand-light to-brand bg-clip-text text-lg font-bold text-transparent">F</span>
                  </div>
                  <h1 className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-xl font-bold text-transparent">
                    {modo === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                  </h1>
                  <p className="text-xs text-white/60">
                    {modo === 'login' ? 'Entre para continuar no Flow Carreiras' : 'Comece a divulgar sua arte hoje'}
                  </p>
                </div>

                {/* Alternância login / cadastro */}
                <div className="relative mb-6 flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                  {['login', 'registro'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setModo(m); setErros({}); setErroGeral(null) }}
                      className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                        modo === m ? 'bg-brand text-white' : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {m === 'login' ? 'Entrar' : 'Cadastrar'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="relative space-y-4" noValidate>
                  {modo === 'registro' && (
                    <div>
                      <div className="relative flex items-center">
                        <IconUser className={`pointer-events-none absolute left-3 h-4 w-4 transition-colors ${focusedInput === 'nome' ? 'text-brand-light' : 'text-white/40'}`} />
                        <input
                          value={form.nome}
                          onChange={e => set('nome', e.target.value)}
                          onFocus={() => setFocusedInput('nome')}
                          onBlur={() => setFocusedInput(null)}
                          placeholder="Seu nome artístico"
                          className={`${inputBase} pr-3 ${erros.nome ? 'border-red-500' : 'border-transparent focus:border-brand/50'}`}
                        />
                      </div>
                      {erros.nome && <p className="mt-1 text-xs text-red-400">{erros.nome}</p>}
                    </div>
                  )}

                  <div>
                    <div className="relative flex items-center">
                      <IconMail className={`pointer-events-none absolute left-3 h-4 w-4 transition-colors ${focusedInput === 'email' ? 'text-brand-light' : 'text-white/40'}`} />
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                        placeholder="seu@email.com"
                        className={`${inputBase} pr-3 ${erros.email ? 'border-red-500' : 'border-transparent focus:border-brand/50'}`}
                      />
                    </div>
                    {erros.email && <p className="mt-1 text-xs text-red-400">{erros.email}</p>}
                  </div>

                  <div>
                    <div className="relative flex items-center">
                      <IconLock className={`pointer-events-none absolute left-3 h-4 w-4 transition-colors ${focusedInput === 'senha' ? 'text-brand-light' : 'text-white/40'}`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.senha}
                        onChange={e => set('senha', e.target.value)}
                        onFocus={() => setFocusedInput('senha')}
                        onBlur={() => setFocusedInput(null)}
                        placeholder={modo === 'registro' ? 'Mínimo 8 caracteres' : '••••••••'}
                        className={`${inputBase} pr-10 ${erros.senha ? 'border-red-500' : 'border-transparent focus:border-brand/50'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="absolute right-3 text-white/40 transition-colors hover:text-white"
                      >
                        <EyeToggleIcon hidden={!showPassword} size={18} />
                      </button>
                    </div>
                    {erros.senha && <p className="mt-1 text-xs text-red-400">{erros.senha}</p>}
                  </div>

                  {modo === 'registro' && (
                    <label className="flex cursor-pointer select-none items-start gap-3 rounded-lg border border-white/10 p-3 transition-colors hover:border-white/20">
                      <input
                        type="checkbox"
                        checked={form.desejaSerMentor}
                        onChange={e => set('desejaSerMentor', e.target.checked)}
                        className="mt-1 accent-brand"
                      />
                      <span>
                        <span className="block text-sm font-medium text-white">Quero atuar como mentor</span>
                        <span className="mt-0.5 block text-xs text-white/50">
                          Depois do cadastro voce configura preco, modalidade e areas de expertise.
                        </span>
                      </span>
                    </label>
                  )}

                  {erroGeral && (
                    <div className="rounded-lg border border-red-700 bg-red-900/30 px-3 py-2 text-sm text-red-400">
                      {erroGeral}
                    </div>
                  )}

                  {/* Botão principal com shimmer */}
                  <button
                    type="submit"
                    disabled={carregando || sucesso || !podeContinuar}
                    className="group/btn relative mt-1 h-11 w-full overflow-hidden rounded-lg bg-gradient-to-br from-brand-light to-brand font-medium text-white transition-all duration-300 hover:from-brand hover:to-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent [animation:shimmer-x_2.4s_ease-in-out_infinite]" />
                    <span className="relative z-10 flex items-center justify-center gap-1.5 text-sm">
                      {carregando || sucesso ? (
                        <SuccessIcon done={sucesso} size={22} className="text-white" />
                      ) : (
                        <>
                          {modo === 'login' ? 'Entrar' : 'Criar conta'}
                          <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                        </>
                      )}
                    </span>
                  </button>
                </form>

                <p className="relative mt-4 text-center text-xs text-white/40">
                  Teste: marina@test.com / senha123
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
