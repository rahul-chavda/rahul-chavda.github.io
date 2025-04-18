<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { type Ref } from 'vue';
import { GlobeVisualisation } from "./GlobeVisualisation.ts";

const sceneCanvas: Ref<HTMLCanvasElement | null> = ref(null);

let globeVisualisation: GlobeVisualisation;

onMounted(() => {
  globeVisualisation = new GlobeVisualisation(sceneCanvas.value!);
  globeVisualisation.init();
});

onBeforeUnmount(() => {
  globeVisualisation.dispose();
});

</script>

<template>
  <canvas ref="sceneCanvas"></canvas>
</template>
