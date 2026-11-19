/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, ref, watch } from 'vue';
const props = withDefaults(defineProps(), {
    title: '',
    maxWidth: 'md',
    closeOnClickOutside: true,
    hideCloseButton: false,
    theme: 'light'
});
const emit = defineEmits(['update:modelValue', 'close']);
const isVisible = ref(props.modelValue);
const closeModal = () => {
    emit('update:modelValue', false);
    emit('close');
};
const handleBackdropClick = (event) => {
    if (props.closeOnClickOutside && event.target === event.currentTarget) {
        closeModal();
    }
};
watch(() => props.modelValue, (newValue) => {
    isVisible.value = newValue;
});
const modalClasses = computed(() => {
    const themeClasses = props.theme === 'light'
        ? 'bg-white/95 text-gray-800 border-gray-200'
        : 'bg-gray-900/80 text-white border-gray-700';
    const widthClass = {
        'max-w-sm': props.maxWidth === 'sm',
        'max-w-md': props.maxWidth === 'md',
        'max-w-lg': props.maxWidth === 'lg',
        'max-w-xl': props.maxWidth === 'xl',
        'max-w-2xl': props.maxWidth === '2xl',
    };
    return [themeClasses, widthClass];
});
const backdropClass = computed(() => props.theme === 'light' ? 'bg-gray-500/50' : 'bg-black/50');
const borderClass = computed(() => props.theme === 'light' ? 'border-gray-200' : 'border-gray-700');
const closeButtonClass = computed(() => props.theme === 'light'
    ? 'text-gray-600 hover:text-gray-800'
    : 'text-gray-400 hover:text-white');
const titleClass = computed(() => props.theme === 'light' ? 'text-gray-800' : 'text-white');
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    title: '',
    maxWidth: 'md',
    closeOnClickOutside: true,
    hideCloseButton: false,
    theme: 'light'
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    enterActiveClass: "transition duration-300 ease-out",
    enterFromClass: "opacity-0",
    enterToClass: "opacity-100",
    leaveActiveClass: "transition duration-200 ease-in",
    leaveFromClass: "opacity-100",
    leaveToClass: "opacity-0",
}));
const __VLS_2 = __VLS_1({
    enterActiveClass: "transition duration-300 ease-out",
    enterFromClass: "opacity-0",
    enterToClass: "opacity-100",
    leaveActiveClass: "transition duration-200 ease-in",
    leaveFromClass: "opacity-100",
    leaveToClass: "opacity-0",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
if (__VLS_ctx.modelValue) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.handleBackdropClick) },
        ...{ class: (['fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm', __VLS_ctx.backdropClass]) },
    });
    const __VLS_4 = {}.transition;
    /** @type {[typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        enterActiveClass: "transition duration-300 ease-out",
        enterFromClass: "transform scale-95 opacity-0",
        enterToClass: "transform scale-100 opacity-100",
        leaveActiveClass: "transition duration-200 ease-in",
        leaveFromClass: "transform scale-100 opacity-100",
        leaveToClass: "transform scale-95 opacity-0",
    }));
    const __VLS_6 = __VLS_5({
        enterActiveClass: "transition duration-300 ease-out",
        enterFromClass: "transform scale-95 opacity-0",
        enterToClass: "transform scale-100 opacity-100",
        leaveActiveClass: "transition duration-200 ease-in",
        leaveFromClass: "transform scale-100 opacity-100",
        leaveToClass: "transform scale-95 opacity-0",
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_7.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: () => { } },
        ...{ class: ([__VLS_ctx.modalClasses, 'p-5 rounded-lg backdrop-blur-md shadow-lg border w-full mx-4']) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between items-center mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-1" },
    });
    if (__VLS_ctx.title) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            ...{ class: (['text-xl font-bold', __VLS_ctx.titleClass]) },
        });
        (__VLS_ctx.title);
    }
    else {
        var __VLS_8 = {};
    }
    if (!__VLS_ctx.hideCloseButton) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.closeModal) },
            ...{ class: (['text-xl font-bold ml-4 cursor-pointer', __VLS_ctx.closeButtonClass]) },
            'aria-label': "Close modal",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-content" },
    });
    var __VLS_10 = {};
    if (__VLS_ctx.$slots.footer) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: (['mt-4 pt-3 border-t', __VLS_ctx.borderClass]) },
        });
        var __VLS_12 = {};
    }
    var __VLS_7;
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
// @ts-ignore
var __VLS_9 = __VLS_8, __VLS_11 = __VLS_10, __VLS_13 = __VLS_12;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            closeModal: closeModal,
            handleBackdropClick: handleBackdropClick,
            modalClasses: modalClasses,
            backdropClass: backdropClass,
            borderClass: borderClass,
            closeButtonClass: closeButtonClass,
            titleClass: titleClass,
        };
    },
    emits: {},
    __typeProps: {},
    props: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    __typeProps: {},
    props: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
