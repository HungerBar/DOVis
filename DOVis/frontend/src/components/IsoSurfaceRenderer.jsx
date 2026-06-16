import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// =====================
// Vertex Shader
// =====================
const vertexShader = `
varying vec3 vOrigin;
varying vec3 vDirection;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);

  vOrigin = cameraPosition;
  vDirection = normalize(worldPos.xyz - cameraPosition);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// =====================
// Fragment Shader
// =====================
const fragmentShader = `
precision highp float;
precision highp sampler3D;

varying vec3 vOrigin;
varying vec3 vDirection;

uniform sampler3D volumeTex;
uniform float isoValue;
uniform float stepSize;

uniform vec3 bboxMin;
uniform vec3 bboxMax;

const int MAX_STEPS = 512;

vec2 intersectBox(vec3 orig, vec3 dir, vec3 boxMin, vec3 boxMax) {
  vec3 invDir = 1.0 / dir;

  vec3 t0 = (boxMin - orig) * invDir;
  vec3 t1 = (boxMax - orig) * invDir;

  vec3 tmin = min(t0, t1);
  vec3 tmax = max(t0, t1);

  float tEnter = max(max(tmin.x, tmin.y), tmin.z);
  float tExit  = min(min(tmax.x, tmax.y), tmax.z);

  if (tEnter > tExit) return vec2(-1.0);

  return vec2(tEnter, tExit);
}

