import { ref } from 'vue'
import firebase from 'firebase/compat/app'
import 'firebase/compat/database'
import { t } from '@/i18n'
import { mergeListenCountMaps } from '@/utils/listenCount'
import { cloudSync } from '@/config/thresholds'

const firebaseConfig = {
  apiKey: "AIzaSyBCZa2CyskF8bM_CU0l2UaT7Wwq25cz30Q",
  authDomain: "jp-learn-e01bd.firebaseapp.com",
  databaseURL: "https://jp-learn-e01bd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jp-learn-e01bd",
  storageBucket: "jp-learn-e01bd.firebasestorage.app",
  messagingSenderId: "1055060519096",
  appId: "1:1055060519096:web:ed0421d0a6938186c6ec4d",
}

const userId = ref(localStorage.getItem('jp_user_id') || '')
let db: firebase.database.Database | null = null
let syncTimer: ReturnType<typeof setTimeout> | null = null

// --- Synced keys registry ---
const SYNCED_KEYS = [
  { local: 'jp_stats',              cloud: 'stats' },
  { local: 'jp_item_counts',        cloud: 'counts' },
  { local: 'jp_delays',             cloud: 'delays' },
  { local: 'jp_listened',           cloud: 'listened' },
  { local: 'jp_listen_dismissed',   cloud: 'listenDismissed' },
  { local: 'jp_practice_recognized', cloud: 'practiceRecognized' },
  { local: 'jp_mastery_quiz_passed', cloud: 'masteryQuizPassed' },
  { local: 'jp_quiz_queue',          cloud: 'quizQueue' },
  { local: 'jp_quiz_fails',          cloud: 'quizFails' },
  { local: 'jp_quiz_phase1',         cloud: 'quizPhase1' },
] as const

// --- Merge utilities ---

function mergeMaxNumbers(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const merged = { ...a }
  for (const key in b) {
    merged[key] = Math.max(merged[key] || 0, b[key] || 0)
  }
  return merged
}

/** 合并推迟复习日期：值为 YYYY-MM-DD（见 useSpacedRepetition），字典序与日期先后一致，取较晚一天 */
function mergeLaterReviewDates(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
  const merged = { ...a }
  for (const key in b) {
    const vb = b[key]
    if (!merged[key] || vb > merged[key]) merged[key] = vb
  }
  return merged
}

function mergeDismissed(a: Record<string, true>, b: Record<string, true>): Record<string, true> {
  return { ...a, ...b }
}

function mergeStats(a: Record<string, any>, b: Record<string, any>): Record<string, any> {
  const merged: Record<string, any> = {}
  const allDays = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const day of allDays) {
    const da = a[day] || {}
    const db = b[day] || {}
    merged[day] = {
      studied:  Math.max(da.studied || 0, db.studied || 0),
      quizzed:  Math.max(da.quizzed || 0, db.quizzed || 0),
      correct:  Math.max(da.correct || 0, db.correct || 0),
      listened: Math.max(da.listened || 0, db.listened || 0),
      wrong:    mergeMaxNumbers(da.wrong || {}, db.wrong || {}),
    }
  }
  return merged
}

function readLocal(): Record<string, any> {
  const data: Record<string, any> = {}
  for (const k of SYNCED_KEYS) {
    data[k.cloud] = JSON.parse(localStorage.getItem(k.local) || '{}')
  }
  return data
}

function writeLocal(data: Record<string, any>) {
  for (const k of SYNCED_KEYS) {
    localStorage.setItem(k.local, JSON.stringify(data[k.cloud] || {}))
  }
}

function mergeData(local: Record<string, any>, cloud: Record<string, any>): Record<string, any> {
  return {
    stats:            mergeStats(local.stats || {}, cloud.stats || {}),
    counts:           mergeMaxNumbers(local.counts || {}, cloud.counts || {}),
    delays:           mergeLaterReviewDates(local.delays || {}, cloud.delays || {}),
    listened:         mergeListenCountMaps(local.listened || {}, cloud.listened || {}),
    listenDismissed:  mergeDismissed(local.listenDismissed || {}, cloud.listenDismissed || {}),
    practiceRecognized: mergeDismissed(local.practiceRecognized || {}, cloud.practiceRecognized || {}),
    masteryQuizPassed: mergeDismissed(local.masteryQuizPassed || {}, cloud.masteryQuizPassed || {}),
    quizQueue: mergeMaxNumbers(local.quizQueue || {}, cloud.quizQueue || {}),
  }
}

// --- Password hashing ---

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'jp-learn-salt')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// --- Firebase core ---

function initFirebase() {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
  }
  db = firebase.database()
}

