import { ref } from 'vue'
import { useAppStore, type DataItem } from '../stores/app'
import { audioEl } from './useAudio'
import { recordListenTime } from './useStats'
import { recordItemListened } from './useSpacedRepetition'
import { t } from '@/i18n'

const SILENT_WAV = 'data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAAAAAA'
const LOOP_DEBUG_KEY = 'loop_debug_logs_v1'
const LOOP_DEBUG_MAX = 200

const loopPlaylist = ref<(DataItem & { _cat: string })[]>([])
const loopIndex = ref(0)
const loopRound = ref(1)
const loopPlaying = ref(false)
const loopPaused = ref(false)
const loopRepeat = ref(false)
const listSpeaking = ref(false)

let _loopTimers: ReturnType<typeof setTimeout>[] = []
let silentAudio: HTMLAudioElement | null = null
let gapAudio: HTMLAudioElement | null = null
const gapWavCache = new Map<number, string>()

type LoopDebugEntry = {
  ts: string
  event: string
  index: number
  round: number
  hidden: boolean
  src: string
  detail?: string
}

function safeAudioSrc(src: string): string {
  if (!src) return ''
  const i = src.lastIndexOf('/audio/')
  return i >= 0 ? src.slice(i + 7) : src
}

function readLoopDebugLogs(): LoopDebugEntry[] {
  try {
    const raw = localStorage.getItem(LOOP_DEBUG_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr as LoopDebugEntry[] : []
  } catch {
    return []
  }
}

function appendLoopDebug(event: string, detail?: string) {
  const entry: LoopDebugEntry = {
    ts: new Date().toISOString(),
    event,
    index: loopIndex.value + 1,
    round: loopRound.value,
    hidden: typeof document !== 'undefined' ? document.hidden : false,
    src: safeAudioSrc(audioEl.src),
    detail,
  }
  const logs = readLoopDebugLogs()
  logs.push(entry)
  while (logs.length > LOOP_DEBUG_MAX) logs.shift()
  try {
    localStorage.setItem(LOOP_DEBUG_KEY, JSON.stringify(logs))
  } catch {
    // Ignore quota/serialization failures
  }
}

function clearLoopDebugLogs() {
  localStorage.removeItem(LOOP_DEBUG_KEY)
}

function exportLoopDebugLogs(): string {
  const logs = readLoopDebugLogs()
  if (!logs.length) return 'no loop logs'
  return logs.map((l) =>
    `${l.ts} | ${l.event} | idx=${l.index} | round=${l.round} | hidden=${l.hidden ? 1 : 0} | src=${l.src}${l.detail ? ` | ${l.detail}` : ''}`,
  ).join('\n')
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function createSilentWavDataUri(ms: number): string {
  const clampedMs = Math.max(20, Math.min(2000, Math.floor(ms)))
  const sampleRate = 8000
  const channels = 1
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const numSamples = Math.floor((sampleRate * clampedMs) / 1000)
  const dataSize = numSamples * channels * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * channels * bytesPerSample, true)
  view.setUint16(32, channels * bytesPerSample, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)
  // Fill with ultra-low-level signal instead of pure zero samples.
  // Some mobile power policies may treat fully silent streams as expendable.
  for (let i = 0; i < numSamples; i++) {
    const sample = (i % 2 === 0 ? 1 : -1)
    view.setInt16(44 + i * 2, sample, true)
  }

  return `data:audio/wav;base64,${toBase64(new Uint8Array(buffer))}`
}

function getGapWav(ms: number): string {
  const key = Math.round(ms / 20) * 20
  const cached = gapWavCache.get(key)
  if (cached) return cached
  const wav = createSilentWavDataUri(key)
  gapWavCache.set(key, wav)
  return wav
}

function playGapInBackground(delayMs: number, action: () => void) {
  if (!loopPlaying.value || loopPaused.value) return
  if (delayMs <= 0) {
    action()
    return
  }
  if (!gapAudio) gapAudio = new Audio()
  gapAudio.onended = () => {
    if (!loopPlaying.value || loopPaused.value) return
    action()
  }
  gapAudio.src = getGapWav(delayMs)
  gapAudio.play().catch(() => {
    appendLoopDebug('gap_play_failed', `delayMs=${delayMs}`)
    if (!loopPlaying.value || loopPaused.value) return
    action()
  })
}

function runNextStep(action: () => void, delayMs: number) {
  if (!loopPlaying.value || loopPaused.value) return
  // iOS/WebKit may throttle timers when screen is locked.
  // In background, use audio-driven silent gap to preserve pacing reliably.
  if (typeof document !== 'undefined' && document.hidden) {
    appendLoopDebug('run_next_background', `delayMs=${delayMs}`)
    playGapInBackground(delayMs, action)
    return
  }
  _loopTimers.push(setTimeout(() => {
    if (!loopPlaying.value || loopPaused.value) return
    action()
  }, delayMs))
}

function playCurrentAudio(src: string, onFail: () => void) {
  audioEl.src = src
  appendLoopDebug('play_audio', safeAudioSrc(src))
  audioEl.play().catch(() => {
    appendLoopDebug('play_audio_failed', safeAudioSrc(src))
    if (!loopPlaying.value || loopPaused.value) return
    onFail()
  })
}

// Keep mediaSession in sync with actual audio state
audioEl.addEventListener('play', () => {
  if (loopPlaying.value && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'playing'
  }
})
audioEl.addEventListener('pause', () => {
  if (loopPlaying.value && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'paused'
  }
})
audioEl.addEventListener('ended', () => appendLoopDebug('audio_ended'))
audioEl.addEventListener('error', () => {
  const mediaError = audioEl.error
  appendLoopDebug('audio_error', mediaError ? `code=${mediaError.code}` : 'unknown')
})

function clearLoopTimers() {
  _loopTimers.forEach(t => clearTimeout(t))
  _loopTimers = []
}

function startSilentKeepAlive() {
  if (silentAudio) return
  silentAudio = new Audio(SILENT_WAV)
  silentAudio.loop = true
  silentAudio.volume = 0.01
  silentAudio.play().catch(() => {
    appendLoopDebug('keepalive_failed')
  })
}

function stopSilentKeepAlive() {
  if (!silentAudio) return
  silentAudio.pause()
  silentAudio.src = ''
  silentAudio = null
}

function setupMediaSession() {
  if (!('mediaSession' in navigator)) return
  const it = loopPlaylist.value[loopIndex.value]
  if (!it) return
  navigator.mediaSession.metadata = new MediaMetadata({
    title: it.word + ' - ' + it.meaning,
    artist: t('loopRound') + loopRound.value + t('loopRoundSuffix') + ' · ' + (loopIndex.value + 1) + '/' + loopPlaylist.value.length,
    artwork: [
      { src: 'cover.jpg', sizes: '1024x1024', type: 'image/jpeg' },
    ],
  })
  navigator.mediaSession.playbackState = loopPaused.value ? 'paused' : 'playing'
  navigator.mediaSession.setActionHandler('play', () => {
    if (loopPaused.value) togglePlay()
  })
  navigator.mediaSession.setActionHandler('pause', () => {
    if (!loopPaused.value) togglePlay()
  })
  navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack())
  navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack())
}

