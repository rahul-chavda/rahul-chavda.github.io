import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { Icon } from '@iconify/vue';
import ModalDialog from './ModalDialog.vue';
import { parseM3uContent } from './IPTVm3uParser.ts';
import staticNoiseUrl from './assets/static.gif';
import Hls from 'hls.js';
const PLAYLIST_URL = 'https://iptv-org.github.io/iptv/countries/in.m3u';
const VOLUME_BARS = 20;
const VOLUME_INTERVAL = 0.05;
const INDICATOR_DISPLAY_TIME = 3000;
let hls = null;
const videoPlayer = ref(null);
const isPlaying = ref(false);
const isPlayerLoading = ref(true);
const isMuted = ref(true);
const volume = ref(1.0);
const showVolumeIndicator = ref(false);
const isFullscreen = ref(false);
const IPTVChannels = ref([]);
const currentChannelIndex = ref(-1);
const currentChannelName = ref('');
const showChannelNameIndicator = ref(false);
const showInfoModal = ref(false);
const showChannelListModal = ref(false);
const channelSearchQuery = ref('');
let volumeIndicatorTimer = null;
let channelNameIndicatorTimer = null;
const totalChannels = computed(() => IPTVChannels.value.length);
const filteredChannels = computed(() => {
    if (!channelSearchQuery.value.trim())
        return IPTVChannels.value;
    const query = channelSearchQuery.value.toLowerCase();
    return IPTVChannels.value.filter(channel => channel.name.toLowerCase().includes(query) ||
        (channel.group && channel.group.toLowerCase().includes(query)));
});
const initializePlayer = () => {
    const video = videoPlayer.value;
    if (!video)
        return;
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
    if (!video)
        return;
    if (video.paused) {
        video.play().catch(() => { });
    }
    else {
        video.pause();
    }
};
const toggleMute = () => {
    const video = videoPlayer.value;
    if (!video)
        return;
    video.muted = !video.muted;
    isMuted.value = video.muted;
};
const increaseVolume = () => {
    const video = videoPlayer.value;
    if (!video)
        return;
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
    if (!video)
        return;
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
    if (IPTVChannels.value.length === 0)
        return;
    const index = currentChannelIndex.value;
    const nextIndex = (index === IPTVChannels.value.length - 1 || index === -1) ? 0 : index + 1;
    handleChannelSelect(IPTVChannels.value[nextIndex]);
};
const changeChannelDown = () => {
    if (IPTVChannels.value.length === 0)
        return;
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
    const container = document.documentElement;
    if (!container)
        return;
    if (!isFullscreen.value) {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        }
        else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        }
        else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }
    }
    else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
};
const handleFullscreenChange = () => {
    isFullscreen.value = !!(document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement);
};
const handleKeydown = (event) => {
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
    }
    catch (error) {
        console.error('Error loading playlist:', error);
        initializePlayer();
    }
};
const handleChannelSelect = (channel) => {
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
            }
            else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = channel.url;
            }
        }
        else {
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "w-screen h-screen overflow-hidden relative" },
    tabindex: "0",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.video)({
    ref: "videoPlayer",
    ...{ class: "bg-black w-full h-full object-cover" },
    playsinline: true,
    preload: "auto",
});
/** @type {typeof __VLS_ctx.videoPlayer} */ ;
if (!__VLS_ctx.isPlaying) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "absolute inset-0 w-full h-full z-10 bg-black" },
    });
}
if (__VLS_ctx.isPlayerLoading && __VLS_ctx.isPlaying) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ backgroundImage: `url(${__VLS_ctx.staticNoiseUrl})` }) },
        ...{ class: "absolute inset-0 w-full h-full z-10 bg-black/70 flex items-center justify-center bg-repeat bg-size=[200px]" },
    });
}
if (__VLS_ctx.showChannelNameIndicator) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "absolute top-8 left-8 z-20 transition-opacity duration-300" },
        ...{ class: ({ 'opacity-100': __VLS_ctx.showChannelNameIndicator, 'opacity-0': !__VLS_ctx.showChannelNameIndicator }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "px-4 py-2 text-green-500 text-3xl font-bold" },
    });
    (__VLS_ctx.currentChannelIndex + 1);
    (__VLS_ctx.currentChannelName);
}
if (__VLS_ctx.showVolumeIndicator) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "absolute bottom-40 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-300" },
        ...{ class: ({ 'opacity-100': __VLS_ctx.showVolumeIndicator, 'opacity-0': !__VLS_ctx.showVolumeIndicator }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "px-4 py-2 rounded-md flex items-center flex-col" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-green-500 text-2xl self-start uppercase font-semibold mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h-15 flex items-center space-x-1" },
    });
    for (const [i] of __VLS_getVForSourceType((__VLS_ctx.VOLUME_BARS))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "h-full w-3 relative overflow-hidden" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "absolute bottom-0 w-full" },
            ...{ class: (i <= Math.round(__VLS_ctx.volume * __VLS_ctx.VOLUME_BARS) ? 'bg-green-500' : 'bg-transparent') },
            ...{ style: ({ height: i <= Math.round(__VLS_ctx.volume * __VLS_ctx.VOLUME_BARS) ? '100%' : '0%' }) },
        });
    }
}
/** @type {[typeof ModalDialog, typeof ModalDialog, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(ModalDialog, new ModalDialog({
    modelValue: (__VLS_ctx.showInfoModal),
    title: "About This Project",
    theme: "dark",
    maxWidth: "md",
}));
const __VLS_1 = __VLS_0({
    modelValue: (__VLS_ctx.showInfoModal),
    title: "About This Project",
    theme: "dark",
    maxWidth: "md",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_2.slots.default;
{
    const { body: __VLS_thisSlot } = __VLS_2.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        href: "https://github.com/iptv-org/iptv",
        target: "_blank",
        ...{ class: "underline" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        href: "https://ytch.xyz/",
        target: "_blank",
        ...{ class: "underline" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-semibold mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-gray-800 p-3 rounded-md text-sm" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-2 gap-y-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "italic text-xs mt-4" },
    });
}
var __VLS_2;
/** @type {[typeof ModalDialog, typeof ModalDialog, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(ModalDialog, new ModalDialog({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showChannelListModal),
    title: (`Channel List (${__VLS_ctx.totalChannels})`),
    theme: "dark",
    maxWidth: "lg",
}));
const __VLS_4 = __VLS_3({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.showChannelListModal),
    title: (`Channel List (${__VLS_ctx.totalChannels})`),
    theme: "dark",
    maxWidth: "lg",
}, ...__VLS_functionalComponentArgsRest(__VLS_3));
let __VLS_6;
let __VLS_7;
let __VLS_8;
const __VLS_9 = {
    onClose: (...[$event]) => {
        __VLS_ctx.channelSearchQuery = '';
    }
};
__VLS_5.slots.default;
{
    const { body: __VLS_thisSlot } = __VLS_5.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "text",
        value: (__VLS_ctx.channelSearchQuery),
        placeholder: "Search channels...",
        ...{ class: "w-full px-4 py-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" },
    });
    if (__VLS_ctx.channelSearchQuery) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.channelSearchQuery))
                        return;
                    __VLS_ctx.channelSearchQuery = '';
                } },
            ...{ class: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer" },
        });
    }
    if (__VLS_ctx.filteredChannels.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-2 max-h-64 overflow-scroll" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex flex-col gap-2" },
        });
        for (const [channel] of __VLS_getVForSourceType((__VLS_ctx.filteredChannels))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.filteredChannels.length > 0))
                            return;
                        __VLS_ctx.handleChannelSelect(channel);
                    } },
                key: (channel.url),
                ...{ class: "flex p-2 rounded-md hover:bg-gray-700/50 cursor-pointer transition-colors duration-200" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex-shrink-0 mr-4 text-center w-10 text-gray-300 font-semibold text-2xl" },
            });
            (channel.channelNumber);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
                ...{ class: "text-white truncate" },
            });
            (channel.name);
            if (channel.group) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "text-xs" },
                });
                (channel.group);
            }
        }
    }
    else if (__VLS_ctx.IPTVChannels.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-center py-10" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-gray-400" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-center py-10" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-gray-400" },
        });
        (__VLS_ctx.channelSearchQuery);
    }
}
var __VLS_5;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "absolute bottom-0 right-0 z-40" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-center m-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-gray-900/80 p-4 rounded-2xl shadow-lg" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-2 gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    href: "/lab",
    ...{ class: "flex items-center justify-center w-10 h-10 text-white rounded text-2xl" },
});
const __VLS_10 = {}.Icon;
/** @type {[typeof __VLS_components.Icon, ]} */ ;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
    icon: "mdi:arrow-back",
}));
const __VLS_12 = __VLS_11({
    icon: "mdi:arrow-back",
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.togglePlayPause) },
    ...{ class: "flex items-center justify-center w-10 h-10 bg-red-500 rounded-full cursor-pointer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    xmlns: "http://www.w3.org/2000/svg",
    height: "24px",
    viewBox: "0 -960 960 960",
    width: "24px",
    fill: "#ffffff",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M480-480q-17 0-28.5-11.5T440-520v-320q0-17 11.5-28.5T480-880q17 0 28.5 11.5T520-840v320q0 17-11.5 28.5T480-480Zm0 360q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-480q0-61 20-118.5T198-704q11-14 28-13.5t30 13.5q11 11 10 27t-11 30q-27 36-41 79t-14 88q0 117 81.5 198.5T480-200q117 0 198.5-81.5T760-480q0-46-13.5-89.5T704-649q-10-13-11-28.5t10-26.5q12-12 29-12.5t28 12.5q39 48 59.5 105T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Z",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showChannelListModal = true;
        } },
    ...{ class: "flex items-center justify-center w-10 h-10 bg-white rounded-md cursor-pointer text-2xl" },
});
const __VLS_14 = {}.Icon;
/** @type {[typeof __VLS_components.Icon, ]} */ ;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({
    icon: "mdi:book-open-blank-variant-outline",
}));
const __VLS_16 = __VLS_15({
    icon: "mdi:book-open-blank-variant-outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toggleMute) },
    ...{ class: "flex items-center justify-center w-10 h-10 bg-white rounded-md cursor-pointer text-2xl" },
});
if (__VLS_ctx.isMuted) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-red-500" },
    });
    const __VLS_18 = {}.Icon;
    /** @type {[typeof __VLS_components.Icon, ]} */ ;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({
        icon: "mdi:mute",
    }));
    const __VLS_20 = __VLS_19({
        icon: "mdi:mute",
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    const __VLS_22 = {}.Icon;
    /** @type {[typeof __VLS_components.Icon, ]} */ ;
    // @ts-ignore
    const __VLS_23 = __VLS_asFunctionalComponent(__VLS_22, new __VLS_22({
        icon: "mdi:volume-high",
    }));
    const __VLS_24 = __VLS_23({
        icon: "mdi:volume-high",
    }, ...__VLS_functionalComponentArgsRest(__VLS_23));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex justify-center row-span-2 flex-col bg-white rounded-md" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.increaseVolume) },
    ...{ class: "flex items-center justify-center w-10 h-10 cursor-pointer text-2xl" },
});
const __VLS_26 = {}.Icon;
/** @type {[typeof __VLS_components.Icon, ]} */ ;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
    icon: "mdi:plus",
}));
const __VLS_28 = __VLS_27({
    icon: "mdi:plus",
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.decreaseVolume) },
    ...{ class: "flex items-center justify-center w-10 h-10 cursor-pointer text-2xl" },
});
const __VLS_30 = {}.Icon;
/** @type {[typeof __VLS_components.Icon, ]} */ ;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent(__VLS_30, new __VLS_30({
    icon: "mdi:minus",
}));
const __VLS_32 = __VLS_31({
    icon: "mdi:minus",
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex justify-center row-span-2 flex-col bg-white rounded-md" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.changeChannelUp) },
    ...{ class: "flex items-center justify-center w-10 h-10 cursor-pointer text-2xl" },
});
const __VLS_34 = {}.Icon;
/** @type {[typeof __VLS_components.Icon, ]} */ ;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent(__VLS_34, new __VLS_34({
    icon: "mdi:chevron-up",
}));
const __VLS_36 = __VLS_35({
    icon: "mdi:chevron-up",
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.changeChannelDown) },
    ...{ class: "flex items-center justify-center w-10 h-10 cursor-pointer text-2xl" },
});
const __VLS_38 = {}.Icon;
/** @type {[typeof __VLS_components.Icon, ]} */ ;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent(__VLS_38, new __VLS_38({
    icon: "mdi:chevron-down",
}));
const __VLS_40 = __VLS_39({
    icon: "mdi:chevron-down",
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showInfoModal = true;
        } },
    ...{ class: "flex items-center justify-center w-10 h-10 bg-white rounded-md cursor-pointer text-2xl" },
});
const __VLS_42 = {}.Icon;
/** @type {[typeof __VLS_components.Icon, ]} */ ;
// @ts-ignore
const __VLS_43 = __VLS_asFunctionalComponent(__VLS_42, new __VLS_42({
    icon: "mdi:information-outline",
}));
const __VLS_44 = __VLS_43({
    icon: "mdi:information-outline",
}, ...__VLS_functionalComponentArgsRest(__VLS_43));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toggleFullscreen) },
    ...{ class: "flex items-center justify-center w-10 h-10 bg-white rounded-md cursor-pointer text-2xl" },
});
if (__VLS_ctx.isFullscreen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    const __VLS_46 = {}.Icon;
    /** @type {[typeof __VLS_components.Icon, ]} */ ;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({
        icon: "mdi:fullscreen-exit",
    }));
    const __VLS_48 = __VLS_47({
        icon: "mdi:fullscreen-exit",
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    const __VLS_50 = {}.Icon;
    /** @type {[typeof __VLS_components.Icon, ]} */ ;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent(__VLS_50, new __VLS_50({
        icon: "mdi:fullscreen",
    }));
    const __VLS_52 = __VLS_51({
        icon: "mdi:fullscreen",
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
}
/** @type {__VLS_StyleScopedClasses['w-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black/70']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-repeat']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-size=[200px]']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-8']} */ ;
/** @type {__VLS_StyleScopedClasses['left-8']} */ ;
/** @type {__VLS_StyleScopedClasses['z-20']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-40']} */ ;
/** @type {__VLS_StyleScopedClasses['left-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-x-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['z-20']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['self-start']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-15']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['underline']} */ ;
/** @type {__VLS_StyleScopedClasses['underline']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['italic']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-3']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-64']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-700/50']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-40']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['m-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-900/80']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['row-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['row-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Icon: Icon,
            ModalDialog: ModalDialog,
            staticNoiseUrl: staticNoiseUrl,
            VOLUME_BARS: VOLUME_BARS,
            videoPlayer: videoPlayer,
            isPlaying: isPlaying,
            isPlayerLoading: isPlayerLoading,
            isMuted: isMuted,
            volume: volume,
            showVolumeIndicator: showVolumeIndicator,
            isFullscreen: isFullscreen,
            IPTVChannels: IPTVChannels,
            currentChannelIndex: currentChannelIndex,
            currentChannelName: currentChannelName,
            showChannelNameIndicator: showChannelNameIndicator,
            showInfoModal: showInfoModal,
            showChannelListModal: showChannelListModal,
            channelSearchQuery: channelSearchQuery,
            totalChannels: totalChannels,
            filteredChannels: filteredChannels,
            togglePlayPause: togglePlayPause,
            toggleMute: toggleMute,
            increaseVolume: increaseVolume,
            decreaseVolume: decreaseVolume,
            changeChannelUp: changeChannelUp,
            changeChannelDown: changeChannelDown,
            toggleFullscreen: toggleFullscreen,
            handleChannelSelect: handleChannelSelect,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
