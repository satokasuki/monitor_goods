<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// ── State ──────────────────────────────────────────────
const likes = ref<number | null>(null)
const postText = ref<string | null>(null)
const lastUpdated = ref<string>('')
const error = ref<string | null>(null)
const loading = ref(true)

const THREADS_POST_URL =
  'https://www.threads.com/@rioleia.cafe_satoka/post/DUrqbHRAbtV'
const REFRESH_INTERVAL_MS = 10_000

let timer: ReturnType<typeof setInterval> | null = null

// ── Formatted likes with commas ────────────────────────
const formattedLikes = computed(() => {
  if (likes.value === null) return '—'
  return likes.value.toLocaleString('en-US')
})

// ── Time-ago string ────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ago`
}

// ── Fetch like count from our Worker API ───────────────
async function fetchLikes() {
  try {
    const res = await fetch('/api/likes')
    const data = await res.json()

    if (data.likes !== null && data.likes !== undefined) {
      likes.value = data.likes
      error.value = null
    } else {
      error.value = data.error || 'Could not fetch like count'
    }

    if (data.postText) {
      postText.value = data.postText
    }

    lastUpdated.value = data.timestamp || new Date().toISOString()
  } catch (e: any) {
    error.value = e.message || 'Network error'
  } finally {
    loading.value = false
  }
}

// ── Lifecycle ──────────────────────────────────────────
onMounted(() => {
  fetchLikes()
  timer = setInterval(fetchLikes, REFRESH_INTERVAL_MS)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="page">
    <!-- Threads logo -->
    <header class="header">
      <svg class="threads-logo" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M141.537 88.988a66.175 66.175 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.11 5.864 14.05a92.49 92.49 0 0 0-24.124-2.727c-27.7 0-45.506 14.78-45.506 37.737 0 22.441 19.051 36.846 43.345 36.846 21.181 0 36.792-10.038 45.328-29.123 3.501-7.846 5.278-17.02 5.382-27.912 5.221 3.163 9.14 7.434 11.424 12.872 3.883 9.243 4.112 24.414-3.263 35.844-8.136 12.604-20.988 19.088-38.171 19.269-19.044-.2-33.476-6.263-42.906-18.012-8.793-10.958-13.386-26.472-13.64-46.117.254-19.645 4.847-35.159 13.64-46.117 9.43-11.749 23.862-17.812 42.906-18.012 19.177.207 33.846 6.332 43.573 18.2 4.736 5.783 8.357 12.903 10.816 21.22l15.856-4.326c-2.942-10.022-7.539-18.704-13.74-25.878C154.508 24.2 136.072 16.878 113.271 16.62h-.114c-22.69.258-41.035 7.612-54.512 21.86C48.59 49.536 42.895 65.236 42.578 84.643v.286c.317 19.407 6.012 35.107 16.067 46.163 13.477 14.248 31.822 21.602 54.512 21.86h.114c20.37-.2 36.452-8.044 47.78-23.305 10.424-14.044 11.893-34.077 6.477-46.964-3.878-9.226-11.314-16.533-21.49-21.266zM98.07 131.641c-14.574 0-23.606-7.991-23.606-20.877 0-8.181 3.761-19.161 28.853-19.161 7.07 0 13.65.84 19.584 2.497-.838 24.821-12.658 37.541-24.831 37.541z"
          fill="currentColor"
        />
      </svg>
    </header>

    <!-- Post preview card -->
    <a :href="THREADS_POST_URL" target="_blank" rel="noopener" class="post-card">
      <div class="post-author">
        <div class="avatar">
          <img
            src="/profile.png"
            alt="@rioleia.cafe_satoka"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <span class="avatar-fallback">R</span>
        </div>
        <div class="author-info">
          <span class="display-name">rioleia.cafe_satoka</span>
          <span class="handle">@rioleia.cafe_satoka</span>
        </div>
        <svg class="external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
        </svg>
      </div>
      <p class="reply-context">正在回覆 @otaku_five5</p>
      <p class="post-text-static">然後我的拍就丟一邊喔？</p>
    </a>

    <!-- Like count hero -->
    <div class="like-section">
      <!-- Loading state -->
      <div v-if="loading" class="loading">
        <div class="pulse-ring"></div>
        <span>Loading...</span>
      </div>

      <!-- Error state -->
      <div v-else-if="error && likes === null" class="error-state">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p class="error-text">{{ error }}</p>
        <p class="error-hint">The scraper may need adjustment — see README</p>
      </div>

      <!-- Like count display -->
      <template v-else>
        <div class="heart-row">
          <svg class="heart-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            />
          </svg>
        </div>
        <div class="count">{{ formattedLikes }}</div>
        <div class="label">likes</div>
      </template>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <span v-if="lastUpdated" class="updated">
        Updated {{ timeAgo(lastUpdated) }}
      </span>
      <span class="refresh-note">Refreshes every 10s</span>
    </footer>
  </div>
</template>

<style>
/* ── Reset & Base ─────────────────────────────────── */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

body {
  background: #000;
  color: #fff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Page container ───────────────────────────────── */
.page {
  width: 100%;
  max-width: 420px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

/* ── Header / Threads logo ────────────────────────── */
.header {
  display: flex;
  justify-content: center;
}

.threads-logo {
  width: 48px;
  height: 48px;
  color: #fff;
}

/* ── Post card ────────────────────────────────────── */
.post-card {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 16px;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s, border-color 0.2s;
  display: block;
}

.post-card:hover {
  background: #222;
  border-color: #555;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: relative;
  z-index: 1;
}

.avatar-fallback {
  position: absolute;
  font-size: 18px;
  font-weight: 700;
  color: #888;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.display-name {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.handle {
  font-size: 13px;
  color: #777;
}

.external-icon {
  width: 16px;
  height: 16px;
  color: #555;
  flex-shrink: 0;
}

.reply-context {
  margin-top: 12px;
  font-size: 13px;
  color: #555;
}

.post-text-static {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.5;
  color: #eee;
}

.post-text {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #ccc;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Like count section ───────────────────────────── */
.like-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
}

.heart-row {
  display: flex;
  align-items: center;
  justify-content: center;
}

.heart-icon {
  width: 40px;
  height: 40px;
  color: #ff3040;
  filter: drop-shadow(0 0 12px rgba(255, 48, 64, 0.4));
}

.count {
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -2px;
  background: linear-gradient(180deg, #fff 0%, #bbb 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.label {
  font-size: 18px;
  font-weight: 600;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 4px;
}

/* ── Loading state ────────────────────────────────── */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #777;
  font-size: 14px;
}

.pulse-ring {
  width: 48px;
  height: 48px;
  border: 3px solid #333;
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Error state ──────────────────────────────────── */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.error-icon {
  width: 32px;
  height: 32px;
  color: #ff3040;
}

.error-text {
  font-size: 14px;
  color: #ff3040;
}

.error-hint {
  font-size: 12px;
  color: #555;
}

/* ── Footer ───────────────────────────────────────── */
.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.updated {
  font-size: 13px;
  color: #555;
}

.refresh-note {
  font-size: 11px;
  color: #333;
}

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 480px) {
  .page {
    padding: 32px 16px;
  }

  .count {
    font-size: 56px;
  }
}
</style>
