import { ref } from 'vue'
import { useAppStore, type DataItem } from '../stores/app'
import { audioEl } from './useAudio'
import { recordListenTime } from './useStats'
import { recordItemListened } from './useSpacedRepetition'
import { t } from '@/i18n'

const SILENT_WAV = 'data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAAAAAA'

const loopPlaylist = ref<(DataItem & { _cat: string })[]>([])
const loopIndex = ref(0)
const loopRound = ref(1)
const loopPlaying = ref(false)
const loopPaused = ref(false)
const loopRepeat = ref(false)
const listSpeaking = ref(false)

let _loopTimers: ReturnType<typeof setTimeout>[] = []
let silentAudio: HTMLAudioElement | null = null

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

function clearLoopTimers() {
  _loopTimers.forEach(t => clearTimeout(t))
  _loopTimers = []
}

function startSilentKeepAlive() {
  if (silentAudio) return
  silentAudio = new Audio(SILENT_WAV)
  silentAudio.loop = true
  silentAudio.volume = 0.01
  silentAudio.play().catch(() => {})
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
      { src: 'android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
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

  setupMediaSession()

  recordItemListened(it._cat, it.id)

  const fn1 = store.audioMap[it.word]
  if (!fn1) { nextLoopItemInternal(); return }

  audioEl.onended = () => {
    recordListenTime(audioEl.duration)
    if (!loopPlaying.value || loopPaused.value) return
    _loopTimers.push(setTimeout(() => {
      if (!loopPlaying.value || loopPaused.value) return
      if (it.example && store.audioMap[it.example]) {
        audioEl.onended = () => {
          recordListenTime(audioEl.duration)
          if (!loopPlaying.value || loopPaused.value) return
          _loopTimers.push(setTimeout(() => nextLoopItemInternal(), 800))
        }
        audioEl.src = `${import.meta.env.BASE_URL}audio/` +store.audioMap[it.example]
        audioEl.play().catch(() => {})
      } else {
        _loopTimers.push(setTimeout(() => nextLoopItemInternal(), 800))
      }
    }, 500))
  }
  audioEl.src = `${import.meta.env.BASE_URL}audio/` +fn1
  audioEl.play().catch(() => {})
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
    loopPaused.value = false
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
    // Resume mid-playback audio, not restart
    if (audioEl.src && audioEl.paused && audioEl.currentTime > 0) {
      audioEl.play().catch(() => {})
    } else {
      playLoopItem()
    }
  } else {
    loopPaused.value = true
    clearLoopTimers()
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
    audioEl.pause()
  }
}

function stop() {
  loopPlaying.value = false
  loopPaused.value = false
  loopRepeat.value = false
  listSpeaking.value = false
  clearLoopTimers()
  audioEl.onended = null
  audioEl.pause()
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
  }
}
