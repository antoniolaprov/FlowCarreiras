import { useEffect, useRef } from 'react'

// Paleta alinhada à marca (roxo/violeta/índigo) para coesão visual com o tema.
const BRAND_PALETTE = [
  { r: 108, g: 99, b: 255 },  // brand
  { r: 156, g: 151, b: 255 }, // brand-light
  { r: 139, g: 92, b: 246 },  // violeta
  { r: 99, g: 102, b: 241 },  // índigo
  { r: 192, g: 132, b: 252 }, // lavanda
  { r: 250, g: 204, b: 21 },  // amarelo
  { r: 239, g: 68, b: 68 },   // vermelho
  { r: 34, g: 197, b: 94 },   // verde
]

function generateRandomPos(x, y, mag) {
  const randomX = Math.random() * (x * 2)
  const randomY = Math.random() * (y * 2)

  const direction = { x: randomX - x, y: randomY - y }
  const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y)
  if (magnitude > 0) {
    direction.x = (direction.x / magnitude) * mag
    direction.y = (direction.y / magnitude) * mag
  }
  return { x: x + direction.x, y: y + direction.y }
}

class Particle {
  constructor() {
    this.pos = { x: 0, y: 0 }
    this.vel = { x: 0, y: 0 }
    this.acc = { x: 0, y: 0 }
    this.target = { x: 0, y: 0 }

    this.closeEnoughTarget = 100
    this.maxSpeed = 1.0
    this.maxForce = 0.1
    this.particleSize = 10
    this.isKilled = false

    this.startColor = { r: 0, g: 0, b: 0 }
    this.targetColor = { r: 0, g: 0, b: 0 }
    this.colorWeight = 0
    this.colorBlendRate = 0.01
  }

  move() {
    let proximityMult = 1
    const distance = Math.sqrt(
      Math.pow(this.pos.x - this.target.x, 2) + Math.pow(this.pos.y - this.target.y, 2),
    )
    if (distance < this.closeEnoughTarget) {
      proximityMult = distance / this.closeEnoughTarget
    }

    const towardsTarget = {
      x: this.target.x - this.pos.x,
      y: this.target.y - this.pos.y,
    }
    const magnitude = Math.sqrt(towardsTarget.x * towardsTarget.x + towardsTarget.y * towardsTarget.y)
    if (magnitude > 0) {
      towardsTarget.x = (towardsTarget.x / magnitude) * this.maxSpeed * proximityMult
      towardsTarget.y = (towardsTarget.y / magnitude) * this.maxSpeed * proximityMult
    }

    const steer = {
      x: towardsTarget.x - this.vel.x,
      y: towardsTarget.y - this.vel.y,
    }
    const steerMagnitude = Math.sqrt(steer.x * steer.x + steer.y * steer.y)
    if (steerMagnitude > 0) {
      steer.x = (steer.x / steerMagnitude) * this.maxForce
      steer.y = (steer.y / steerMagnitude) * this.maxForce
    }

    this.acc.x += steer.x
    this.acc.y += steer.y

    this.vel.x += this.acc.x
    this.vel.y += this.acc.y
    this.pos.x += this.vel.x
    this.pos.y += this.vel.y
    this.acc.x = 0
    this.acc.y = 0
  }

  draw(ctx, drawAsPoints) {
    if (this.colorWeight < 1.0) {
      this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0)
    }

