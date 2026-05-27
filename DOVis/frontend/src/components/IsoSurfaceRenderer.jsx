import { useRef, useEffect } from 'react';
import * as THREE from 'three';

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

  float t = hit.x;
  float tEnd = hit.y;

  float lastVal = 0.0;
  bool first = true;

  for (int i = 0; i < MAX_STEPS; i++) {
    if (t >= tEnd) break;

    vec3 pos = rayOrigin + rayDir * t;

    vec3 texCoord = (pos - bboxMin) / (bboxMax - bboxMin);

    float val = texture(volumeTex, texCoord).r;

    if (!first) {
      if ((lastVal < isoValue && val >= isoValue) ||
          (lastVal > isoValue && val <= isoValue)) {

        float depthFactor = 1.0 - (t - hit.x) / (hit.y - hit.x);
        gl_FragColor = vec4(vec3(0.2, 0.5, 1.0) * depthFactor, 1.0);
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

const IsoSurfaceRenderer = ({ volume, shape, isoValue, loading }) => {
  const mountRef = useRef(null);

  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const materialRef = useRef(null);
  const textureRef = useRef(null);
  const frameRef = useRef(null);

  // =====================
  // ⭐ camera auto-fit（核心修复）
  // =====================
  const fitCamera = (camera) => {
    const distance = 2.4; // unit cube + margin

    camera.position.set(distance, distance, distance);
    camera.lookAt(0, 0, 0);
  };

  // =====================
  // init
  // =====================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      1,
      0.1,
      100
    );

    // ⭐ 关键：初始化就居中
    fitCamera(camera);

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        volumeTex: { value: null },
        isoValue: { value: isoValue ?? 1.0 },
        stepSize: { value: 0.01 },
        bboxMin: { value: new THREE.Vector3(-0.5, -0.5, -0.5) },
        bboxMax: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
      },
      side: THREE.BackSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    materialRef.current = material;

    // =====================
    // render loop
    // =====================
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    // =====================
    // ⭐ resize system + auto center
    // =====================
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (!width || !height) return;

      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // ⭐ 关键：每次 resize 重新居中
      fitCamera(camera);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    resize();

    // =====================
    // cleanup
    // =====================
    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (textureRef.current) {
        textureRef.current.dispose();
      }

      container.innerHTML = '';
    };
  }, []);

  // =====================
  // volume update
  // =====================
  useEffect(() => {
    if (!volume || !materialRef.current) return;

    const [d, h, w] = shape;

    if (textureRef.current) {
      textureRef.current.dispose();
    }

    const tex = new THREE.Data3DTexture(volume, w, h, d);

    tex.format = THREE.RedFormat;
    tex.type = THREE.FloatType;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.unpackAlignment = 1;
    tex.needsUpdate = true;

    textureRef.current = tex;
    materialRef.current.uniforms.volumeTex.value = tex;
  }, [volume, shape]);

  // =====================
  // iso update
  // =====================
  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.isoValue.value = isoValue;
  }, [isoValue]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            color: '#fff',
            fontSize: 12,
          }}
        >
          Loading Volume...
        </div>
      )}
    </div>
  );
};

export default IsoSurfaceRenderer;