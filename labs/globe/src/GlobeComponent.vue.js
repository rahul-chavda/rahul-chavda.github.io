import { ref, onMounted, onBeforeUnmount, reactive } from 'vue';
import { GlobeVisualisation } from "./GlobeVisualisation.ts";
import { Wonders } from "./Wonders.ts";
import ModalDialog from "./ModalDialog.vue";
import { Icon } from '@iconify/vue';
const sceneCanvas = ref(null);
let globeVisualisation;
const wonderInfo = reactive({
    isVisible: false,
    currentWonder: null
});
const showWonderDetails = (wonder) => {
    wonderInfo.currentWonder = wonder;
    wonderInfo.isVisible = true;
};
const hideWonderDetails = () => {
    wonderInfo.isVisible = false;
    setTimeout(() => {
        if (!wonderInfo.isVisible) {
            wonderInfo.currentWonder = null;
        }
    }, 300);
};
const formatCoordinates = (lat, lon) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
};
onMounted(() => {
    globeVisualisation = new GlobeVisualisation(sceneCanvas.value, Wonders);
    globeVisualisation.init();
    globeVisualisation.onWonderSelected = showWonderDetails;
    globeVisualisation.onWonderDeselected = hideWonderDetails;
});
onBeforeUnmount(() => {
    globeVisualisation.dispose();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative w-full h-full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.canvas, __VLS_intrinsicElements.canvas)({
    ref: "sceneCanvas",
    ...{ class: "w-full h-full" },
});
/** @type {typeof __VLS_ctx.sceneCanvas} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "absolute bottom-0 right-0 text-white text-xs p-4 flex items-center gap-2" },
});
const __VLS_0 = {}.Icon;
/** @type {[typeof __VLS_components.Icon, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    icon: "mdi:info",
    ...{ class: "text-xl" },
}));
const __VLS_2 = __VLS_1({
    icon: "mdi:info",
    ...{ class: "text-xl" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {[typeof ModalDialog, typeof ModalDialog, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(ModalDialog, new ModalDialog({
    modelValue: (__VLS_ctx.wonderInfo.isVisible),
    maxWidth: ('md'),
    theme: ('dark'),
}));
const __VLS_5 = __VLS_4({
    modelValue: (__VLS_ctx.wonderInfo.isVisible),
    maxWidth: ('md'),
    theme: ('dark'),
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
__VLS_6.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_6.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "text-xl font-bold text-white mb-2" },
    });
    (__VLS_ctx.wonderInfo.currentWonder?.name);
}
{
    const { body: __VLS_thisSlot } = __VLS_6.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "pt-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-gray-200 text-sm mb-3" },
    });
    (__VLS_ctx.wonderInfo.currentWonder?.description);
}
{
    const { footer: __VLS_thisSlot } = __VLS_6.slots;
    if (__VLS_ctx.wonderInfo.isVisible && __VLS_ctx.wonderInfo.currentWonder) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-between text-gray-300" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-sm py-1 px-2 rounded-full inline-block bg-gray-800/50" },
        });
        (__VLS_ctx.formatCoordinates(__VLS_ctx.wonderInfo.currentWonder.latitude, __VLS_ctx.wonderInfo.currentWonder.longitude));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            href: ('https://www.openstreetmap.org/?#map=16/' + __VLS_ctx.wonderInfo.currentWonder.latitude + '/' + __VLS_ctx.wonderInfo.currentWonder.longitude),
            target: "_blank",
            ...{ class: "text-2xl text-blue-600" },
        });
        const __VLS_7 = {}.Icon;
        /** @type {[typeof __VLS_components.Icon, ]} */ ;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
            icon: "mdi:directions",
            ...{ class: "text-xl" },
        }));
        const __VLS_9 = __VLS_8({
            icon: "mdi:directions",
            ...{ class: "text-xl" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    }
}
var __VLS_6;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-800/50']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['text-blue-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ModalDialog: ModalDialog,
            Icon: Icon,
            sceneCanvas: sceneCanvas,
            wonderInfo: wonderInfo,
            formatCoordinates: formatCoordinates,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
