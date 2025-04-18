import {
  AmbientLight,
  BackSide,
  CircleGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  InstancedMesh,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  WebGLRenderer,
  Vector3,
  MathUtils,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { Raycaster, Vector2 } from "three";
import type { Wonder } from "@components/lab/globe/Wonders.ts";

export class GlobeVisualisation {
  // Constants
  private readonly GLOBE_RADIUS = 5;
  private readonly GLOBE_SEGMENTS = 64;
  private readonly ROWS = 180;
  private readonly DOT_DENSITY = 15.0;
  private readonly WORLD_MAP_URL = '/resources/globe.png';

  private readonly BACKGROUND_COLOR = 0x06122e;
  private readonly AMBIENT_LIGHT_COLOR = 0x707070;
  private readonly GLOBE_COLOR = 0x226ff5;
  private readonly GLOW_COLOR = 0xc4daff;
  private readonly COLOR_WHITE = 0xffffff;
  private readonly WONDER_MARKER_COLOR = 0xff0000; // Red color for wonder markers

  private readonly WONDERS: Wonder[] = [];
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly renderer: WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly boundedOnWindowResize: () => void;
  private animationFrameId: number | null = null;

  // Canvas element
  private readonly canvas: HTMLCanvasElement;

  // Interaction state
  private isDragging = false;
  private dotsMesh: InstancedMesh | null = null;
  private animationTime = 0;
  private dotOriginalPositions: Float32Array | null = null;
  private dotAnimationParams: { frequency: number, baseDistance: number }[] = []; // Store animation parameters for each dot
  private wonderMarkers: Mesh[] = [];
  private boundedHandlers: {
    onMouseDown: () => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
  };

  private readonly raycaster: Raycaster;
  private readonly mouse: Vector2;

  public onWonderSelected: ((wonder: Wonder) => void) | null = null;
  public onWonderDeselected: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, wonders: Wonder[]) {
    this.canvas = canvas;
    if (!this.canvas) {
      throw new Error('Error with canvas');
    }

    this.WONDERS = wonders;

    this.raycaster = new Raycaster();
    this.mouse = new Vector2();

    const width = window.innerWidth;
    const height = window.innerHeight;

    // scene
    this.scene = new Scene();
    this.scene.background = new Color(this.BACKGROUND_COLOR);

    // camera
    this.camera = new PerspectiveCamera(75, width / height, 0.5, 1000);
    this.camera.position.set(2.5, 3.5, width < 640 ? -15 : -10);
    this.scene.add(this.camera);

    // renderer
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      precision: 'mediump',
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enableZoom = false;

    // bounded resize event handler
    this.boundedOnWindowResize = this.onWindowResize.bind(this);

    // bounded interaction handlers
    this.boundedHandlers = {
      onMouseDown: this.onMouseDown.bind(this),
      onMouseUp: this.onMouseUp.bind(this),
      onMouseLeave: this.onMouseLeave.bind(this),
    };
  }

  public async init(): Promise<void> {
    this.createGlobe();
    await this.createLandMasses();
    this.createGlowEffect();
    this.setLighting();
    this.createWonderMarkers();

    this.canvas.addEventListener('mousedown', this.boundedHandlers.onMouseDown);
    this.canvas.addEventListener('mouseup', this.boundedHandlers.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.boundedHandlers.onMouseLeave);
    this.canvas.addEventListener('click', this.onCanvasClick.bind(this)); // Add click handler

    this.canvas.addEventListener('touchstart', this.boundedHandlers.onMouseDown);
    this.canvas.addEventListener('touchend', this.boundedHandlers.onMouseUp);
    this.canvas.addEventListener('touchcancel', this.boundedHandlers.onMouseLeave);
    this.canvas.addEventListener('touchend', this.onCanvasTouchEnd.bind(this)); // Add touch handler

    window.addEventListener('resize', this.boundedOnWindowResize);
    this.animate();
  }

  private createWonderMarkers(): void {
    const markerGeometry = new CircleGeometry(0.05, 8);
    const markerMaterial = new MeshStandardMaterial({
      color: this.WONDER_MARKER_COLOR,
      emissive: this.WONDER_MARKER_COLOR,
      emissiveIntensity: 0.5,
      side: DoubleSide
    });

    const DEG2RAD = Math.PI / 180;

    this.WONDERS.forEach(wonder => {
      const lat = wonder.latitude;
      const long = wonder.longitude;

      const phi = (90 - lat) * DEG2RAD;
      const theta = (long + 180) * DEG2RAD;

      const x = -this.GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
      const y = this.GLOBE_RADIUS * Math.cos(phi);
      const z = this.GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);

      const marker = new Mesh(markerGeometry, markerMaterial);
      marker.position.set(x, y, z);

      const direction = new Vector3(x, y, z).normalize();

      marker.position.x += direction.x * 0.03;
      marker.position.y += direction.y * 0.03;
      marker.position.z += direction.z * 0.03;

      marker.lookAt(0, 0, 0);
      marker.rotateY(Math.PI);

      marker.userData = {wonder};

      this.scene.add(marker);
      this.wonderMarkers.push(marker);
    });
  }

  private onMouseDown(): void {
    this.isDragging = true;
    this.animationTime = 0;
    this.animateDotsHover(true);
  }

  private onMouseUp(): void {
    if (this.isDragging) {
      this.animateDotsHover(false);
      this.isDragging = false;
    }
  }

  private onMouseLeave(): void {
    if (this.isDragging) {
      this.animateDotsHover(false);
      this.isDragging = false;
    }
  }

  private animateDotsHover(hover: boolean): void {
    if (!this.dotsMesh || !this.dotOriginalPositions) return;

    const dummy = new Object3D();

    for (let i = 0; i < this.dotsMesh.count; i++) {
      const idx = i * 3;
      const x = this.dotOriginalPositions[idx];
      const y = this.dotOriginalPositions[idx + 1];
      const z = this.dotOriginalPositions[idx + 2];

      if (hover) {
        const dir = new Vector3(x, y, z).normalize();
        const {frequency, baseDistance} = this.dotAnimationParams[i];
        const oscillation = (1 - Math.cos(this.animationTime * frequency)) * 0.3;
        const currentDistance = baseDistance * oscillation;

        dummy.position.set(
          x + dir.x * currentDistance,
          y + dir.y * currentDistance,
          z + dir.z * currentDistance
        );
      } else {
        dummy.position.set(x, y, z);
      }

      dummy.lookAt(0, 0, 0);
      dummy.updateMatrix();
      this.dotsMesh.setMatrixAt(i, dummy.matrix);
    }

    this.dotsMesh.instanceMatrix.needsUpdate = true;

    if (!hover) {
      this.animationTime = 0;
    }
  }

  private setLighting(): void {
    const ambientLight = new AmbientLight(this.AMBIENT_LIGHT_COLOR);
    this.scene.add(ambientLight);

    const directionalLight1 = new DirectionalLight(this.COLOR_WHITE, 1);
    directionalLight1.position.set(25, 30, 10);
    this.camera.add(directionalLight1);

    const directionalLight2 = new DirectionalLight(this.COLOR_WHITE, 1);
    directionalLight2.position.set(20, 25, 10);
    this.camera.add(directionalLight2);
  }

  private createGlobe(): void {
    const globeGeometry = new SphereGeometry(this.GLOBE_RADIUS, this.GLOBE_SEGMENTS, this.GLOBE_SEGMENTS);

    const globeMaterial = new MeshPhysicalMaterial({
      color: this.GLOBE_COLOR,
      roughness: 0.7,
      metalness: 0.0,
    });

    const globe = new Mesh(globeGeometry, globeMaterial);
    this.scene.add(globe);
  }

  private createGlowEffect(): void {
    const glowGeometry = new SphereGeometry(this.GLOBE_RADIUS + 1.2, this.GLOBE_SEGMENTS, this.GLOBE_SEGMENTS);

    const glowMaterial = new ShaderMaterial({
      uniforms: {
        "c": {value: 0.2},
        "p": {value: 2.5},
        glowColor: {value: new Color(this.GLOW_COLOR)},
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float c;
        uniform float p;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(c - dot(vNormal, vec3(-0.1, -0.1, 1.0)), p);
          gl_FragColor = vec4(glowColor, intensity);
        }
      `,
      side: BackSide,
      blending: 2,
      transparent: true
    });

    const glowMesh = new Mesh(glowGeometry, glowMaterial);
    this.scene.add(glowMesh);
  }

  private async createLandMasses(): Promise<void> {
    const worldMapData = await this.loadWorldMap();

    const dotGeometry = new CircleGeometry(0.015, 8);

    const DEG2RAD = Math.PI / 180;

    const dotMetaData = [];
    for (let lat = -90; lat <= 90; lat += 180 / this.ROWS) {
      const radius = Math.cos(Math.abs(lat) * DEG2RAD) * this.GLOBE_RADIUS;
      const circumference = radius * Math.PI * 2;
      const dotsForLat = Math.ceil(circumference * this.DOT_DENSITY);

      for (let x = 0; x < dotsForLat; x++) {
        const long = -180 + x * 360 / dotsForLat;
        if (this.visibilityForCoordinate(worldMapData, long, lat)) {
          const phi = (90 - lat) * DEG2RAD;
          const theta = (long + 180) * DEG2RAD;

          const x = -this.GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
          const y = this.GLOBE_RADIUS * Math.cos(phi);
          const z = this.GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);

          dotMetaData.push([x, y, z]);
        }
      }
    }

    const dotMaterial = new MeshStandardMaterial({
      colorWrite: true,
      side: DoubleSide
    });

    this.dotsMesh = new InstancedMesh(dotGeometry, dotMaterial, dotMetaData.length);

    this.dotOriginalPositions = new Float32Array(dotMetaData.length * 3);

    const dummy = new Object3D();

    for (let i = 0; i < this.dotsMesh.count; i++) {
      const [x, y, z] = dotMetaData[i];

      const idx = i * 3;
      this.dotOriginalPositions[idx] = x;
      this.dotOriginalPositions[idx + 1] = y;
      this.dotOriginalPositions[idx + 2] = z;

      dummy.position.set(x, y, z);
      dummy.lookAt(0, 0, 0);
      dummy.updateMatrix();

      this.dotsMesh.setMatrixAt(i, dummy.matrix);

      this.dotAnimationParams.push({
        frequency: MathUtils.randFloat(0.5, 1.0),
        baseDistance: MathUtils.randFloat(0.1, 0.3),
      });
    }

    this.dotsMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.dotsMesh);
  }

  private loadWorldMap(): Promise<ImageData> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = img.width;
        const height = img.height;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        resolve(imageData);
      };
      img.src = this.WORLD_MAP_URL;
    });
  }

  private visibilityForCoordinate(imageData: ImageData, long: number, lat: number): boolean {
    const width = imageData.width;
    const height = imageData.height;

    const x = Math.floor(((long + 180) / 360) * width);
    const y = Math.floor((1 - ((lat + 90) / 180)) * height);

    const index = (y * width + x) * 4;
    const alpha = imageData.data[index + 3];

    return alpha >= 90;
  }


  private showWonderDetails(wonder: Wonder): void {
    if (this.onWonderSelected) {
      this.onWonderSelected(wonder);
    }
  }

  private hideWonderDetails(): void {
    if (this.onWonderDeselected) {
      this.onWonderDeselected();
    }
  }

  private onCanvasClick(event: MouseEvent): void {
    if (this.isDragging) return;

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.checkMarkerIntersection();
  }

  private onCanvasTouchEnd(event: TouchEvent): void {
    if (this.isDragging) return;

    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

      this.checkMarkerIntersection();
    }
  }

  private checkMarkerIntersection(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.wonderMarkers);

    if (intersects.length > 0) {
      const marker = intersects[0].object;
      const wonder = marker.userData.wonder as Wonder;

      this.showWonderDetails(wonder);
    } else {
      this.hideWonderDetails();
    }
  }

  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Remove event listeners
    this.canvas.removeEventListener('mousedown', this.boundedHandlers.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.boundedHandlers.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.boundedHandlers.onMouseLeave);
    this.canvas.removeEventListener('click', this.onCanvasClick.bind(this));

    // Remove touch event listeners
    this.canvas.removeEventListener('touchstart', this.boundedHandlers.onMouseDown);
    this.canvas.removeEventListener('touchend', this.boundedHandlers.onMouseUp);
    this.canvas.removeEventListener('touchcancel', this.boundedHandlers.onMouseLeave);
    this.canvas.removeEventListener('touchend', this.onCanvasTouchEnd.bind(this));

    window.removeEventListener('resize', this.boundedOnWindowResize);

    this.controls.dispose();
    this.scene.clear();
    this.renderer.dispose();
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    this.wonderMarkers.forEach(marker => {
      const pulseFactor = 1 + Math.sin(Date.now() * 0.003) * 0.1;
      marker.scale.set(pulseFactor, pulseFactor, pulseFactor);
    });

    if (this.isDragging) {
      this.animationTime += 0.02;
      this.animateDotsHover(true);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize = (): void => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    this.camera.aspect = newWidth / newHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(newWidth, newHeight);
  }
}
