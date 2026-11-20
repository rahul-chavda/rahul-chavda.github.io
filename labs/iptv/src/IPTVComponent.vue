<template>
  <div class="w-screen h-screen overflow-hidden relative" tabindex="0">
    <video ref="videoPlayer" class="bg-black w-full h-full object-cover" playsinline preload="auto" />

    <div v-if="!isPlaying" class="absolute inset-0 w-full h-full z-10 bg-black"></div>

    <div v-if="isPlayerLoading && isPlaying"
      :style="{ backgroundImage: `url(${staticNoiseUrl})` }"
      class="absolute inset-0 w-full h-full z-10 bg-black/70 flex items-center justify-center bg-repeat bg-size=[200px]">
    </div>

    <div v-if="showChannelNameIndicator" class="absolute top-8 left-8 z-20 transition-opacity duration-300"
      :class="{ 'opacity-100': showChannelNameIndicator, 'opacity-0': !showChannelNameIndicator }">
      <div class="px-4 py-2 text-green-500 text-3xl font-bold">
        CH #{{ currentChannelIndex + 1 }} - {{ currentChannelName }}
      </div>
    </div>

    <div v-if="showVolumeIndicator"
      class="absolute bottom-40 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-300"
      :class="{ 'opacity-100': showVolumeIndicator, 'opacity-0': !showVolumeIndicator }">
      <div class="px-4 py-2 rounded-md flex items-center flex-col">
        <div class="text-green-500 text-2xl self-start uppercase font-semibold mb-2">VOLUME</div>

        <div class="h-15 flex items-center space-x-1">
          <div v-for="i in VOLUME_BARS" :key="i" class="h-full w-3 relative overflow-hidden">
            <div class="absolute bottom-0 w-full"
              :class="i <= Math.round(volume * VOLUME_BARS) ? 'bg-green-500' : 'bg-transparent'"
              :style="{ height: i <= Math.round(volume * VOLUME_BARS) ? '100%' : '0%' }">
            </div>
          </div>
        </div>
      </div>
    </div>

    <ModalDialog v-model="showInfoModal" title="About This Project" theme="dark" maxWidth="md">
      <template #body>
        <div class="space-y-4">
          <p>This IPTV Player is inspired by
            <a href="https://github.com/iptv-org/iptv" target="_blank" class="underline">IPTV</a> and
            <a href="https://ytch.xyz/" target="_blank" class="underline">YTCH</a>.
          </p>

          <div class="mt-2">
            <h3 class="text-lg font-semibold mb-2">Keyboard Shortcuts</h3>
            <div class="bg-gray-800 p-3 rounded-md text-sm">
              <div class="grid grid-cols-2 gap-y-2">
                <kbd>Space</kbd>
                <span>Play/Pause</span>

                <kbd>M</kbd>
                <span>Mute/Unmute</span>

                <kbd>Arrow Up</kbd>
                <span>Channel Up</span>

                <kbd>Arrow Down</kbd>
                <span>Channel Down</span>

                <kbd>Arrow Right</kbd>
                <span>Volume Up</span>

                <kbd>Arrow Left</kbd>
                <span>Volume Down</span>

                <kbd>F</kbd>
                <span>Fullscreen</span>

                <kbd>Esc</kbd>
                <span>Exit Fullscreen</span>

                <kbd>L</kbd>
                <span>Channel List</span>

                <kbd>I</kbd>
                <span>Show Info</span>
              </div>
            </div>
          </div>

          <p class="italic text-xs mt-4">This project is for educational and demonstration purposes only.</p>
        </div>
      </template>
    </ModalDialog>

    <ModalDialog v-model="showChannelListModal" :title="`Channel List (${totalChannels})`" theme="dark" maxWidth="lg"
      @close="channelSearchQuery = ''">
      <template #body>
        <div>
          <div class="mb-4">
            <div class="relative">
              <input type="text" v-model="channelSearchQuery" placeholder="Search channels..."
                class="w-full px-4 py-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button v-if="channelSearchQuery" @click="channelSearchQuery = ''"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer">
                ×
              </button>
            </div>
          </div>

          <div v-if="filteredChannels.length > 0" class="space-y-2 max-h-64 overflow-scroll">
            <div class="flex flex-col gap-2">
              <div v-for="channel in filteredChannels" :key="channel.url" @click="handleChannelSelect(channel)"
                class="flex p-2 rounded-md hover:bg-gray-700/50 cursor-pointer transition-colors duration-200">
                <div class="flex-shrink-0 mr-4 text-center w-10 text-gray-300 font-semibold text-2xl">
                  {{ channel.channelNumber }}
                </div>
                <div class="flex-1">
                  <h4 class="text-white truncate">{{ channel.name }}</h4>
                  <span v-if="channel.group" class="text-xs">{{ channel.group }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="IPTVChannels.length" class="text-center py-10">
            <p class="text-gray-400">No channels available</p>
          </div>

          <div v-else class="text-center py-10">
            <p class="text-gray-400">No channels found matching "{{ channelSearchQuery }}"</p>
          </div>
        </div>
      </template>
    </ModalDialog>

    <div class="absolute bottom-0 right-0 z-40">
      <div class="flex items-center justify-center m-6">
        <div class="bg-gray-900/80 p-4 rounded-2xl shadow-lg">
          <div class="grid grid-cols-2 gap-3">
            <a href="/lab" class="flex items-center justify-center w-10 h-10 text-white rounded text-2xl">
              <Icon icon="mdi:arrow-back" />
            </a>
            <!-- on/off button -->
            <button @click="togglePlayPause"
              class="flex items-center justify-center w-10 h-10 bg-red-500 rounded-full cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff">
                <path d="M480-480q-17 0-28.5-11.5T440-520v-320q0-17 11.5-28.5T480-880q17 0 28.5 11.5T520-840v320q0 17-11.5 28.5T480-480Zm0 360q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-480q0-61 20-118.5T198-704q11-14 28-13.5t30 13.5q11 11 10 27t-11 30q-27 36-41 79t-14 88q0 117 81.5 198.5T480-200q117 0 198.5-81.5T760-480q0-46-13.5-89.5T704-649q-10-13-11-28.5t10-26.5q12-12 29-12.5t28 12.5q39 48 59.5 105T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Z"/>
              </svg>
            </button>
            <!--channel list-->
            <button @click="showChannelListModal = true"
              class="flex items-center justify-center w-10 h-10 bg-white rounded-md cursor-pointer text-2xl">
              <Icon icon="mdi:book-open-blank-variant-outline" />
            </button>
            <!--mute/unmute button-->
            <button @click="toggleMute"
              class="flex items-center justify-center w-10 h-10 bg-white rounded-md cursor-pointer text-2xl">
              <span v-if="isMuted" class="text-red-500">
                <Icon icon="mdi:mute" />
              </span>
              <span v-else>
                <Icon icon="mdi:volume-high" />
              </span>
            </button>
            <!-- volume up/down -->
            <div class="flex justify-center row-span-2 flex-col bg-white rounded-md">
              <button @click="increaseVolume"
                class="flex items-center justify-center w-10 h-10 cursor-pointer text-2xl">
                <Icon icon="mdi:plus" />
              </button>
              <button @click="decreaseVolume"
                class="flex items-center justify-center w-10 h-10 cursor-pointer text-2xl">
                <Icon icon="mdi:minus" />
              </button>
            </div>
            <!--channel update-->
            <div class="flex justify-center row-span-2 flex-col bg-white rounded-md">
              <button @click="changeChannelUp"
                class="flex items-center justify-center w-10 h-10 cursor-pointer text-2xl">
                <Icon icon="mdi:chevron-up" />
              </button>
              <button @click="changeChannelDown"
                class="flex items-center justify-center w-10 h-10 cursor-pointer text-2xl">
                <Icon icon="mdi:chevron-down" />
              </button>
            </div>
            <!--info modal-->
            <button @click="showInfoModal = true"
              class="flex items-center justify-center w-10 h-10 bg-white rounded-md cursor-pointer text-2xl">
              <Icon icon="mdi:information-outline" />
            </button>
            <!-- full screen -->
            <button @click="toggleFullscreen"
              class="flex items-center justify-center w-10 h-10 bg-white rounded-md cursor-pointer text-2xl">
              <span v-if="isFullscreen">
                <Icon icon="mdi:fullscreen-exit" />
              </span>
              <span v-else>
                <Icon icon="mdi:fullscreen" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { Icon } from '@iconify/vue';
import ModalDialog from './ModalDialog.vue';
import type { IPTVChannel } from './IPTVm3uParser';
import { parseM3uContent } from './IPTVm3uParser';
import staticNoiseUrl from './assets/static.gif';
import Hls from 'hls.js';

const PLAYLIST_URL = 'https://iptv-org.github.io/iptv/countries/in.m3u';
const VOLUME_BARS = 20;
const VOLUME_INTERVAL = 0.05;
const INDICATOR_DISPLAY_TIME = 3000;

let hls: Hls | null = null;
const videoPlayer = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);
const isPlayerLoading = ref(true);
const isMuted = ref(true);
const volume = ref(1.0);
const showVolumeIndicator = ref(false);

