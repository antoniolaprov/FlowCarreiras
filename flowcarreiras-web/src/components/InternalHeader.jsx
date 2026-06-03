import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* Ícones SVG inline (substituem o lucide-react do template) */
const sv = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
const IconGrid = (p) => (<svg {...sv} {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>)
const IconPlus = (p) => (<svg {...sv} {...p}><path d="M5 12h14" /><path d="M12 5v14" /></svg>)
const IconUser = (p) => (<svg {...sv} {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>)
const IconUsers = (p) => (<svg {...sv} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>)
const IconHandshake = (p) => (<svg {...sv} {...p}><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2" /><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" /><path d="M3 4h8" /></svg>)
const IconClipboard = (p) => (<svg {...sv} {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h6" /><path d="M9 16h6" /></svg>)
const IconSettings = (p) => (<svg {...sv} {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>)
const IconBriefcase = (p) => (<svg {...sv} {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>)
const IconCompass = (p) => (<svg {...sv} {...p}><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>)
const IconChevron = (p) => (<svg {...sv} {...p}><path d="m6 9 6 6 6-6" /></svg>)
const IconMenu = (p) => (<svg {...sv} {...p}><path d="M4 6h16M4 12h16M4 18h16" /></svg>)
const IconX = (p) => (<svg {...sv} {...p}><path d="M6 18 18 6M6 6l12 12" /></svg>)
const IconLogOut = (p) => (<svg {...sv} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>)

const portfolioLinks = [
  { title: 'Minhas Obras', href: '/portfolio/minhas-obras', description: 'Gerencie suas obras publicadas', Icon: IconGrid },
  { title: 'Nova Obra', href: '/portfolio/nova-obra', description: 'Publique uma nova obra', Icon: IconPlus },
  { title: 'Meu Perfil', href: '/meu-perfil', description: 'Edite seus dados e portfólio', Icon: IconUser },
]

const mentoriaLinks = [
  { title: 'Mentores', href: '/mentores', description: 'Encontre mentores por área', Icon: IconUsers },
  { title: 'Artistas para Mentoria', href: '/mentoria/artistas', description: 'Artistas buscando orientação', Icon: IconHandshake },
  { title: 'Minhas Mentorias', href: '/mentoria/minhas', description: 'Acompanhe suas mentorias', Icon: IconClipboard },
  { title: 'Configurar Mentoria', href: '/mentoria/configurar', description: 'Preço, modalidade e expertise', Icon: IconSettings },
]

function DropItem({ title, description, href, Icon, onClick }) {
  return (
    <NavLink
      to={href}
      onClick={onClick}
      className="flex flex-row items-center gap-3 rounded-md p-2 transition-colors hover:bg-white/5"
    >
      <span className="flex aspect-square size-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-brand-light">
        <Icon className="size-5" />
      </span>
      <span className="flex flex-col items-start">
        <span className="text-sm font-medium text-white">{title}</span>
        {description && <span className="text-xs text-white/50">{description}</span>}
      </span>
    </NavLink>
  )
}

const topLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`

export default function InternalHeader({ rightSlot }) {
  const { usuario, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Trava o scroll do body com o menu mobile aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header
      className={`sticky top-0 z-20 w-full border-b transition-colors ${
        scrolled ? 'border-white/10 bg-surface/80 backdrop-blur-lg' : 'border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        {/* Marca + menu desktop */}
        <div className="flex items-center gap-2">
          <Link to="/oportunidades" className="rounded-md p-2 font-bold text-brand">
            Flow Carreiras
          </Link>

          <ul className="hidden items-center md:flex">
            {/* Dropdown Portfólio */}
            <li className="group relative">
              <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:text-white">
                Portfólio
                <IconChevron className="size-3 transition-transform group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-0 top-full translate-y-1 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <ul className="w-72 space-y-1 rounded-lg border border-white/10 bg-card/95 p-2 shadow-2xl backdrop-blur-md">
                  {portfolioLinks.map((l) => (<li key={l.href}><DropItem {...l} /></li>))}
                </ul>
              </div>
            </li>

            {/* Dropdown Mentoria */}
            <li className="group relative">
              <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:text-white">
                Mentoria
                <IconChevron className="size-3 transition-transform group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-0 top-full translate-y-1 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <ul className="w-72 space-y-1 rounded-lg border border-white/10 bg-card/95 p-2 shadow-2xl backdrop-blur-md">
                  {mentoriaLinks.map((l) => (<li key={l.href}><DropItem {...l} /></li>))}
                </ul>
              </div>
            </li>

            <li><NavLink to="/oportunidades" className={topLinkClass}>Oportunidades</NavLink></li>
            <li><NavLink to="/explorar" className={topLinkClass}>Explorar</NavLink></li>
          </ul>
        </div>

        {/* Ações à direita */}
        <div className="flex items-center gap-3">
          {rightSlot}
          <div className="hidden items-center gap-3 md:flex">
            {usuario?.nome && <span className="text-sm text-gray-400">{usuario.nome}</span>}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-white/40 hover:text-white"
            >
              <IconLogOut className="size-4" /> Sair
            </button>
          </div>

          {/* Botão menu mobile */}
          <button
            onClick={() => setOpen(!open)}
            className="flex size-9 items-center justify-center rounded-md border border-white/15 text-gray-200 md:hidden"
            aria-expanded={open}
            aria-label="Abrir menu"
          >
            {open ? <IconX className="size-5" /> : <IconMenu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Menu mobile */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto border-t border-white/10 bg-surface/95 p-4 backdrop-blur-lg md:hidden">
          <div className="flex flex-col gap-1">
            <span className="px-2 pt-2 text-xs uppercase tracking-wide text-white/40">Portfólio</span>
            {portfolioLinks.map((l) => (<DropItem key={l.href} {...l} onClick={() => setOpen(false)} />))}
            <span className="px-2 pt-4 text-xs uppercase tracking-wide text-white/40">Mentoria</span>
            {mentoriaLinks.map((l) => (<DropItem key={l.href} {...l} onClick={() => setOpen(false)} />))}
            <span className="px-2 pt-4 text-xs uppercase tracking-wide text-white/40">Navegar</span>
            <DropItem title="Oportunidades" href="/oportunidades" description="Editais, vagas e chamadas" Icon={IconBriefcase} onClick={() => setOpen(false)} />
            <DropItem title="Explorar Obras" href="/explorar" description="Descubra outros artistas" Icon={IconCompass} onClick={() => setOpen(false)} />

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              {usuario?.nome && <span className="text-sm text-gray-400">{usuario.nome}</span>}
              <button
                onClick={() => { setOpen(false); logout() }}
                className="flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-sm text-gray-300 hover:border-white/40 hover:text-white"
              >
                <IconLogOut className="size-4" /> Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