void main() {
  vec3 rayOrigin = vOrigin;
  vec3 rayDir = normalize(vDirection);

  vec2 hit = intersectBox(rayOrigin, rayDir, bboxMin, bboxMax);
  if (hit.x < 0.0) discard;

  float t = max(hit.x, 0.0);
  float tEnd = hit.y;

  float lastVal = 0.0;
  bool first = true;

  for (int i = 0; i < MAX_STEPS; i++) {
    if (t >= tEnd) break;

    vec3 pos = rayOrigin + rayDir * t;

    vec3 texCoord = (pos - bboxMin) / (bboxMax - bboxMin);

    if (
      texCoord.x < 0.0 || texCoord.x > 1.0 ||
      texCoord.y < 0.0 || texCoord.y > 1.0 ||
      texCoord.z < 0.0 || texCoord.z > 1.0
    ) {
      t += stepSize;
      continue;
    }

    float val = texture(volumeTex, texCoord).r;

    if (!first) {
      if ((lastVal < isoValue && val >= isoValue) ||
          (lastVal > isoValue && val <= isoValue)) {

        float denom = val - lastVal;
        float alpha = 0.0;

        if (abs(denom) > 1e-6) {
          alpha = (isoValue - lastVal) / denom;
        }

        alpha = clamp(alpha, 0.0, 1.0);

        float tIso = t - stepSize + alpha * stepSize;

        float depthFactor = 1.0 - (tIso - hit.x) / (hit.y - hit.x);
        depthFactor = clamp(depthFactor, 0.25, 1.0);

        vec3 baseColor = vec3(0.2, 0.5, 1.0);

        gl_FragColor = vec4(baseColor * depthFactor, 1.0);
        return;
      }
    }

    lastVal = val;
    first = false;

    t += stepSize;
  }

  discard;
}
`;

// =====================
// Text sprite helper
// =====================
function createTextSprite(text, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  const size = 256;

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.strokeText(text, size / 2, size / 2);

  ctx.fillStyle = color;
  ctx.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.12, 0.12, 0.12);

  sprite.userData.dispose = () => {
    texture.dispose();
    material.dispose();
  };

  return sprite;
}

const IsoSurfaceRenderer = ({
  volume,
  shape,
  isoValue,
  loading,
}) => {
  const mountRef = useRef(null);
  const compassRef = useRef(null);

  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const materialRef = useRef(null);
  const textureRef = useRef(null);
  const frameRef = useRef(null);

  const compassRendererRef = useRef(null);
  const compassSceneRef = useRef(null);
  const compassCameraRef = useRef(null);
  const compassGroupRef = useRef(null);

  const fitCamera = (camera, controls) => {
    camera.position.set(1.8, 1.4, 2.8);
    camera.lookAt(0, 0, 0);

    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    const compassContainer = compassRef.current;

    if (!container || !compassContainer) return undefined;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      1,
      0.1,
      100
    );

    const controls = new OrbitControls(
      camera,
      renderer.domElement
    );

    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minDistance = 1.0;
    controls.maxDistance = 8.0;
    controls.target.set(0, 0, 0);
    controls.update();

    fitCamera(camera, controls);

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        volumeTex: { value: null },
        isoValue: { value: 1.0 },
        stepSize: { value: 0.006 },
        bboxMin: { value: new THREE.Vector3(-0.5, -0.5, -0.5) },
        bboxMax: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
      },
      side: THREE.BackSide,
      transparent: true,
    });

    const mesh = new THREE.Mesh(
      geometry,
      material
    );

    scene.add(mesh);

    // 只保留主场景 XYZ 坐标轴
    const axesHelper = new THREE.AxesHelper(0.85);
    scene.add(axesHelper);

    const xLabel = createTextSprite('X', '#ff5555');
    xLabel.position.set(0.75, 0, 0);

    const yLabel = createTextSprite('Y', '#55ff55');
    yLabel.position.set(0, 0.75, 0);

    const zLabel = createTextSprite('Z', '#55aaff');
    zLabel.position.set(0, 0, 0.75);

    scene.add(xLabel);
    scene.add(yLabel);
    scene.add(zLabel);

    const compassRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    compassRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    compassRenderer.setSize(120, 120);
    compassRenderer.setClearColor(0x000000, 0);
    compassContainer.appendChild(compassRenderer.domElement);

    const compassScene = new THREE.Scene();

    const compassCamera = new THREE.PerspectiveCamera(
      45,
      1,
      0.1,
      10
    );

    compassCamera.position.set(0, 0, 3);
    compassCamera.lookAt(0, 0, 0);

    const compassGroup = new THREE.Group();

    const compassAxes = new THREE.AxesHelper(1.0);
    compassGroup.add(compassAxes);

    const cx = createTextSprite('X', '#ff5555');
    cx.position.set(1.25, 0, 0);
    cx.scale.set(0.35, 0.35, 0.35);

    const cy = createTextSprite('Y', '#55ff55');
    cy.position.set(0, 1.25, 0);
    cy.scale.set(0.35, 0.35, 0.35);

    const cz = createTextSprite('Z', '#55aaff');
    cz.position.set(0, 0, 1.25);
    cz.scale.set(0.35, 0.35, 0.35);

    compassGroup.add(cx);
    compassGroup.add(cy);
    compassGroup.add(cz);
    compassScene.add(compassGroup);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;
    materialRef.current = material;

    compassRendererRef.current = compassRenderer;
    compassSceneRef.current = compassScene;
    compassCameraRef.current = compassCamera;
    compassGroupRef.current = compassGroup;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      controls.update();

      compassGroup.quaternion.copy(camera.quaternion).invert();

      renderer.render(scene, camera);
      compassRenderer.render(compassScene, compassCamera);
    };

    animate();

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (!width || !height) return;

      renderer.setSize(width, height);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    resize();

    return () => {
      cancelAnimationFrame(frameRef.current);

      ro.disconnect();

      controls.dispose();

      geometry.dispose();
      material.dispose();

      xLabel.userData.dispose?.();
      yLabel.userData.dispose?.();
      zLabel.userData.dispose?.();

      cx.userData.dispose?.();
      cy.userData.dispose?.();
      cz.userData.dispose?.();

      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }

      if (compassRenderer.domElement.parentNode === compassContainer) {
        compassContainer.removeChild(compassRenderer.domElement);
      }

      renderer.dispose();
      compassRenderer.dispose();

      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      materialRef.current = null;

      compassRendererRef.current = null;
      compassSceneRef.current = null;
      compassCameraRef.current = null;
      compassGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!volume || !materialRef.current) return;

    const [d, h, w] = shape;

    if (textureRef.current) {
      textureRef.current.dispose();
    }

    const tex = new THREE.Data3DTexture(
      volume,
      w,
      h,
      d
    );

    tex.format = THREE.RedFormat;
    tex.type = THREE.FloatType;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.unpackAlignment = 1;
    tex.needsUpdate = true;

    textureRef.current = tex;
    materialRef.current.uniforms.volumeTex.value = tex;
  }, [volume, shape]);

  useEffect(() => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.isoValue.value = isoValue;
  }, [isoValue]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        ref={mountRef}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
      />

      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            color: '#fff',
            fontSize: 12,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          Loading Volume...
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          width: 120,
          height: 120,
          zIndex: 20,
          pointerEvents: 'none',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: 8,
        }}
      >
        <div
          ref={compassRef}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 10,
          bottom: 10,
          color: '#fff',
          fontSize: 12,
          lineHeight: 1.5,
          zIndex: 20,
          pointerEvents: 'none',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '6px 8px',
          borderRadius: 6,
        }}
      >
        <div>Support: rotate / zoom / pan</div>
      </div>
    </div>
  );
};

export default IsoSurfaceRenderer;
