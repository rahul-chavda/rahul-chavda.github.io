import { createApp, type App } from 'vue';
import './style.css';
import IPTVComponent from './IPTVComponent.vue';

// Track mounted Vue apps for cleanup during Astro page transitions
const mountedApps = new Map<HTMLElement, App>();

function mountIPTVLabs() {
  const containers = document.querySelectorAll<HTMLElement>('[data-lab-root="iptv"]');
  
  containers.forEach((container) => {
    if (mountedApps.has(container)) return;

    let props = {};
    if (container.dataset.props) {
      try {
        props = JSON.parse(container.dataset.props);
      } catch (e) {
        console.error('Failed to parse IPTV lab props:', e);
      }
    }

    const app = createApp(IPTVComponent, props);
    app.mount(container);
    mountedApps.set(container, app);
  });
}

function unmountIPTVLabs() {
  mountedApps.forEach((app) => {
    app.unmount();
  });
  mountedApps.clear();
}

// Astro ClientRouter (View Transitions) Lifecycle Hooks
document.addEventListener('astro:page-load', mountIPTVLabs);
document.addEventListener('astro:before-swap', unmountIPTVLabs);

// Initial execution fallback for non-Astro standalone dev
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountIPTVLabs);
} else {
  mountIPTVLabs();
}
