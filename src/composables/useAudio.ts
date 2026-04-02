import { ref } from 'vue'
import { useAppStore } from '../stores/app'
import { recordListenTime } from './useStats'
import { SILENT_KEEPALIVE_WAV, getGapWavUri } from '@/utils/silentWavGap'

// Single persistent Audio element — essential on iOS to avoid exhausting audio channels
const audioEl = new Audio()
audioEl.setAttribute('playsinline', '')

function audioPath(fn: string): string {
  return `${import.meta.env.BASE_URL}audio/${fn}`
}

export { audioEl }

/**
 * 主轨播放：测页用过麦克风后，部分移动浏览器需 load + 重试 play 才能恢复。
 * onBothFailed：两次 play 均失败时回调（如列表循环里跳过当前条）。
 */
export function playMainTrack(src: string, onBothFailed?: () => void): void {
  audioEl.pause()
  audioEl.src = src
  try {
    audioEl.load()
  } catch {
    /* ignore */
  }
  const fail = onBothFailed ?? (() => {})
  void audioEl.play().catch(() => {
    void audioEl.play().catch(() => fail())
  })
}

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
  playMainTrack(audioPath(fn))
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
      playMainTrack(audioPath(store.audioMap[example]))
    }
  }
  playMainTrack(audioPath(fn1))
}

export const looping = ref(false)
export const loopingWord = ref('')

/** 与列表循环相同：锁屏时节流 setTimeout，用静音间隙 + 保活 */
let practiceLoopSession = 0
let practiceGapAudio: HTMLAudioElement | null = null
let practiceSilentAudio: HTMLAudioElement | null = null

function clearPracticeGap() {
  if (!practiceGapAudio) return
  practiceGapAudio.onended = null
  practiceGapAudio.pause()
  practiceGapAudio.src = ''
  practiceGapAudio = null
}

function startPracticeKeepAlive() {
  if (practiceSilentAudio) return
  practiceSilentAudio = new Audio(SILENT_KEEPALIVE_WAV)
  practiceSilentAudio.loop = true
  practiceSilentAudio.volume = 0.01
  practiceSilentAudio.play().catch(() => {})
}

function stopPracticeKeepAlive() {
  if (!practiceSilentAudio) return
  practiceSilentAudio.pause()
  practiceSilentAudio.src = ''
  practiceSilentAudio = null
}

function schedulePracticeGap(delayMs: number, session: number, action: () => void) {
  if (session !== practiceLoopSession) return
  if (!looping.value) return
  if (delayMs <= 0) {
    action()
    return
  }
  if (!practiceGapAudio) practiceGapAudio = new Audio()
  practiceGapAudio.onended = () => {
    if (session !== practiceLoopSession) return
    if (!looping.value) return
    action()
  }
  practiceGapAudio.src = getGapWavUri(delayMs)
  practiceGapAudio.play().catch(() => {
    if (session !== practiceLoopSession) return
    if (!looping.value) return
    action()
  })
}

export function speakLoop(word: string, example?: string) {
  clearPracticeGap()
  practiceLoopSession++
  const session = practiceLoopSession
  const store = useAppStore()
  looping.value = true
  loopingWord.value = word
  startPracticeKeepAlive()
  function playOnce() {
    if (session !== practiceLoopSession) return
    if (!looping.value) return
    const fn1 = store.audioMap[word]
    if (!fn1) {
      looping.value = false
      stopPracticeKeepAlive()
      return
    }
    audioEl.onended = () => {
      recordListenTime(audioEl.duration)
      if (session !== practiceLoopSession) return
      if (!looping.value) return
      if (example && store.audioMap[example]) {
        audioEl.onended = () => {
          recordListenTime(audioEl.duration)
          if (session !== practiceLoopSession) return
          if (!looping.value) return
          schedulePracticeGap(800, session, playOnce)
        }
        playMainTrack(audioPath(store.audioMap[example]))
      } else {
        schedulePracticeGap(800, session, playOnce)
      }
    }
    playMainTrack(audioPath(fn1))
  }
  playOnce()
}

export function stopLoop() {
  practiceLoopSession++
  looping.value = false
  loopingWord.value = ''
  clearPracticeGap()
  audioEl.onended = null
  audioEl.pause()
  stopPracticeKeepAlive()
  try {
    audioEl.currentTime = 0
  } catch {
    /* ignore */
  }
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
    speakLoop,
    stopLoop,
    looping,
    pause,
    resume,
  }
}
