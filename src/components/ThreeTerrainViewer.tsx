import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeTerrainViewerProps {
  onClose?: () => void;
}

export const ThreeTerrainViewer: React.FC<ThreeTerrainViewerProps> = ({ onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [cameraAltitude, setCameraAltitude] = useState(1480);
  const [rotationSpeed, setRotationSpeed] = useState(0.003);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 280;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1912); // Deep mountain dusk
    scene.fog = new THREE.FogExp2(0x0a1912, 0.015);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 35, 55);
    camera.lookAt(0, 5, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Ambient & Directional Lighting (Sun azimuth across Western Ghats)
    const ambientLight = new THREE.AmbientLight(0x83a590, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.8);
    sunLight.position.set(30, 45, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xabcfb8, 0.8);
    rimLight.position.set(-30, 20, -30);
    scene.add(rimLight);

    // Procedural Mountain Terrain Geometry (Bodimettu Ridge simulation)
    const planeSize = 80;
    const segments = 64;
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Multi-octave mountain peak algorithm
      const d = Math.sqrt(x * x + z * z);
      const peak1 = Math.sin(x * 0.09) * Math.cos(z * 0.09) * 9;
      const peak2 = Math.sin(x * 0.18 + 1.2) * Math.cos(z * 0.18 + 0.8) * 4;
      const valley = -Math.exp(-Math.pow(x - 2, 2) / 60) * 5; // Pass canyon
      const ridge = Math.cos(z * 0.05) * 6;

      const y = Math.max(0, peak1 + peak2 + valley + ridge + (Math.sin(d * 0.1) * 3));
      pos.setY(i, y);
    }
    geometry.computeVertexNormals();

    // Material with earthy ghat pass gradient
    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b3b2b,
      roughness: 0.85,
      metalness: 0.15,
      wireframe: wireframe,
      flatShading: true,
    });
    const terrain = new THREE.Mesh(geometry, terrainMaterial);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // 3D Route Thread Line
    const curvePoints = [
      new THREE.Vector3(-30, 2, 25),
      new THREE.Vector3(-20, 4, 18),
      new THREE.Vector3(-10, 6, 8),
      new THREE.Vector3(-2, 7.5, 0),
      new THREE.Vector3(5, 9.8, -8),
      new THREE.Vector3(12, 11.2, -15),
      new THREE.Vector3(22, 12.8, -25)
    ];
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeometry = new THREE.TubeGeometry(curve, 60, 0.45, 8, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xea841a, // Glowing Amber Path
      emissive: 0x6e3900,
      roughness: 0.3,
      metalness: 0.8
    });
    const routeTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(routeTube);

    // GPS Position Marker Pin on Route
    const markerGeometry = new THREE.SphereGeometry(0.9, 16, 16);
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: 0xc7ebd4,
      emissive: 0x032517,
      roughness: 0.2
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(-2, 8.8, 0);
    scene.add(marker);

    // Washout Hazard Warning Diamond
    const hazardGeometry = new THREE.OctahedronGeometry(0.8);
    const hazardMaterial = new THREE.MeshStandardMaterial({
      color: 0xba1a1a,
      emissive: 0x540000,
      roughness: 0.4
    });
    const hazard = new THREE.Mesh(hazardGeometry, hazardMaterial);
    hazard.position.set(5, 11.2, -8);
    scene.add(hazard);

    // Touch / Drag Rotate interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      terrain.rotation.y += deltaX * 0.008;
      routeTube.rotation.y += deltaX * 0.008;
      marker.rotation.y += deltaX * 0.008;
      hazard.rotation.y += deltaX * 0.008;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (isRotating && !isDragging) {
        terrain.rotation.y += rotationSpeed;
        routeTube.rotation.y += rotationSpeed;
        marker.rotation.y += rotationSpeed;
        hazard.rotation.y += rotationSpeed;
      }

      // Marker pulse animation
      marker.position.y = 8.8 + Math.sin(elapsedTime * 4) * 0.3;
      hazard.rotation.y += 0.02;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      terrainMaterial.dispose();
      tubeGeometry.dispose();
      tubeMaterial.dispose();
      renderer.dispose();
    };
  }, [wireframe, isRotating, rotationSpeed]);

  return (
    <div className="relative w-full h-full bg-[#0a1912] rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* 3D Viewport Controls Top Overlay */}
      <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-between px-2 py-1.5 bg-[#032517]/80 backdrop-blur-md rounded-lg text-white border border-[#1b3b2b]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#c7ebd4]">view_in_ar</span>
          <span className="text-xs font-semibold tracking-wide">3D Ghat Topo Mesh</span>
          <span className="text-[10px] text-[#c7ebd4] bg-[#1b3b2b] px-1.5 py-0.5 rounded font-mono">
            {cameraAltitude}m MSL
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`text-[11px] px-2 py-1 rounded transition-colors ${
              wireframe ? 'bg-[#c7ebd4] text-[#002113] font-bold' : 'bg-[#1b3b2b] text-[#c7ebd4]'
            }`}
            title="Toggle Wireframe Contours"
          >
            {wireframe ? 'Shaded' : 'Contours'}
          </button>
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="p-1 rounded bg-[#1b3b2b] text-[#c7ebd4] hover:bg-[#2d4d3c]"
            title={isRotating ? 'Pause Orbit' : 'Resume Orbit'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isRotating ? 'pause' : 'play_arrow'}
            </span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded bg-[#ba1a1a]/80 text-white hover:bg-[#ba1a1a]"
              title="Close 3D View"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* WebGL Canvas Container */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* 3D Telemetry Footnote */}
      <div className="absolute bottom-2 inset-x-2 z-20 flex items-center justify-between text-[10px] text-[#83a590] px-2 py-1 bg-[#032517]/80 backdrop-blur-sm rounded-lg border border-[#1b3b2b]">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[#ea841a]">
            <span className="w-2 h-2 rounded-full bg-[#ea841a] animate-pulse"></span>
            Bodimettu Pass Active Track
          </span>
          <span>•</span>
          <span className="text-white font-mono">Drag to Rotate Azimuth</span>
        </div>
        <span className="text-[#c7ebd4] font-mono">Grade: 14.2%</span>
      </div>
    </div>
  );
};
