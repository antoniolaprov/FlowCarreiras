import { useEffect, useRef } from 'react'

/**
 * Fundo animado de flow-field (campo de fluxo) com partículas que reagem ao mouse.
 * A cor cicla suavemente dentro da paleta da marca (índigo → violeta → roxo → rosa).
 * Adaptado de um template 21st.dev (TSX → JSX, sem dependências externas).
 */
export default function NeuralBackground({
  className = '',
  trailOpacity = 0.15,
  particleCount = 600,
  speed = 1,
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = container.clientWidth
    let height = container.clientHeight
    let particles = []
    let animationFrameId
    let mouse = { x: -1000, y: -1000 }
    let hueTime = 0

    class Particle {
      constructor() {
        this.reset()
      }
      reset() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = 0
        this.vy = 0
        this.age = 0
        this.life = Math.random() * 200 + 100
      }
      update() {
        // Campo de fluxo: ângulo derivado da posição
        const angle = (Math.cos(this.x * 0.005) + Math.sin(this.y * 0.005)) * Math.PI
        this.vx += Math.cos(angle) * 0.2 * speed
        this.vy += Math.sin(angle) * 0.2 * speed

        // Repulsão do mouse
        const dx = mouse.x - this.x
        const dy = mouse.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const interactionRadius = 150
        if (distance < interactionRadius) {
          const force = (interactionRadius - distance) / interactionRadius
          this.vx -= dx * force * 0.05
          this.vy -= dy * force * 0.05
        }

        // Velocidade + atrito
        this.x += this.vx
        this.y += this.vy
        this.vx *= 0.95
        this.vy *= 0.95

        // Envelhecimento e reciclagem
        this.age++
        if (this.age > this.life) this.reset()

        // Wrap nas bordas
        if (this.x < 0) this.x = width
        if (this.x > width) this.x = 0
        if (this.y < 0) this.y = height
        if (this.y > height) this.y = 0
      }
      draw(context, color) {
        context.fillStyle = color
        const alpha = 1 - Math.abs(this.age / this.life - 0.5) * 2
        context.globalAlpha = alpha
        context.fillRect(this.x, this.y, 1.5, 1.5)
      }
    }

    const init = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      // Reseta a transformação antes de escalar (evita acúmulo no resize)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      particles = []
      for (let i = 0; i < particleCount; i++) particles.push(new Particle())
    }

    const animate = () => {
      // Rastro: preenche com o tom da superfície do tema (em vez de limpar)
      ctx.globalAlpha = 1
      ctx.fillStyle = `rgba(26, 26, 46, ${trailOpacity})`
      ctx.fillRect(0, 0, width, height)

      // Cor cíclica dentro da paleta da marca (hue ~240..330)
      hueTime += 0.0025 * speed
      const hue = 285 + Math.sin(hueTime) * 45
      const color = `hsl(${hue}, 80%, 66%)`

      particles.forEach((p) => {
        p.update()
        p.draw(ctx, color)
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      width = container.clientWidth
      height = container.clientHeight
      init()
    }
    // Rastreia o mouse na janela (o fundo fica atrás do conteúdo, com pointer-events: none)
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const handleMouseLeave = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    init()
    animate()
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', handleMouseLeave)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [trailOpacity, particleCount, speed])

  return (
    <div ref={containerRef} className={`pointer-events-none relative h-full w-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}
