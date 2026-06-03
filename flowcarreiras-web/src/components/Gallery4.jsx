import { useEffect, useRef, useState } from 'react'

/* Ícones SVG inline (substituem o lucide-react do template) */
const ArrowLeft = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
)
const ArrowRight = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
)

/* Ícones grandes de cada card */
const IconPortfolio = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.5-3.5a2 2 0 0 0-2.83 0L6 21" /></svg>
)
const IconOportunidades = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
)
const IconMentoria = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
)
const IconExposicao = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.94 14.06A3 3 0 0 1 12 9a3 3 0 0 1 2.12 5.06" /><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /></svg>
)
const IconComunidade = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
)

const DEFAULT_ITEMS = [
  {
    id: 'portfolio',
    title: 'Portfólio Público',
    description: 'Monte um portfólio profissional das suas obras e compartilhe com uma URL própria — sem depender de redes sociais.',
    gradient: 'from-brand to-brand-dark',
    image: '/sobre/portfolio.avif',
    Icon: IconPortfolio,
  },
  {
    id: 'oportunidades',
    title: 'Portal de Oportunidades',
    description: 'Editais, chamadas e vagas para artistas reunidos e organizados num só lugar, sempre atualizados.',
    gradient: 'from-violet-500 to-brand',
    image: '/sobre/oportunidades.jpg',
    Icon: IconOportunidades,
  },
  {
    id: 'mentoria',
    title: 'Mentoria',
    description: 'Conecte-se com mentores por área de expertise e evolua na carreira com quem já trilhou o caminho.',
    gradient: 'from-indigo-500 to-brand-dark',
    image: '/sobre/mentoria.jpg',
    Icon: IconMentoria,
  },
  {
    id: 'exposicao',
    title: 'Exposição Justa',
    description: 'Nosso sistema distribui visibilidade de forma equilibrada, dando palco também a quem está começando.',
    gradient: 'from-fuchsia-500 to-brand',
    image: '/sobre/exposicao.webp',
    Icon: IconExposicao,
  },
  {
    id: 'comunidade',
    title: 'Comunidade Recife',
    description: 'Explore obras de outros artistas locais e fortaleça a cena criativa emergente da cidade.',
    gradient: 'from-brand-light to-brand-dark',
    image: '/sobre/comunidade.webp',
    Icon: IconComunidade,
  },
]

export default function Gallery4({
  title = 'Sobre o Flow Carreiras',
  description = 'O Flow Carreiras é uma plataforma feita para artistas emergentes de Recife transformarem talento em carreira. Reunimos portfólio, oportunidades e mentoria num só lugar — com um sistema de exposição justa que dá visibilidade a quem está começando.',
  items = DEFAULT_ITEMS,
  onItemClick,
}) {
  const trackRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)
  const [current, setCurrent] = useState(0)

  const step = () => {
    const el = trackRef.current
    if (!el) return 0
    const card = el.querySelector('[data-card]')
    return card ? card.offsetWidth + 20 : el.clientWidth
  }

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const update = () => {
      setCanPrev(el.scrollLeft > 4)
      setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
      const s = step()
      setCurrent(s ? Math.round(el.scrollLeft / s) : 0)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const scrollPrev = () => trackRef.current?.scrollBy({ left: -step(), behavior: 'smooth' })
  const scrollNext = () => trackRef.current?.scrollBy({ left: step(), behavior: 'smooth' })
  const scrollTo = (i) => trackRef.current?.scrollTo({ left: i * step(), behavior: 'smooth' })

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-end justify-between md:mb-12">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">{title}</h2>
            <p className="max-w-lg text-white/60">{description}</p>
          </div>
          <div className="hidden shrink-0 gap-2 md:flex">
            <button
              type="button"
              onClick={scrollPrev}
              disabled={!canPrev}
              aria-label="Anterior"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={!canNext}
              aria-label="Próximo"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
        >
          {items.map((item) => {
            const Icon = item.Icon
            return (
              <button
                key={item.id}
                data-card
                type="button"
                onClick={() => onItemClick?.(item)}
                className="group w-[280px] shrink-0 snap-start text-left lg:w-[340px]"
              >
                <div className="relative h-[26rem] overflow-hidden rounded-xl">
                  {/* Fundo em gradiente da marca (fallback / base) */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
                  {item.image ? (
                    /* Foto do card */
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="absolute h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <>
                      {/* Padrão de pontos sutil */}
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '18px 18px' }}
                      />
                      {/* Ícone grande decorativo */}
                      {Icon && <Icon className="absolute right-6 top-6 h-16 w-16 text-white/25" />}
                    </>
                  )}
                  {/* Escurecimento para legibilidade do texto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  {/* Conteúdo */}
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 text-white">
                    <div className="mb-2 text-xl font-semibold">{item.title}</div>
                    <p className="mb-6 line-clamp-3 text-sm text-white/85">{item.description}</p>
                    <div className="flex items-center text-sm font-medium">
                      Saiba mais
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Indicadores */}
        <div className="mt-8 flex justify-center gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`Ir para o slide ${index + 1}`}
              className={`h-2 w-2 rounded-full transition-colors ${current === index ? 'bg-brand' : 'bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
