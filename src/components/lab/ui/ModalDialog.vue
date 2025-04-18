<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  maxWidth?: string;
  closeOnClickOutside?: boolean;
  hideCloseButton?: boolean;
  theme?: 'light' | 'dark';
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  maxWidth: 'md',
  closeOnClickOutside: true,
  hideCloseButton: false,
  theme: 'light'
});

const emit = defineEmits(['update:modelValue', 'close']);

const isVisible: Ref<boolean> = ref(props.modelValue);

const closeModal = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleBackdropClick = (event: MouseEvent) => {
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

const backdropClass = computed(() =>
    props.theme === 'light' ? 'bg-gray-500/50' : 'bg-black/50'
);

const borderClass = computed(() =>
    props.theme === 'light' ? 'border-gray-200' : 'border-gray-700'
);

const closeButtonClass = computed(() =>
    props.theme === 'light'
        ? 'text-gray-600 hover:text-gray-800'
        : 'text-gray-400 hover:text-white'
);

const titleClass = computed(() =>
    props.theme === 'light' ? 'text-gray-800' : 'text-white'
);
</script>

<template>
  <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
  >
    <div v-if="modelValue"
         :class="['fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm', backdropClass]"
         @click="handleBackdropClick">
      <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
      >
        <div :class="[ modalClasses, 'p-5 rounded-lg backdrop-blur-md shadow-lg border w-full mx-4']"
             @click.stop>
          <div class="flex justify-between items-center mb-4">
            <div class="flex-1">
              <h2 v-if="title" :class="['text-xl font-bold', titleClass]">{{ title }}</h2>
              <slot v-else name="header"></slot>
            </div>

            <button v-if="!hideCloseButton"
                    :class="['text-xl font-bold ml-4', closeButtonClass]"
                    @click="closeModal"
                    aria-label="Close modal">
              ×
            </button>
          </div>

          <div class="modal-content">
            <slot name="body"></slot>
          </div>

          <div v-if="$slots.footer" :class="['mt-4 pt-3 border-t', borderClass]">
            <slot name="footer"></slot>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>
