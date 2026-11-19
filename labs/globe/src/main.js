import { createApp } from 'vue';
import './style.css';
import GlobeComponent from './GlobeComponent.vue';
// Track mounted Vue apps for cleanup during Astro page transitions
const mountedApps = new Map();
function mountGlobeLabs() {
    const containers = document.querySelectorAll('[data-lab-root="globe"]');
    containers.forEach((container) => {
        if (mountedApps.has(container))
            return;
        let props = {};
        if (container.dataset.props) {
            try {
                props = JSON.parse(container.dataset.props);
            }
            catch (e) {
                console.error('Failed to parse Globe lab props:', e);
            }
        }
        const app = createApp(GlobeComponent, props);
        app.mount(container);
        mountedApps.set(container, app);
    });
}
function unmountGlobeLabs() {
    mountedApps.forEach((app) => {
        app.unmount();
    });
    mountedApps.clear();
}
// Astro ClientRouter (View Transitions) Lifecycle Hooks
document.addEventListener('astro:page-load', mountGlobeLabs);
document.addEventListener('astro:before-swap', unmountGlobeLabs);
// Initial execution fallback for non-Astro standalone dev
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountGlobeLabs);
}
else {
    mountGlobeLabs();
}