    const currentColor = {
      r: Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight),
      g: Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight),
      b: Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight),
    }

    if (drawAsPoints) {
      ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2)
    } else {
      ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`
      ctx.beginPath()
      ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  kill(width, height) {
    if (!this.isKilled) {
      const randomPos = generateRandomPos(width / 2, height / 2, (width + height) / 2)
      this.target.x = randomPos.x
      this.target.y = randomPos.y

      this.startColor = {
        r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
        g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
        b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
      }
      this.targetColor = { r: 0, g: 0, b: 0 }
      this.colorWeight = 0
      this.isKilled = true
    }
  }
}

const DEFAULT_WORDS = ['FLOW', 'CARREIRAS', 'ARTE', 'TALENTO', 'RECIFE']

export default function ParticleTextEffect({ words = DEFAULT_WORDS, className = '' }) {
  const canvasRef = useRef(null)
  const animationRef = useRef()
  const particlesRef = useRef([])
  const frameCountRef = useRef(0)
  const wordIndexRef = useRef(0)
  const colorIndexRef = useRef(0)

  const pixelSteps = 6
  const drawAsPoints = true

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = canvas.parentElement

    // Renderiza a palavra como texto numa canvas off-screen e converte os
    // pixels em alvos para as partículas.
    const nextWord = (word) => {
      const offscreen = document.createElement('canvas')
      offscreen.width = canvas.width
      offscreen.height = canvas.height
      const offCtx = offscreen.getContext('2d')

      // Escala a fonte para caber na largura do canvas (~80%).
      let fontSize = Math.min(canvas.height * 0.32, 160)
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.font = `bold ${fontSize}px Inter, Arial, sans-serif`
      const maxWidth = canvas.width * 0.8
      while (offCtx.measureText(word).width > maxWidth && fontSize > 12) {
        fontSize -= 4
        offCtx.font = `bold ${fontSize}px Inter, Arial, sans-serif`
      }

      offCtx.fillStyle = 'white'
      offCtx.fillText(word, canvas.width / 2, canvas.height / 2)

      const pixels = offCtx.getImageData(0, 0, canvas.width, canvas.height).data
      // Rodízio sequencial: cada palavra usa a próxima cor, garantindo
      // que todas apareçam com a mesma frequência.
      const newColor = BRAND_PALETTE[colorIndexRef.current % BRAND_PALETTE.length]
      colorIndexRef.current++

      const particles = particlesRef.current
      let particleIndex = 0

      const coordsIndexes = []
      for (let i = 0; i < pixels.length; i += pixelSteps * 4) {
        coordsIndexes.push(i)
      }
      // Embaralha para um movimento mais fluido.
      for (let i = coordsIndexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[coordsIndexes[i], coordsIndexes[j]] = [coordsIndexes[j], coordsIndexes[i]]
      }

      for (const pixelIndex of coordsIndexes) {
        const alpha = pixels[pixelIndex + 3]
        if (alpha > 0) {
          const x = (pixelIndex / 4) % canvas.width
          const y = Math.floor(pixelIndex / 4 / canvas.width)

          let particle
          if (particleIndex < particles.length) {
            particle = particles[particleIndex]
            particle.isKilled = false
            particleIndex++
          } else {
            particle = new Particle()
            const randomPos = generateRandomPos(canvas.width / 2, canvas.height / 2, (canvas.width + canvas.height) / 2)
            particle.pos.x = randomPos.x
            particle.pos.y = randomPos.y
            particle.maxSpeed = Math.random() * 6 + 4
            particle.maxForce = particle.maxSpeed * 0.05
            particle.particleSize = Math.random() * 6 + 6
            particle.colorBlendRate = Math.random() * 0.0275 + 0.0025
            particles.push(particle)
          }

          particle.startColor = {
            r: particle.startColor.r + (particle.targetColor.r - particle.startColor.r) * particle.colorWeight,
            g: particle.startColor.g + (particle.targetColor.g - particle.startColor.g) * particle.colorWeight,
            b: particle.startColor.b + (particle.targetColor.b - particle.startColor.b) * particle.colorWeight,
          }
          particle.targetColor = newColor
          particle.colorWeight = 0
          particle.target.x = x
          particle.target.y = y
        }
      }

      for (let i = particleIndex; i < particles.length; i++) {
        particles[i].kill(canvas.width, canvas.height)
      }
    }

    const animate = () => {
      const ctx = canvas.getContext('2d')
      const particles = particlesRef.current

      // Fundo com leve rastro (motion blur) no tom da superfície do tema.
      ctx.fillStyle = 'rgba(26, 26, 46, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i]
        particle.move()
        particle.draw(ctx, drawAsPoints)

        if (particle.isKilled) {
          if (
            particle.pos.x < 0 || particle.pos.x > canvas.width ||
            particle.pos.y < 0 || particle.pos.y > canvas.height
          ) {
            particles.splice(i, 1)
          }
        }
      }

      frameCountRef.current++
      if (frameCountRef.current % 240 === 0) {
        wordIndexRef.current = (wordIndexRef.current + 1) % words.length
        nextWord(words[wordIndexRef.current])
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    const resize = () => {
      canvas.width = container?.clientWidth || 800
      canvas.height = container?.clientHeight || 500
      wordIndexRef.current = 0
      particlesRef.current = []
      nextWord(words[0])
    }

    resize()
    animate()

    const observer = new ResizeObserver(resize)
    if (container) observer.observe(container)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} />
}