function playLoopItem() {
  if (!loopPlaying.value) return
  const store = useAppStore()
  const it = loopPlaylist.value[loopIndex.value]
  if (!it) return
  appendLoopDebug('play_item', `${it.word}`)

  setupMediaSession()

  recordItemListened(it._cat, it.id)

  const fn1 = store.audioMap[it.word]
  if (!fn1) {
    appendLoopDebug('missing_audio', it.word)
    nextLoopItemInternal()
    return
  }

  audioEl.onended = () => {
    recordListenTime(audioEl.duration)
    if (!loopPlaying.value || loopPaused.value) return
    runNextStep(() => {
      if (it.example && store.audioMap[it.example]) {
        audioEl.onended = () => {
          recordListenTime(audioEl.duration)
          if (!loopPlaying.value || loopPaused.value) return
          runNextStep(() => nextLoopItemInternal(), 800)
        }
        playCurrentAudio(`${import.meta.env.BASE_URL}audio/` + store.audioMap[it.example], () => nextLoopItemInternal())
      } else {
        runNextStep(() => nextLoopItemInternal(), 800)
      }
    }, 500)
  }
  playCurrentAudio(`${import.meta.env.BASE_URL}audio/` + fn1, () => nextLoopItemInternal())
}

function nextLoopItemInternal() {
  if (!loopPlaying.value) return
  if (!loopRepeat.value) {
    loopIndex.value++
    if (loopIndex.value >= loopPlaylist.value.length) {
      loopIndex.value = 0
      loopRound.value++
    }
  }
  playLoopItem()
}

function startLoop(items: (DataItem & { _cat: string })[]) {
  if (!items.length) return
  appendLoopDebug('start_loop', `count=${items.length}`)
  startSilentKeepAlive()
  loopPlaylist.value = items
  loopIndex.value = 0
  loopRound.value = 1
  loopPlaying.value = true
  loopPaused.value = false
  listSpeaking.value = false
  setupMediaSession()
  playLoopItem()
}

function startListPlayback(items: (DataItem & { _cat: string })[], from: number, to: number) {
  const slice = items.slice(from - 1, to)
  if (!slice.length) return
  appendLoopDebug('start_list_playback', `from=${from},to=${to},count=${slice.length}`)
  startSilentKeepAlive()
  loopPlaylist.value = slice
  loopIndex.value = 0
  loopRound.value = 1
  loopPlaying.value = true
  loopPaused.value = false
  listSpeaking.value = true
  setupMediaSession()
  playLoopItem()
}

function togglePlay() {
  if (loopPaused.value) {
    appendLoopDebug('resume')
    loopPaused.value = false
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
    // Resume mid-playback audio, not restart
    if (audioEl.src && audioEl.paused && audioEl.currentTime > 0) {
      audioEl.play().catch(() => {})
    } else {
      playLoopItem()
    }
  } else {
    appendLoopDebug('pause')
    loopPaused.value = true
    clearLoopTimers()
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
    audioEl.pause()
  }
}

function stop() {
  appendLoopDebug('stop')
  loopPlaying.value = false
  loopPaused.value = false
  loopRepeat.value = false
  listSpeaking.value = false
  clearLoopTimers()
  audioEl.onended = null
  audioEl.pause()
  if (gapAudio) {
    gapAudio.pause()
    gapAudio.onended = null
    gapAudio.src = ''
    gapAudio = null
  }
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none'
  stopSilentKeepAlive()
}

function toggleRepeat() {
  loopRepeat.value = !loopRepeat.value
}

function nextTrack() {
  clearLoopTimers()
  loopIndex.value = (loopIndex.value + 1) % loopPlaylist.value.length
  playLoopItem()
}

function prevTrack() {
  clearLoopTimers()
  loopIndex.value = (loopIndex.value - 1 + loopPlaylist.value.length) % loopPlaylist.value.length
  playLoopItem()
}

export function useLoopPlayer() {
  return {
    loopPlaylist,
    loopIndex,
    loopRound,
    loopPlaying,
    loopPaused,
    loopRepeat,
    listSpeaking,
    clearLoopTimers,
    startLoop,
    startListPlayback,
    togglePlay,
    stop,
    toggleRepeat,
    nextTrack,
    prevTrack,
    clearLoopDebugLogs,
    exportLoopDebugLogs,
  }
}