const isFullscreen = ref(false);
const IPTVChannels = ref<IPTVChannel[]>([]);
const currentChannelIndex = ref(-1);
const currentChannelName = ref('');
const showChannelNameIndicator = ref(false);

const showInfoModal = ref(false);

const showChannelListModal = ref(false);
const channelSearchQuery = ref('');

let volumeIndicatorTimer: number | null = null;
let channelNameIndicatorTimer: number | null = null;

const totalChannels = computed(() => IPTVChannels.value.length);

const filteredChannels = computed(() => {
  if (!channelSearchQuery.value.trim()) return IPTVChannels.value;

  const query = channelSearchQuery.value.toLowerCase();
  return IPTVChannels.value.filter(channel =>
    channel.name.toLowerCase().includes(query) ||
    (channel.group && channel.group.toLowerCase().includes(query))
  );
});

const initializePlayer = () => {
  const video = videoPlayer.value;
  if (!video) return;

  video.addEventListener('play', () => {
    isPlaying.value = true;
  });

  video.addEventListener('pause', () => {
    isPlaying.value = false;
  });

  video.addEventListener('ended', () => {
    isPlaying.value = false;
  });

  video.addEventListener('loadstart', () => {
    isPlayerLoading.value = true;
  });

  video.addEventListener('loadeddata', () => {
    isPlayerLoading.value = false;
  });

  video.addEventListener('waiting', () => {
    isPlayerLoading.value = true;
  });

  video.addEventListener('playing', () => {
    isPlayerLoading.value = false;
  });

  video.addEventListener('error', () => {
    isPlayerLoading.value = false;
  });

  video.addEventListener('volumechange', () => {
    isMuted.value = video.muted;
    volume.value = video.volume;
  });

  isMuted.value = video.muted;
  volume.value = video.volume;

  if (IPTVChannels.value.length > 0) {
    loadFirstChannel();
  }
};

