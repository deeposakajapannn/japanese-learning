import { useAppStore } from '../stores/app'
import { recordListenTime } from './useStats'

// Single persistent Audio element — essential on iOS to avoid exhausting audio channels
const audioEl = new Audio()
audioEl.setAttribute('playsinline', '')

function audioPath(fn: string): string {
  return `${import.meta.env.BASE_URL}audio/${fn}`
}

export { audioEl }

export function speakTTS(text: string) {
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = 0.8
  speechSynthesis.speak(u)
}

export function speak(word: string) {
  const store = useAppStore()
  const fn = store.audioMap[word]
  if (!fn) { speakTTS(word); return }
  audioEl.onended = null
  audioEl.src = audioPath(fn)
  audioEl.play().catch(() => {})
}

export function speakWithExample(word: string, example?: string) {
  const store = useAppStore()
  const fn1 = store.audioMap[word]
  if (!fn1) { speakTTS(word); return }
  audioEl.onended = () => {
    recordListenTime(audioEl.duration)
    if (example && store.audioMap[example]) {
      audioEl.onended = () => {
        recordListenTime(audioEl.duration)
        audioEl.onended = null
      }
      audioEl.src = audioPath(store.audioMap[example])
      audioEl.play().catch(() => {})
    }
  }
  audioEl.src = audioPath(fn1)
  audioEl.play().catch(() => {})
}

export function pause() {
  audioEl.pause()
}

export function resume() {
  audioEl.play().catch(() => {})
}

export function useAudio() {
  return {
    audioEl,
    speak,
    speakWithExample,
    pause,
    resume,
  }
}
