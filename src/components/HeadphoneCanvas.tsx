import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ASSEMBLY_PARTS,
  FINISHES,
  FinishId,
  SECTION_STAGE_ORDER,
  computeAssemblyStateAtScroll,
  computeSectionDriven3DJourney,
} from '../data/productData';

export interface PersistentSceneControlRef {
  globalScrollProgress: number;
  activeStageIndex: number;
  stageLocalProgress: number;
  nextStageIndex: number;
  transitionBlend: number;
  assemblyOverrideProgress: number | null;
  manualPartIndex: number | null;
  soundPulseAmplitude: number;
  dragDeltaX: number;
  dragDeltaY: number;
  pointerNormX: number;
  pointerNormY: number;
}

interface HeadphoneCanvasProps {
  finishId: FinishId;
  sceneControlRef: React.MutableRefObject<PersistentSceneControlRef>;
  currentStageLabel?: string;
  onReady?: () => void;
}

function createKnurledBumpTexture(isHeadless: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = isHeadless ? 64 : 256;
  canvas.height = isHeadless ? 32 : 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const stripes = isHeadless ? 24 : 48;
    const stripeWidth = canvas.width / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#202020';
      ctx.fillRect(i * stripeWidth, 0, stripeWidth * 0.55, canvas.height);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createBaffleGrilleTexture(isHeadless: boolean): THREE.CanvasTexture {
  const size = isHeadless ? 64 : 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#181818';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#050505';
    const step = isHeadless ? 8 : 12;
    for (let y = step / 2; y < size; y += step) {
      for (let x = step / 2; x < size; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, step * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.05,
      size / 2,
      size / 2,
      size * 0.48
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const HeadphoneCanvas: React.FC<HeadphoneCanvasProps> = ({
  finishId,
  sceneControlRef,
  currentStageLabel = 'HERO',
  onReady,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady, setWebglReady] = useState(true);

  const finishRef = useRef<FinishId>(finishId);
  const finishNudgeRef = useRef<number>(0);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const hasNotifiedReadyRef = useRef(false);

  useEffect(() => {
    if (finishRef.current !== finishId) {
      finishRef.current = finishId;
      finishNudgeRef.current = 1.0;
    }
  }, [finishId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl && !isMobile,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglReady(false);
      if (!hasNotifiedReadyRef.current) {
        hasNotifiedReadyRef.current = true;
        onReadyRef.current?.();
      }
      return;
    }

    const width = Math.max(window.innerWidth, 280);
    const height = Math.max(window.innerHeight, 280);
    renderer.setPixelRatio(
      isSoftwareGl ? 1.0 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = !isSoftwareGl && !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.pointerEvents = 'none';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();

    let envTexture: THREE.Texture | null = null;
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      envTexture = pmremGenerator.fromScene(
        new RoomEnvironment(),
        0.04
      ).texture;
      scene.environment = envTexture;
      pmremGenerator.dispose();
    } catch {
      // Fallback to direct studio lights
    }

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.15, 45);
    camera.position.set(0, 0, 5.0);

    // Studio Lighting Rig + Signal Orange (#FF4D00) Rim Light
    const ambientLight = new THREE.AmbientLight(0xece7df, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(
      0xfffbf4,
      isSoftwareGl ? 3.2 : 2.6
    );
    keyLight.position.set(4.5, 6.0, 5.0);
    if (!isSoftwareGl && !isMobile) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 15;
      const d = 2.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xc8d4e3, 1.35);
    fillLight.position.set(-5.0, 1.5, 3.5);
    scene.add(fillLight);

    // Signal Orange Rim Light (#FF4D00) from back-right
    const orangeRimLight = new THREE.SpotLight(
      0xff4d00,
      5.8,
      14,
      Math.PI / 3,
      0.65,
      1.5
    );
    orangeRimLight.position.set(3.2, 1.8, -3.4);
    scene.add(orangeRimLight);

    const orangeRimSub = new THREE.PointLight(0xff4d00, 2.4, 8);
    orangeRimSub.position.set(-2.4, -1.6, -2.2);
    scene.add(orangeRimSub);

    const knurlTex = createKnurledBumpTexture(isSoftwareGl);
    const baffleTex = createBaffleGrilleTexture(isSoftwareGl);
    const shadowTex = createContactShadowTexture();

    const initialFinish = FINISHES[finishRef.current];

    const cupMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(initialFinish.cupHex),
      roughness: initialFinish.cupRoughness,
      metalness: initialFinish.cupMetalness,
      clearcoat: 0.28,
      clearcoatRoughness: 0.32,
      envMapIntensity: 1.45,
    });

    const cushionMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialFinish.cushionHex),
      roughness: initialFinish.cushionRoughness,
      metalness: 0.06,
      envMapIntensity: 0.7,
    });

    const yokeMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(initialFinish.yokeHex),
      roughness: initialFinish.yokeRoughness,
      metalness: initialFinish.yokeMetalness,
      anisotropy: 0.65,
      envMapIntensity: 1.55,
    });

    const dialAccentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialFinish.dialAccentHex),
      roughness: 0.28,
      metalness: 0.2,
      emissive: new THREE.Color(initialFinish.dialAccentHex),
      emissiveIntensity: 0.28,
    });

    const brushedSteelMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4d4d0,
      roughness: 0.22,
      metalness: 0.94,
      anisotropy: 0.8,
      bumpMap: knurlTex,
      bumpScale: 0.015,
    });

    const springSteelMat = new THREE.MeshStandardMaterial({
      color: 0x242426,
      roughness: 0.38,
      metalness: 0.82,
    });

    const headbandSiliconeMat = new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 0.85,
      metalness: 0.08,
    });

    const biocelluloseMat = new THREE.MeshPhysicalMaterial({
      color: 0xece7df,
      roughness: 0.28,
      metalness: 0.14,
      clearcoat: 0.45,
      emissive: new THREE.Color(0xff4d00),
      emissiveIntensity: 0.08,
    });

    const copperCoilMat = new THREE.MeshStandardMaterial({
      color: 0xe56b1f,
      roughness: 0.22,
      metalness: 0.92,
      emissive: new THREE.Color(0xff4d00),
      emissiveIntensity: 0.18,
    });

    const goldPinMat = new THREE.MeshStandardMaterial({
      color: 0xf5b82e,
      roughness: 0.16,
      metalness: 0.98,
    });

    const pcbBoardMat = new THREE.MeshStandardMaterial({
      color: 0x161816,
      roughness: 0.55,
      metalness: 0.25,
    });

    // Dark machined titanium baffle ring (no white blocks!)
    const baffleMat = new THREE.MeshStandardMaterial({
      color: 0x2c2c2a,
      map: baffleTex,
      roughness: 0.45,
      metalness: 0.72,
    });

    // Root Headphone Assembly Group
    const rootGroup = new THREE.Group();
    rootGroup.scale.setScalar(0.48);
    scene.add(rootGroup);

    // Dedicated warm spotlight for Stage 3 (SOUND_DRIVER) cutaway so the 40mm biocellulose dome & copper coil glow clearly
    const driverCutawayLight = new THREE.PointLight(0xff7a2e, 0, 4.5);
    driverCutawayLight.position.set(0.6, -0.2, 2.2);
    scene.add(driverCutawayLight);

    // Contact shadow plane below the floating headphone
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.78;
    scene.add(shadowPlane);

    const radialSegs = isSoftwareGl || isMobile ? 24 : 48;
    const tubularSegs = isSoftwareGl || isMobile ? 32 : 64;

    const partGroups: THREE.Group[] = ASSEMBLY_PARTS.map((part) => {
      const g = new THREE.Group();
      g.name = part.id;
      g.userData = { partIndex: part.index };
      rootGroup.add(g);
      return g;
    });

    const driverDomeMeshes: THREE.Mesh[] = [];
    const driverCopperRings: THREE.Mesh[] = [];

    // =========================================================================
    // PART 06 (index 5): SPRING-STEEL HEADBAND CORE
    // =========================================================================
    const headbandGroup = partGroups[5];
    const outerBandGeo = new THREE.TorusGeometry(
      1.04,
      0.065,
      18,
      tubularSegs,
      Math.PI * 0.96
    );
    const outerBandMesh = new THREE.Mesh(outerBandGeo, springSteelMat);
    outerBandMesh.rotation.z = Math.PI * 0.02;
    outerBandMesh.position.y = 0.06;
    outerBandMesh.scale.set(0.95, 1.04, 0.52);
    headbandGroup.add(outerBandMesh);

    const innerCushionArcGeo = new THREE.TorusGeometry(
      0.99,
      0.052,
      16,
      tubularSegs,
      Math.PI * 0.82
    );
    const innerCushionArc = new THREE.Mesh(
      innerCushionArcGeo,
      headbandSiliconeMat
    );
    innerCushionArc.rotation.z = Math.PI * 0.09;
    innerCushionArc.position.y = 0.05;
    innerCushionArc.scale.set(0.95, 1.03, 0.65);
    headbandGroup.add(innerCushionArc);

    [-1, 1].forEach((side) => {
      const collar = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.2, 0.15),
        yokeMaterial
      );
      collar.position.set(side * 0.98, 0.08, 0);
      collar.rotation.z = side * -0.06;
      headbandGroup.add(collar);

      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.135, 0.02, 0.06),
        dialAccentMaterial
      );
      tick.position.set(side * 0.98, 0.15, 0);
      headbandGroup.add(tick);
    });

    // =========================================================================
    // PART 01 (index 0): CNC ALUMINIUM YOKE
    // =========================================================================
    const yokeGroup = partGroups[0];
    [-1, 1].forEach((side) => {
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.46, 16),
        brushedSteelMat
      );
      stem.position.set(side * 0.99, -0.14, 0);
      stem.rotation.z = side * 0.04;
      yokeGroup.add(stem);

      const pivotBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.11, 0.14),
        yokeMaterial
      );
      pivotBlock.position.set(side * 1.0, -0.32, 0);
      yokeGroup.add(pivotBlock);

      const yokeArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.36, 0.09),
        yokeMaterial
      );
      yokeArm.position.set(side * 1.08, -0.48, 0);
      yokeArm.rotation.z = side * 0.12;
      yokeGroup.add(yokeArm);

      const axleHub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, 0.06, 20),
        brushedSteelMat
      );
      axleHub.rotation.z = Math.PI / 2;
      axleHub.position.set(side * 1.09, -0.62, 0);
      yokeGroup.add(axleHub);
    });

    // =========================================================================
    // PART 04 (index 3): MACHINED ANODIZED EAR CUP
    // =========================================================================
    const cupGroup = partGroups[3];
    [-1, 1].forEach((side) => {
      const cupSub = new THREE.Group();
      cupSub.position.set(side * 0.88, -0.62, 0);
      cupSub.rotation.z = side * 0.12;
      cupSub.rotation.y = side * 0.06;

      const mainShell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.54, 0.26, radialSegs),
        cupMaterial
      );
      mainShell.rotation.z = Math.PI / 2;
      mainShell.scale.set(1.16, 1, 1);
      cupSub.add(mainShell);

      const bevelRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.515, 0.026, 16, radialSegs),
        yokeMaterial
      );
      bevelRing.rotation.y = Math.PI / 2;
      bevelRing.scale.set(1, 1.16, 1);
      bevelRing.position.x = side * 0.13;
      cupSub.add(bevelRing);

      const faceplate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.47, 0.47, 0.04, radialSegs),
        cupMaterial
      );
      faceplate.rotation.z = Math.PI / 2;
      faceplate.scale.set(1.16, 1, 1);
      faceplate.position.x = side * 0.135;
      cupSub.add(faceplate);

      for (let s = 0; s < 3; s++) {
        const angle = (s * Math.PI * 2) / 3 + Math.PI / 6;
        const screw = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 0.03, 12),
          brushedSteelMat
        );
        screw.rotation.z = Math.PI / 2;
        screw.position.set(
          side * 0.155,
          Math.sin(angle) * 0.44,
          Math.cos(angle) * 0.37
        );
        cupSub.add(screw);
      }

      const bassPort = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.028, 0.16),
        springSteelMat
      );
      bassPort.position.set(side * 0.07, 0.59, 0);
      cupSub.add(bassPort);

      cupGroup.add(cupSub);
    });

    // =========================================================================
    // PART 07 (index 6): GOLD-PLATED POGO CONTACT RING
    // =========================================================================
    const pogoGroup = partGroups[6];
    [-1, 1].forEach((side) => {
      const ringSub = new THREE.Group();
      ringSub.position.set(side * 0.74, -0.62, 0);
      ringSub.rotation.z = side * 0.12;
      ringSub.rotation.y = side * 0.06;

      const pcbRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.36, 0.03, 12, radialSegs),
        pcbBoardMat
      );
      pcbRing.rotation.y = Math.PI / 2;
      pcbRing.scale.set(1, 1.15, 1);
      ringSub.add(pcbRing);

      for (let p = 0; p < 6; p++) {
        const angle = (p * Math.PI * 2) / 6;
        const pin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.015, 0.075, 10),
          goldPinMat
        );
        pin.rotation.z = Math.PI / 2;
        pin.position.set(
          -side * 0.03,
          Math.sin(angle) * 0.4,
          Math.cos(angle) * 0.34
        );
        ringSub.add(pin);
      }

      pogoGroup.add(ringSub);
    });

    // =========================================================================
    // PART 03 (index 2): 40MM BIOCELLULOSE DRIVER (Visible Dome + Copper Coil)
    // =========================================================================
    const driverGroup = partGroups[2];
    [-1, 1].forEach((side) => {
      const drvSub = new THREE.Group();
      drvSub.position.set(side * 0.66, -0.62, 0);
      drvSub.rotation.z = side * 0.12;
      drvSub.rotation.y = side * 0.06;

      // Annular machined acoustic baffle ring (does NOT block the biocellulose dome!)
      const baffleRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.055, 14, radialSegs),
        baffleMat
      );
      baffleRing.rotation.y = Math.PI / 2;
      baffleRing.scale.set(1, 1.15, 1);
      drvSub.add(baffleRing);

      // N52 Magnet Pot core
      const magnetPot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.20, 0.08, radialSegs),
        brushedSteelMat
      );
      magnetPot.rotation.z = Math.PI / 2;
      drvSub.add(magnetPot);

      // Dual-sided Copper Voice Coil rings so the copper coil reads clearly from both inside & cutaway angles
      [-1, 1].forEach((coilDir) => {
        const copperRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.27, 0.032, 14, radialSegs),
          copperCoilMat
        );
        copperRing.rotation.y = Math.PI / 2;
        copperRing.position.x = coilDir * 0.035;
        drvSub.add(copperRing);
        driverCopperRings.push(copperRing);
      });

      // Bi-directional 40mm Biocellulose Dome (visible from both inner earcup and outer cutaway)
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 24, 16),
        biocelluloseMat
      );
      dome.scale.set(0.48, 1.0, 1.0);
      drvSub.add(dome);
      driverDomeMeshes.push(dome);

      driverGroup.add(drvSub);
    });

    // =========================================================================
    // PART 02 (index 1): MEMORY-FOAM LAMBSKIN CUSHION
    // =========================================================================
    const cushionGroup = partGroups[1];
    [-1, 1].forEach((side) => {
      const padSub = new THREE.Group();
      padSub.position.set(side * 0.54, -0.62, 0);
      padSub.rotation.z = side * 0.12;
      padSub.rotation.y = side * 0.06;

      const padTorus = new THREE.Mesh(
        new THREE.TorusGeometry(0.43, 0.138, 24, tubularSegs),
        cushionMaterial
      );
      padTorus.rotation.y = Math.PI / 2;
      padTorus.scale.set(0.95, 1.18, 1.0);
      padSub.add(padTorus);

      const bayonetRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.49, 0.016, 12, radialSegs),
        springSteelMat
      );
      bayonetRim.rotation.y = Math.PI / 2;
      bayonetRim.scale.set(1, 1.16, 1);
      bayonetRim.position.x = side * 0.08;
      padSub.add(bayonetRim);

      cushionGroup.add(padSub);
    });

    // =========================================================================
    // PART 05 (index 4): KNURLED GAIN & ANC DIAL
    // =========================================================================
    const dialGroup = partGroups[4];
    const dialSub = new THREE.Group();
    dialSub.position.set(1.01, -0.88, 0.32);
    dialSub.rotation.set(0.45, 0.2, -0.35);

    const knurledWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.088, 0.088, 0.085, 28),
      brushedSteelMat
    );
    dialSub.add(knurledWheel);

    const orangeDialRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.089, 0.011, 12, 28),
      dialAccentMaterial
    );
    orangeDialRing.rotation.x = Math.PI / 2;
    orangeDialRing.position.y = 0.024;
    dialSub.add(orangeDialRing);

    const dialCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.09, 20),
      dialAccentMaterial
    );
    dialSub.add(dialCap);

    dialGroup.add(dialSub);

    const usbCollar = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.036, 0.13),
      brushedSteelMat
    );
    usbCollar.position.set(-0.94, -1.2, 0);
    dialGroup.add(usbCollar);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const targetCupColor = new THREE.Color();
    const targetCushionColor = new THREE.Color();
    const targetYokeColor = new THREE.Color();
    const targetAccentColor = new THREE.Color();
    const desiredCamPos = new THREE.Vector3();
    const desiredLookAt = new THREE.Vector3();
    const currentLookAt = new THREE.Vector3(0, 0, 0);

    const handleResize = () => {
      const w = Math.max(window.innerWidth, 280);
      const h = Math.max(window.innerHeight, 280);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let frameId = 0;
    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    let isFirstFrame = true;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    /**
     * Queries the live section & stage-bay DOM elements on every frame so that:
     * 1. Stage timing is 100% synced to the actual section currently in the viewport (start "top bottom", end "bottom top").
     * 2. The headphone is anchored inside the visible portion of that section's [data-stage-bay] element,
     *    guaranteeing it never clips at the top/bottom, never crosses a section divider, and never overlaps text.
     */
    const measureActiveSectionAndBay = () => {
      const vw = Math.max(window.innerWidth, 320);
      const vh = Math.max(window.innerHeight, 320);
      const bayEls = document.querySelectorAll<HTMLElement>('[data-stage-bay]');
      if (bayEls.length === 0) {
        return null;
      }

      const topSafeEdge = 68; // below 64px top nav
      const bottomSafeEdge = vh - 16;

      let bestIdx = 0;
      let bestVisHeight = -1;
      let bestRect: DOMRect | null = null;
      let bestVisTop = topSafeEdge;
      let bestVisBottom = bottomSafeEdge;
      let bestSecProgress = 0;

      bayEls.forEach((bayEl) => {
        const idxAttr = Number(bayEl.getAttribute('data-stage-index') || '0');
        const secEl = bayEl.closest('section') || bayEl;
        const secRect = secEl.getBoundingClientRect();
        const bayRect = bayEl.getBoundingClientRect();

        const visTop = Math.max(topSafeEdge, bayRect.top);
        const visBottom = Math.min(bottomSafeEdge, bayRect.bottom);
        const visHeight = Math.max(0, visBottom - visTop);

        // Progress of the section from "top bottom" (0) to "bottom top" (1)
        const secProg = Math.max(
          0,
          Math.min(1, (vh - secRect.top) / Math.max(1, vh + secRect.height))
        );

        if (visHeight > bestVisHeight) {
          bestVisHeight = visHeight;
          bestIdx = idxAttr;
          bestRect = bayRect;
          bestVisTop = visTop;
          bestVisBottom = visBottom;
          bestSecProgress = secProg;
        }
      });

      if (!bestRect || bestVisHeight <= 10) {
        return null;
      }

      // Ensure only the active stage bay is a transparent window to the WebGL canvas,
      // while inactive bays keep their own section's exact surface color (#0E0E0E or #ECE7DF)
      const globalBackdrop = document.getElementById('aura-global-backdrop');
      if (globalBackdrop) {
        globalBackdrop.style.backgroundColor =
          bestIdx === 6 ? '#ECE7DF' : '#0E0E0E';
      }
      bayEls.forEach((bayEl) => {
        const idxAttr = Number(bayEl.getAttribute('data-stage-index') || '0');
        if (idxAttr === bestIdx) {
          bayEl.style.backgroundColor = 'transparent';
        } else {
          bayEl.style.backgroundColor = idxAttr === 6 ? '#ECE7DF' : '#0E0E0E';
        }
      });

      const rect = bestRect as DOMRect;
      const centerX = rect.left + rect.width * 0.5;
      const centerY = (bestVisTop + bestVisBottom) * 0.5;

      sceneControlRef.current.activeStageIndex = bestIdx;
      sceneControlRef.current.stageLocalProgress = bestSecProgress;
      sceneControlRef.current.nextStageIndex = bestIdx;
      sceneControlRef.current.transitionBlend = 0;

      const stageName = SECTION_STAGE_ORDER[bestIdx] || 'HERO';
      if (container.parentElement) {
        container.parentElement.setAttribute('data-stage', stageName);
      }

      return {
        stageIndex: bestIdx,
        localProgress: bestSecProgress,
        ndcX: (centerX / vw) * 2 - 1,
        ndcY: 1 - (centerY / vh) * 2,
        visWidthRatio: rect.width / vw,
        visHeightRatio: bestVisHeight / vh,
      };
    };

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const ctrl = sceneControlRef.current;

      const currentScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      const jumpedScroll =
        isFirstFrame || Math.abs(currentScrollY - lastScrollY) > 60;
      lastScrollY = currentScrollY;
      isFirstFrame = false;

      const asmOverride = ctrl.assemblyOverrideProgress;
      const manualPartIdx = ctrl.manualPartIndex;
      const soundPulseAmplitude = ctrl.soundPulseAmplitude;
      const dragDeltaX = ctrl.dragDeltaX;
      const dragDeltaY = ctrl.dragDeltaY;
      const pointerNormX = ctrl.pointerNormX;
      const pointerNormY = ctrl.pointerNormY;

      finishNudgeRef.current = THREE.MathUtils.damp(
        finishNudgeRef.current,
        0,
        5.5,
        dt
      );
      const nudge = finishNudgeRef.current;

      // 1. Real-time Configurator Material Lerping
      const activeFinish = FINISHES[finishRef.current];
      targetCupColor.set(activeFinish.cupHex);
      targetCushionColor.set(activeFinish.cushionHex);
      targetYokeColor.set(activeFinish.yokeHex);
      targetAccentColor.set(activeFinish.dialAccentHex);

      const matLerp = jumpedScroll ? 1 : 1 - Math.exp(-10 * dt);
      cupMaterial.color.lerp(targetCupColor, matLerp);
      cupMaterial.roughness = THREE.MathUtils.lerp(
        cupMaterial.roughness,
        activeFinish.cupRoughness,
        matLerp
      );
      cupMaterial.metalness = THREE.MathUtils.lerp(
        cupMaterial.metalness,
        activeFinish.cupMetalness,
        matLerp
      );
      cushionMaterial.color.lerp(targetCushionColor, matLerp);
      cushionMaterial.roughness = THREE.MathUtils.lerp(
        cushionMaterial.roughness,
        activeFinish.cushionRoughness,
        matLerp
      );
      yokeMaterial.color.lerp(targetYokeColor, matLerp);
      dialAccentMaterial.color.lerp(targetAccentColor, matLerp);
      dialAccentMaterial.emissive.lerp(targetAccentColor, matLerp);

      // 2. Measure live Section ScrollTrigger state & Stage Bay bounds
      const mobileNow = window.innerWidth < 768;
      const liveBay = measureActiveSectionAndBay();

      const journey = computeSectionDriven3DJourney(
        liveBay ? liveBay.stageIndex : ctrl.activeStageIndex,
        liveBay ? liveBay.localProgress : ctrl.stageLocalProgress,
        ctrl.nextStageIndex,
        ctrl.transitionBlend,
        mobileNow
      );

      // Boost key, fill, and Signal Orange rim lights during BUY_FINALE so dark finish pops on Bone section
      const contrastBoost = journey.finaleContrastBoost;
      keyLight.intensity = (isSoftwareGl ? 3.2 : 2.6) + contrastBoost * 1.8;
      fillLight.intensity = 1.35 + contrastBoost * 1.45;
      orangeRimLight.intensity = 5.8 + contrastBoost * 2.4;

      // Calculate exact world-space center & safe maximum scale from the active [data-stage-bay] DOM rect
      const camDist = journey.camZ - journey.posZ;
      const worldHalfH = camDist * Math.tan((34 * Math.PI) / 360);
      const worldHalfW = worldHalfH * camera.aspect;

      let targetWorldX = journey.posX;
      let targetWorldY = journey.posY;
      let safeScale = journey.scale;

      if (liveBay) {
        const isExplodedStage = journey.stage === 'ASSEMBLY';
        const localHalfW = isExplodedStage ? 1.56 : 1.18;
        const localHalfH = isExplodedStage ? 1.48 : 1.24;

        const bayWorldHalfW = liveBay.visWidthRatio * worldHalfW * 0.78;
        const bayWorldHalfH = liveBay.visHeightRatio * worldHalfH * 0.76;

        const maxAllowedScale = Math.min(
          bayWorldHalfW / localHalfW,
          bayWorldHalfH / localHalfH
        );
        safeScale = Math.max(0.26, Math.min(journey.scale, maxAllowedScale));

        targetWorldX = liveBay.ndcX * worldHalfW;
        targetWorldY = liveBay.ndcY * worldHalfH + 0.04 * safeScale;
      }

      const floatOffset =
        prefersReducedMotion || jumpedScroll
          ? 0
          : Math.sin(elapsed * 1.6) * 0.018;

      const dampFactor = jumpedScroll ? 1000 : 9.0;

      rootGroup.position.x = THREE.MathUtils.damp(
        rootGroup.position.x,
        targetWorldX,
        dampFactor,
        dt
      );
      rootGroup.position.y = THREE.MathUtils.damp(
        rootGroup.position.y,
        targetWorldY + floatOffset,
        dampFactor,
        dt
      );
      rootGroup.position.z = THREE.MathUtils.damp(
        rootGroup.position.z,
        journey.posZ + nudge * 0.12,
        dampFactor,
        dt
      );

      const targetScale = safeScale + nudge * 0.025;
      const dampedScale = THREE.MathUtils.damp(
        rootGroup.scale.x,
        targetScale,
        dampFactor,
        dt
      );
      rootGroup.scale.setScalar(dampedScale);

      const idleSpin =
        journey.stage === 'HERO' && !prefersReducedMotion && !jumpedScroll
          ? Math.sin(elapsed * 0.45) * 0.10
          : 0;

      const goalRotY =
        journey.rotY +
        idleSpin +
        dragDeltaX +
        pointerNormX * 0.18 +
        nudge * 0.24;
      const goalRotX = THREE.MathUtils.clamp(
        journey.rotX + dragDeltaY + pointerNormY * 0.12 - nudge * 0.06,
        -0.65,
        0.65
      );

      rootGroup.rotation.y = THREE.MathUtils.damp(
        rootGroup.rotation.y,
        goalRotY,
        dampFactor,
        dt
      );
      rootGroup.rotation.x = THREE.MathUtils.damp(
        rootGroup.rotation.x,
        goalRotX,
        dampFactor,
        dt
      );
      rootGroup.rotation.z = THREE.MathUtils.damp(
        rootGroup.rotation.z,
        journey.rotZ,
        dampFactor,
        dt
      );

      // Shadow plane follows headphone X/Y/Z inside its stage bay (stronger grounded contact shadow on Bone #ECE7DF in Stage 6)
      shadowPlane.position.x = rootGroup.position.x;
      shadowPlane.position.y = rootGroup.position.y - 1.24 * dampedScale;
      shadowPlane.position.z = rootGroup.position.z;
      shadowPlane.scale.setScalar(dampedScale * 1.45);
      (shadowPlane.material as THREE.MeshBasicMaterial).opacity =
        (0.45 + journey.finaleContrastBoost * 0.28) *
        (1 - journey.driverExposeFactor * 0.5);

      // Dedicated cutaway spotlight illuminates the 40mm biocellulose dome & copper voice coil in Stage 3
      driverCutawayLight.position.set(
        rootGroup.position.x + 0.25,
        rootGroup.position.y - 0.15,
        rootGroup.position.z + 1.65
      );
      driverCutawayLight.intensity =
        journey.driverExposeFactor > 0.01 ? 4.5 * (journey.driverExposeFactor / 0.34) : 0;

      // 3. Update 7-Part Exploded Positions (Assembly Stage + Controlled Sound Driver Cutaway)
      const effectiveAssemblyProgress =
        asmOverride !== null ? asmOverride : journey.assemblyLocalProgress;

      for (let i = 0; i < partGroups.length; i++) {
        const partSpec = ASSEMBLY_PARTS[i];
        const pg = partGroups[i];

        let targetPx = 0;
        let targetPy = 0;
        let targetPz = 0;
        let targetRx = 0;
        let targetRy = 0;
        let targetRz = 0;

        if (
          journey.stage === 'ASSEMBLY' ||
          (journey.stage !== 'SOUND_DRIVER' &&
            asmOverride !== null &&
            asmOverride > 0.005 &&
            asmOverride < 0.995) ||
          manualPartIdx !== null
        ) {
          let factor = 0;
          if (manualPartIdx !== null) {
            factor = i === manualPartIdx ? 1.0 : 0.68;
          } else {
            factor = computeAssemblyStateAtScroll(
              effectiveAssemblyProgress,
              i
            ).partExplosionFactor;
          }
          const [ex, ey, ez] = partSpec.explodeVector;
          const [rx, ry, rz] = partSpec.explodeRotation;
          targetPx = ex * factor;
          targetPy = ey * factor;
          targetPz = ez * factor;
          targetRx = rx * factor;
          targetRy = ry * factor;
          targetRz = rz * factor;
        } else if (journey.driverExposeFactor > 0.01) {
          // Clean acoustic cutaway during SOUND_DRIVER:
          // Outer cup (3), dial (4), and pogo ring (6) step back-right while 40mm biocellulose driver (2)
          // steps forward toward the camera and cushion (1) steps aside so the ivory dome and glowing copper coil are 100% exposed!
          const f = journey.driverExposeFactor / 0.34; // normalized [0..1] during Stage 3
          if (i === 3 || i === 4 || i === 6) {
            targetPx = 0.46 * f;
            targetPy = -0.06 * f;
            targetPz = -0.34 * f;
            targetRy = -0.26 * f;
          } else if (i === 2) {
            targetPx = 0.14 * f;
            targetPy = 0.08 * f;
            targetPz = 0.48 * f;
            targetRy = 0.42 * f;
          } else if (i === 1) {
            targetPx = -0.34 * f;
            targetPy = -0.14 * f;
            targetPz = 0.24 * f;
            targetRy = 0.18 * f;
          }
        }

        pg.position.x = THREE.MathUtils.damp(
          pg.position.x,
          targetPx,
          dampFactor,
          dt
        );
        pg.position.y = THREE.MathUtils.damp(
          pg.position.y,
          targetPy,
          dampFactor,
          dt
        );
        pg.position.z = THREE.MathUtils.damp(
          pg.position.z,
          targetPz,
          dampFactor,
          dt
        );

        pg.rotation.x = THREE.MathUtils.damp(
          pg.rotation.x,
          targetRx,
          dampFactor,
          dt
        );
        pg.rotation.y = THREE.MathUtils.damp(
          pg.rotation.y,
          targetRy,
          dampFactor,
          dt
        );
        pg.rotation.z = THREE.MathUtils.damp(
          pg.rotation.z,
          targetRz,
          dampFactor,
          dt
        );
      }

      // 4. Pulse the 40mm Biocellulose Driver Dome & Copper Voice Coil in Sound Section
      const pulseLevel =
        journey.driverPulseIntensity * 0.65 + soundPulseAmplitude * 0.85;
      if (pulseLevel > 0.01 && !prefersReducedMotion) {
        const waveOsc =
          Math.sin(elapsed * 18) * 0.5 + Math.sin(elapsed * 31) * 0.5;
        const excursion = 1 + waveOsc * 0.14 * pulseLevel;
        for (const dome of driverDomeMeshes) {
          dome.scale.set(0.48 * excursion, excursion, excursion);
        }
        for (const ring of driverCopperRings) {
          ring.scale.setScalar(1 + Math.abs(waveOsc) * 0.08 * pulseLevel);
        }
        biocelluloseMat.emissiveIntensity =
          0.14 * pulseLevel + Math.abs(waveOsc) * 0.28 * pulseLevel;
        copperCoilMat.emissiveIntensity =
          0.22 + Math.abs(waveOsc) * 0.48 * pulseLevel;
      } else {
        for (const dome of driverDomeMeshes) {
          dome.scale.set(0.48, 1, 1);
        }
        for (const ring of driverCopperRings) {
          ring.scale.setScalar(1);
        }
        biocelluloseMat.emissiveIntensity = THREE.MathUtils.damp(
          biocelluloseMat.emissiveIntensity,
          0.04,
          6,
          dt
        );
        copperCoilMat.emissiveIntensity = THREE.MathUtils.damp(
          copperCoilMat.emissiveIntensity,
          0.14,
          6,
          dt
        );
      }

      // 5. Camera Position (Safely outside earcup at all times)
      desiredCamPos.set(
        journey.camX + pointerNormX * 0.08,
        journey.camY - pointerNormY * 0.06,
        journey.camZ - nudge * 0.12
      );
      desiredLookAt.set(journey.lookAtX, journey.lookAtY, journey.lookAtZ);

      const camLerp = jumpedScroll ? 1 : 1 - Math.exp(-8 * dt);
      camera.position.lerp(desiredCamPos, camLerp);
      currentLookAt.lerp(desiredLookAt, camLerp);
      camera.lookAt(currentLookAt);

      renderer.render(scene, camera);

      if (!hasNotifiedReadyRef.current) {
        hasNotifiedReadyRef.current = true;
        onReadyRef.current?.();
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener(
        'webglcontextlost',
        handleContextLost
      );
      knurlTex.dispose();
      baffleTex.dispose();
      shadowTex.dispose();
      envTexture?.dispose();
      renderer.dispose();
    };
  }, [sceneControlRef]);

  const currentFinish = FINISHES[finishId];

  return (
    <div
      data-testid="persistent-headphone-3d-canvas"
      data-finish={finishId}
      data-stage={currentStageLabel}
      aria-hidden="true"
      className="fixed inset-0 z-[5] pointer-events-none overflow-hidden"
    >
      <div ref={mountRef} className="w-full h-full" />

      {!webglReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="border border-[#ECE7DF]/15 bg-[#0E0E0E]/90 px-6 py-4 font-mono text-xs uppercase text-[#ECE7DF]">
            AURA ONE 3D RIG · {currentFinish.name} ({currentFinish.code})
          </div>
        </div>
      )}
    </div>
  );
};
