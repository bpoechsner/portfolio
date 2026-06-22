"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface ModelPreviewProps {
  itemId: string;
  url: string;
  format: string;
}

export default function ModelPreview({ itemId, url, format }: ModelPreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState({ url, format });
  const [error, setError] = useState(false);

  // Edit mode can swap in a freshly uploaded file without a page reload.
  useEffect(() => {
    const container = mountRef.current?.closest<HTMLElement>("[data-model-item]");
    if (!container) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ url: string; format: string }>).detail;
      if (detail?.url) {
        setError(false);
        setCurrent({ url: detail.url, format: detail.format });
      }
    };
    container.addEventListener("model-src-changed", handler);
    return () => container.removeEventListener("model-src-changed", handler);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !current.url) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.5);
    rimLight.position.set(-6, -3, -4);
    scene.add(rimLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.5;

    let frameId: number;
    let disposed = false;

    function frameObject(object: THREE.Object3D) {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      object.position.sub(center);
      camera.position.set(0, maxDim * 0.4, maxDim * 1.8);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    }

    const format = current.format.toUpperCase();

    const onError = () => {
      if (!disposed) setError(true);
    };

    if (format === "STL") {
      new STLLoader().load(
        current.url,
        (geometry) => {
          const material = new THREE.MeshStandardMaterial({ color: 0xd4d4d4, metalness: 0.1, roughness: 0.6 });
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          frameObject(mesh);
        },
        undefined,
        onError
      );
    } else if (format === "OBJ") {
      new OBJLoader().load(
        current.url,
        (object) => {
          scene.add(object);
          frameObject(object);
        },
        undefined,
        onError
      );
    } else if (format === "GLB" || format === "GLTF") {
      new GLTFLoader().load(
        current.url,
        (gltf) => {
          scene.add(gltf.scene);
          frameObject(gltf.scene);
        },
        undefined,
        onError
      );
    } else {
      onError();
    }

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [current]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center font-mono text-[10px] text-neutral-700 tracking-widest">
        PREVIEW FAILED TO LOAD
      </div>
    );
  }

  return <div ref={mountRef} data-model-item={itemId} className="w-full h-full" />;
}