function syncToCloud() {
  if (!userId.value || !db) return
  const data = readLocal()
  const hasPayload =
    Object.keys(data.stats).length > 0 ||
    Object.keys(data.counts).length > 0 ||
    Object.keys(data.delays || {}).length > 0 ||
    Object.keys(data.listened || {}).length > 0 ||
    Object.keys(data.listenDismissed || {}).length > 0 ||
    Object.keys(data.practiceRecognized || {}).length > 0 ||
    Object.keys(data.masteryQuizPassed || {}).length > 0 ||
    Object.keys(data.quizQueue || {}).length > 0
  if (!hasPayload) return
  db.ref('users/' + userId.value + '/data').set(data)
}

/** 整包写入云端（含全空对象），用于清除本地后覆盖云端，避免下次拉取又恢复旧数据 */
function flushDataToCloud() {
  if (!userId.value || !db) return
  const payload = readLocal()
  payload.resetAt = Date.now()
  db.ref('users/' + userId.value + '/data').set(payload)
  localStorage.setItem('jp_reset_at', String(payload.resetAt))
}

function debouncedSync() {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(syncToCloud, cloudSync.debounceMs)
}

async function pullAndMerge(): Promise<boolean> {
  if (!userId.value || !db) return false
  try {
    const snap = await db.ref('users/' + userId.value + '/data').once('value')
    if (!snap.exists()) return false
    const cloud = snap.val()
    const localResetAt = Number(localStorage.getItem('jp_reset_at') || '0')
    const cloudResetAt = Number(cloud.resetAt || 0)

    // Cloud was reset after our last known reset → wipe local to match
    if (cloudResetAt > localResetAt) {
      writeLocal(cloud)
      localStorage.setItem('jp_reset_at', String(cloudResetAt))
      return true
    }

    const local = readLocal()
    const merged = mergeData(local, cloud)
    if (cloudResetAt) merged.resetAt = cloudResetAt
    writeLocal(merged)
    await db.ref('users/' + userId.value + '/data').set(merged)
    return true
  } catch {
    return false
  }
}

async function register(username: string, password: string): Promise<{ success: boolean; message: string }> {
  const name = username.trim().toLowerCase()
  if (!name || name.length < 2) {
    return { success: false, message: t('loginMinLen') }
  }
  if (!/^[a-z0-9_-]+$/.test(name)) {
    return { success: false, message: t('loginFormat') }
  }
  if (password.length < 6) {
    return { success: false, message: t('passwordMinLen') }
  }
  if (!db) {
    return { success: false, message: t('loginFail') }
  }

  try {
    const snap = await db.ref('users/' + name + '/profile').once('value')
    if (snap.exists()) {
      return { success: false, message: t('usernameTaken') }
    }

    const hash = await hashPassword(password)
    await db.ref('users/' + name + '/profile').set({ passwordHash: hash })

    // Upload local data to new account
    const local = readLocal()
    if (Object.keys(local.stats).length > 0 || Object.keys(local.counts).length > 0) {
      await db.ref('users/' + name + '/data').set(local)
    }

    userId.value = name
    localStorage.setItem('jp_user_id', name)
    return { success: true, message: t('registerSuccess') }
  } catch {
    return { success: false, message: t('loginFail') }
  }
}

async function login(username: string, password: string): Promise<{ success: boolean; message: string }> {
  const name = username.trim().toLowerCase()
  if (!name || name.length < 2) {
    return { success: false, message: t('loginMinLen') }
  }
  if (!password) {
    return { success: false, message: t('passwordMinLen') }
  }
  if (!db) {
    return { success: false, message: t('loginFail') }
  }

  try {
    const snap = await db.ref('users/' + name + '/profile').once('value')
    if (!snap.exists()) {
      return { success: false, message: t('userNotFound') }
    }

    const hash = await hashPassword(password)
    const profile = snap.val()
    if (profile.passwordHash !== hash) {
      return { success: false, message: t('wrongPassword') }
    }

    userId.value = name
    localStorage.setItem('jp_user_id', name)

    // Pull and merge cloud data
    const cloudSnap = await db.ref('users/' + name + '/data').once('value')
    if (cloudSnap.exists()) {
      const cloud = cloudSnap.val()
      const localResetAt = Number(localStorage.getItem('jp_reset_at') || '0')
      const cloudResetAt = Number(cloud.resetAt || 0)

      if (cloudResetAt > localResetAt) {
        // Cloud was reset more recently → adopt cloud state (which is empty)
        writeLocal(cloud)
        localStorage.setItem('jp_reset_at', String(cloudResetAt))
      } else {
        const local = readLocal()
        const merged = mergeData(local, cloud)
        if (cloudResetAt) merged.resetAt = cloudResetAt
        writeLocal(merged)
        await db.ref('users/' + name + '/data').set(merged)
      }
    }

    return { success: true, message: t('loginFound') }
  } catch {
    return { success: false, message: t('loginFail') }
  }
}

function logout() {
  userId.value = ''
  localStorage.removeItem('jp_user_id')
}

export function useFirebase() {
  return {
    userId,
    syncToCloud,
    flushDataToCloud,
    debouncedSync,
    register,
    login,
    logout,
    pullAndMerge,
    initFirebase,
    SYNCED_KEYS,
  }
}