const togglePlayPause = () => {
  const video = videoPlayer.value;
  if (!video) return;

  if (video.paused) {
    video.play().catch(() => { });
  } else {
    video.pause();
  }
};

const toggleMute = () => {
  const video = videoPlayer.value;
  if (!video) return;

  video.muted = !video.muted;
  isMuted.value = video.muted;
};

const increaseVolume = () => {
  const video = videoPlayer.value;
  if (!video) return;

  const newVolume = Math.min(volume.value + VOLUME_INTERVAL, 1.0);
  volume.value = newVolume;
  video.volume = newVolume;

  showVolumeIndicatorTimer();

  if (video.muted) {
    video.muted = false;
    isMuted.value = false;
  }
};

const decreaseVolume = () => {
  const video = videoPlayer.value;
  if (!video) return;

  const newVolume = Math.max(volume.value - VOLUME_INTERVAL, 0.0);
  volume.value = newVolume;
  video.volume = newVolume;

  showVolumeIndicatorTimer();

  if (newVolume <= 0.0) {
    video.muted = true;
    isMuted.value = true;
  }
};

const changeChannelUp = () => {
  if (IPTVChannels.value.length === 0) return;

  const index = currentChannelIndex.value;
  const nextIndex = (index === IPTVChannels.value.length - 1 || index === -1) ? 0 : index + 1;
  handleChannelSelect(IPTVChannels.value[nextIndex]);
};

const changeChannelDown = () => {
  if (IPTVChannels.value.length === 0) return;

  const index = currentChannelIndex.value;
  const prevIndex = (index <= 0) ? IPTVChannels.value.length - 1 : index - 1;
  handleChannelSelect(IPTVChannels.value[prevIndex]);
};

