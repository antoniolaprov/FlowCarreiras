import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// Link de navegação com efeito de "deslize" no hover (adaptado do exemplo 21st.dev).
function AnimatedNavLink({ to, onClick, children }) {
  const className =
    'group relative inline-block h-5 overflow-hidden align-middle text-sm leading-5'
  const inner = (
    <span className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
      <span className="block h-5 whitespace-nowrap leading-5 text-gray-300">{children}</span>
      <span className="block h-5 whitespace-nowrap leading-5 text-white">{children}</span>
    </span>
  )
  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  )
}

export default function TopNavbar({ onEntrar, onCadastrar, onInicio, onSobre }) {
  const [isOpen, setIsOpen] = useState(false)
  const [shapeClass, setShapeClass] = useState('rounded-full')
  const shapeTimeoutRef = useRef(null)

  useEffect(() => {
    if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current)
    if (isOpen) {
      setShapeClass('rounded-2xl')
    } else {
      shapeTimeoutRef.current = setTimeout(() => setShapeClass('rounded-full'), 300)
    }
    return () => {
      if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current)
    }
  }, [isOpen])

  const logo = (
    <Link to="/login" onClick={() => { onInicio?.(); setIsOpen(false) }} className="flex items-center gap-2">
      <span className="relative h-5 w-5">
        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-brand" />
        <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand-light" />
        <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand-light" />
        <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-brand" />
      </span>
      <span className="text-sm font-bold text-white">Flow Carreiras</span>
    </Link>
  )

  const navLinks = [
    { label: 'Início', onClick: () => { onInicio?.(); setIsOpen(false) } },
    { label: 'Sobre nós', onClick: () => { onSobre?.(); setIsOpen(false) } },
  ]

  const botaoEntrar = (
    <button
      type="button"
      onClick={() => { onEntrar?.(); setIsOpen(false) }}
      className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-gray-200 transition-colors duration-200 hover:border-brand hover:text-white sm:w-auto sm:text-sm"
    >
      Entrar
    </button>
  )

  const botaoCadastrar = (
    <div className="group relative w-full sm:w-auto">
      <div className="pointer-events-none absolute inset-0 -m-2 hidden rounded-full bg-brand opacity-40 blur-lg transition-all duration-300 ease-out group-hover:-m-3 group-hover:opacity-60 group-hover:blur-xl sm:block" />
      <button
        type="button"
        onClick={() => { onCadastrar?.(); setIsOpen(false) }}
        className="relative z-10 w-full rounded-full bg-gradient-to-br from-brand-light to-brand px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:from-brand hover:to-brand-dark sm:w-auto sm:text-sm"
      >
        Cadastrar
      </button>
    </div>
  )

  return (
    <header
      className={`fixed left-1/2 top-6 z-30 flex w-[calc(100%-2rem)] -translate-x-1/2 flex-col items-center border border-white/10 bg-surface/60 px-6 py-3 backdrop-blur-md transition-[border-radius] duration-0 sm:w-auto ${shapeClass}`}
    >
      <div className="flex w-full items-center justify-between gap-x-6 sm:gap-x-8">
        {logo}

        <nav className="hidden items-center space-x-6 text-sm sm:flex">
          {navLinks.map((link) => (
            <AnimatedNavLink key={link.label} to={link.to} onClick={link.onClick}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {botaoEntrar}
          {botaoCadastrar}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-8 w-8 items-center justify-center text-gray-300 focus:outline-none sm:hidden"
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {isOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Menu mobile expansível */}
      <div
        className={`flex w-full flex-col items-center overflow-hidden transition-all duration-300 ease-in-out sm:hidden ${
          isOpen ? 'max-h-[500px] pt-4 opacity-100' : 'pointer-events-none max-h-0 pt-0 opacity-0'
        }`}
      >
        <nav className="flex w-full flex-col items-center space-y-4 text-base">
          {navLinks.map((link) =>
            link.to ? (
              <Link key={link.label} to={link.to} onClick={() => setIsOpen(false)} className="w-full text-center text-gray-300 transition-colors hover:text-white">
                {link.label}
              </Link>
            ) : (
              <button key={link.label} type="button" onClick={link.onClick} className="w-full text-center text-gray-300 transition-colors hover:text-white">
                {link.label}
              </button>
            ),
          )}
        </nav>
        <div className="mt-4 flex w-full flex-col items-center space-y-3">
          {botaoEntrar}
          {botaoCadastrar}
        </div>
      </div>
    </header>
  )
}
