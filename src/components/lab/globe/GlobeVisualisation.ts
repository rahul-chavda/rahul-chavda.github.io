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
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class GlobeVisualisation {
  // Constants
  private readonly GLOBE_RADIUS = 5;
  private readonly GLOBE_SEGMENTS = 128;
  private readonly ROWS = 180;
  private readonly DOT_DENSITY = 15.0;
  private readonly WORLD_MAP_URL = '/resources/globe.png';

  private readonly BACKGROUND_COLOR = 0x06122e;
  private readonly AMBIENT_LIGHT_COLOR = 0x707070;
  private readonly GLOBE_COLOR = 0x226ff5;
  private readonly GLOW_COLOR = 0xc4daff;
  private readonly COLOR_WHITE = 0xffffff;
  private readonly DOT_COLOR = 0xffffff;

  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly renderer: WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly boundedOnWindowResize: () => void;
  private animationFrameId: number | null = null;

  // Canvas element
  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    if (!this.canvas) {
      throw new Error('Error with canvas');
    }

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
    this.renderer = new WebGLRenderer({canvas: this.canvas});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enableZoom = false;

    // bounded resize event handler
    this.boundedOnWindowResize = this.onWindowResize.bind(this);
  }

  public async init(): Promise<void> {
    await this.createGlobe();
    this.createGlowEffect();
    this.setLighting();

    window.addEventListener('resize', this.boundedOnWindowResize);
    this.animate();
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

  private async createGlobe(): Promise<void> {
    // GlobeComponent Geometry
    const globeGeometry = new SphereGeometry(this.GLOBE_RADIUS, this.GLOBE_SEGMENTS, this.GLOBE_SEGMENTS);

    // GlobeComponent Material
    const globeMaterial = new MeshPhysicalMaterial({
      color: this.GLOBE_COLOR,
      roughness: 0.7,
      metalness: 0.0,
    });

    const globe = new Mesh(globeGeometry, globeMaterial);
    this.scene.add(globe);
    await this.createLandMasses();
  }

  private createGlowEffect(): void {
    // Create a larger sphere for the glow effect
    const glowGeometry = new SphereGeometry(this.GLOBE_RADIUS + 1.2, this.GLOBE_SEGMENTS, this.GLOBE_SEGMENTS);

    // Custom shader material for the glow
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

    // Create a small circle geometry for each point
    const dotGeometry = new CircleGeometry(0.015);

    const DEG2RAD = Math.PI / 180;

    // Store dot metadata in an array
    const dotMetaData = [];
    for (let lat = -90; lat <= 90; lat += 180 / this.ROWS) {
      const radius = Math.cos(Math.abs(lat) * DEG2RAD) * this.GLOBE_RADIUS;
      const circumference = radius * Math.PI * 2;
      const dotsForLat = Math.ceil(circumference * this.DOT_DENSITY);

      for (let x = 0; x < dotsForLat; x++) {
        const long = -180 + x * 360 / dotsForLat;
        if (this.visibilityForCoordinate(worldMapData, long, lat)) {
          // Convert lat/long to 3D position
          const phi = (90 - lat) * DEG2RAD;
          const theta = (long + 180) * DEG2RAD;

          // Calculate position on a sphere
          const x = -this.GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
          const y = this.GLOBE_RADIUS * Math.cos(phi);
          const z = this.GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);

          dotMetaData.push([x, y, z]);
        }
      }
    }

    // Create the material for points
    const dotMaterial = new MeshStandardMaterial({
      color: this.DOT_COLOR,
      roughness: 0.6,
      metalness: 0.3,
      side: DoubleSide
    });

    // Create the instanced mesh
    const instancedMesh = new InstancedMesh(dotGeometry, dotMaterial, dotMetaData.length);
    instancedMesh.instanceMatrix.setUsage(35048); // THREE.DynamicDrawUsage

    // Position each instance
    const dummy = new Object3D();
    let instanceIndex = 0;

    for (const dotMetaDataItem of dotMetaData) {
      const [x, y, z] = dotMetaDataItem;
      dummy.position.set(x, y, z);
      // Make the instance "look" outward from the center
      dummy.lookAt(0, 0, 0);
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(instanceIndex, dummy.matrix);
      instanceIndex++;
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedMesh);
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
      // Use your world map silhouette image
      img.src = this.WORLD_MAP_URL;
    });
  }

  private visibilityForCoordinate(imageData: ImageData, long: number, lat: number): boolean {
    // Convert longitude and latitude to image coordinates
    const width = imageData.width;
    const height = imageData.height;

    // Map from -180..180 to 0..width
    const x = Math.floor(((long + 180) / 360) * width);
    // Map from -90..90 to height..0 (invert Y)
    const y = Math.floor((1 - ((lat + 90) / 180)) * height);

    // Get the pixel data (RGBA)
    const index = (y * width + x) * 4;
    const alpha = imageData.data[index + 3]; // Alpha channel

    // Return true if the pixel is not transparent (land)
    return alpha >= 90; // Threshold value
  }

  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', this.boundedOnWindowResize);
    this.controls.dispose();
    this.scene.clear();
    this.renderer.dispose();
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
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