const showVolumeIndicatorTimer = () => {
  showVolumeIndicator.value = true;

  if (volumeIndicatorTimer !== null) {
    clearTimeout(volumeIndicatorTimer);
  }

  volumeIndicatorTimer = window.setTimeout(() => {
    showVolumeIndicator.value = false;
    volumeIndicatorTimer = null;
  }, INDICATOR_DISPLAY_TIME);
};

const showChannelNameIndicatorTimer = () => {
  showChannelNameIndicator.value = true;

  if (channelNameIndicatorTimer !== null) {
    clearTimeout(channelNameIndicatorTimer);
  }

  channelNameIndicatorTimer = window.setTimeout(() => {
    showChannelNameIndicator.value = false;
    channelNameIndicatorTimer = null;
  }, INDICATOR_DISPLAY_TIME);
};

const toggleFullscreen = () => {
  const container = document.documentElement as HTMLElement;

  if (!container) return;

  if (!isFullscreen.value) {
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    } else if (container.msRequestFullscreen) {
      container.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
};

const handleFullscreenChange = () => {
  isFullscreen.value = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement) {
    return;
  }

  switch (event.key.toLowerCase()) {
    case ' ': // Space bar
      event.preventDefault();
      togglePlayPause();
      break;
    case 'm':
      toggleMute();
      break;
    case 'arrowup':
      event.preventDefault();
      changeChannelUp();
      break;
    case 'arrowdown':
      event.preventDefault();
      changeChannelDown();
      break;
    case 'arrowright':
      event.preventDefault();
      increaseVolume();
      break;
    case 'arrowleft':
      event.preventDefault();
      decreaseVolume();
      break;
    case 'f':
      event.preventDefault();
      if (!isFullscreen.value) {
        toggleFullscreen();
      }
      break;
    case 'escape':
      if (isFullscreen.value) {
        toggleFullscreen();
      }
      break;
    case 'i':
      showInfoModal.value = true;
      break;
    case 'l':
      showChannelListModal.value = true;
      break;
  }
};

const loadPlaylist = async () => {
  try {
    const response = await fetch(PLAYLIST_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.status} ${response.statusText}`);
    }

    const m3uContent = await response.text();
    initializePlayer();
    IPTVChannels.value = parseM3uContent(m3uContent);
  } catch (error) {
    console.error('Error loading playlist:', error);
    initializePlayer();
  }
};

const handleChannelSelect = (channel: IPTVChannel) => {
  const video = videoPlayer.value;
  if (video && channel.url) {
    isPlayerLoading.value = true;

    if (hls) {
      hls.destroy();
      hls = null;
    }

    if (channel.url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls?.loadSource(channel.url);
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            isPlayerLoading.value = false;
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                hls?.destroy();
                hls = null;
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = channel.url;
      }
    } else {
      video.src = channel.url;
    }

    video.play().catch(() => { });

    currentChannelIndex.value = IPTVChannels.value.findIndex(ch => ch.url === channel.url);
    currentChannelName.value = channel.name;
    showChannelNameIndicatorTimer();
  }
  showChannelListModal.value = false;
};

const loadFirstChannel = () => {
  if (IPTVChannels.value.length > 0 && videoPlayer.value) {
    // showing 9xm channel default :)
    const nineXmChannelIndex = IPTVChannels.value.findIndex(channel => channel.name.includes('9XM'));
    const targetIndex = nineXmChannelIndex !== -1 ? nineXmChannelIndex : 0;
    currentChannelIndex.value = targetIndex;
    handleChannelSelect(IPTVChannels.value[targetIndex]);
  }
};

watch(IPTVChannels, (newChannels) => {
  if (newChannels.length > 0 && videoPlayer.value) {
    loadFirstChannel();
  }
}, { immediate: false });

onMounted(() => {
  loadPlaylist();

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('msfullscreenchange', handleFullscreenChange);
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  if (hls) {
    hls.destroy();
    hls = null;
  }

  if (videoPlayer.value) {
    videoPlayer.value.pause();
    videoPlayer.value.removeAttribute('src');
    videoPlayer.value.load();
  }

  if (volumeIndicatorTimer !== null) {
    clearTimeout(volumeIndicatorTimer);
    volumeIndicatorTimer = null;
  }

  if (channelNameIndicatorTimer !== null) {
    clearTimeout(channelNameIndicatorTimer);
    channelNameIndicatorTimer = null;
  }

  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('msfullscreenchange', handleFullscreenChange);
  document.removeEventListener('keydown', handleKeydown);
});
</script>
