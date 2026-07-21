import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export function useAssistantMotion() {
  const rotateX = ref(0)
  const rotateY = ref(0)
  const isReducedMotion = ref(false)
  const isHidden = ref(false)
  let frame = 0

  const avatarStyle = computed(() => {
    if (isReducedMotion.value || isHidden.value) {
      return { transform: 'translate3d(0, 0, 0)' }
    }

    return {
      transform: `perspective(900px) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) translate3d(0, -2px, 0)`
    }
  })

  function onPointerMove(event: PointerEvent) {
    if (isReducedMotion.value || isHidden.value || event.pointerType === 'touch') {
      return
    }

    const target = event.currentTarget as HTMLElement | null
    const rect = target?.getBoundingClientRect()

    if (!rect) {
      return
    }

    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5

    if (frame) {
      cancelAnimationFrame(frame)
    }

    frame = requestAnimationFrame(() => {
      rotateX.value = Math.max(-5, Math.min(5, y * -8))
      rotateY.value = Math.max(-7, Math.min(7, x * 10))
    })
  }

  function resetPointer() {
    rotateX.value = 0
    rotateY.value = 0
  }

  function onVisibilityChange() {
    isHidden.value = document.hidden

    if (document.hidden) {
      resetPointer()
    }
  }

  onMounted(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    isReducedMotion.value = media.matches
    const updateMotion = () => {
      isReducedMotion.value = media.matches
    }

    media.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', onVisibilityChange)

    onBeforeUnmount(() => {
      media.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', onVisibilityChange)

      if (frame) {
        cancelAnimationFrame(frame)
      }
    })
  })

  return {
    avatarStyle,
    isReducedMotion,
    onPointerMove,
    resetPointer
  }
}
