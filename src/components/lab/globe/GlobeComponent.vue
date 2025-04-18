<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive } from 'vue';
import { type Ref } from 'vue';
import { GlobeVisualisation } from "./GlobeVisualisation.ts";
import { Wonders } from "@components/lab/globe/Wonders.ts";
import type { Wonder } from "@components/lab/globe/Wonders.ts";
import ModalDialog from "@components/lab/ui/ModalDialog.vue";

const sceneCanvas: Ref<HTMLCanvasElement | null> = ref(null);

let globeVisualisation: GlobeVisualisation;

const wonderInfo = reactive({
  isVisible: false,
  currentWonder: null as Wonder | null
});

const showWonderDetails = (wonder: Wonder) => {
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

const formatCoordinates = (lat: number, lon: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';

  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
};


onMounted(() => {
  globeVisualisation = new GlobeVisualisation(sceneCanvas.value!, Wonders);
  globeVisualisation.init();

  globeVisualisation.onWonderSelected = showWonderDetails;
  globeVisualisation.onWonderDeselected = hideWonderDetails;
});

onBeforeUnmount(() => {
  globeVisualisation.dispose();
});

</script>

<template>
  <div class="relative w-full h-full">
    <canvas ref="sceneCanvas" class="w-full h-full"></canvas>

    <div class="absolute bottom-0 right-0 text-white text-xs p-4 flex items-center gap-2">
      <slot name="icon-info" />
      Click marker for more info.
    </div>
    <ModalDialog v-model="wonderInfo.isVisible" :max-width="'md'" :theme="'dark'">
      <template #header>
        <h2 class="text-xl font-bold text-white mb-2">
          {{ wonderInfo.currentWonder?.name }}
        </h2>
      </template>

      <template #body>
        <div class="pt-2">
          <p class="text-gray-200 text-sm mb-3">
            {{ wonderInfo.currentWonder?.description }}
          </p>
        </div>
      </template>

      <template #footer>
        <div v-if="wonderInfo.isVisible && wonderInfo.currentWonder"
             class="flex items-center justify-between text-gray-300">
            <span class="text-sm py-1 px-2 rounded-full inline-block bg-gray-800/50">
              {{ formatCoordinates(wonderInfo.currentWonder.latitude, wonderInfo.currentWonder.longitude) }}
            </span>
          <a :href="'https://www.openstreetmap.org/?#map=16/'+wonderInfo.currentWonder.latitude+'/'+wonderInfo.currentWonder.longitude"
             target="_blank" class="text-2xl text-blue-600">
            <slot name="icon-location"/>
          </a>
        </div>
      </template>
    </ModalDialog>
  </div>
</template>
