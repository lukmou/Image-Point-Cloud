import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Center } from "@react-three/drei";
import * as THREE from "three";
import { useToast } from "@/hooks/use-toast";

interface PointCloudViewerProps {
  imageUrl: string;
  depthUrl: string;
  displacementScale?: number;
  pointSize?: number;
  renderMode?: "point" | "splat";
}

export interface PointCloudRef {
  exportPLY: () => void;
}

const PointCloud = forwardRef<PointCloudRef, PointCloudViewerProps>(
  ({ imageUrl, depthUrl, displacementScale = 2.0, pointSize = 0.05, renderMode = "point" }, ref) => {
    const meshRef = useRef<THREE.Points>(null);
    const { toast } = useToast();
    
    const [imageTexture, depthTexture] = useLoader(THREE.TextureLoader, [imageUrl, depthUrl]);
    const segments = 256;

    const uniforms = useMemo(
      () => ({
        uTexture: { value: imageTexture },
        uDepthMap: { value: depthTexture },
        uDisplacementScale: { value: displacementScale },
        uPointSize: { value: pointSize },
        uRenderMode: { value: renderMode === "splat" ? 1.0 : 0.0 },
      }),
      [imageTexture, depthTexture]
    );

    useEffect(() => {
      if (meshRef.current) {
        const material = meshRef.current.material as THREE.ShaderMaterial;
        material.uniforms.uDisplacementScale.value = displacementScale;
        material.uniforms.uPointSize.value = pointSize;
        material.uniforms.uRenderMode.value = renderMode === "splat" ? 1.0 : 0.0;
      }
    }, [displacementScale, pointSize, renderMode]);

    useImperativeHandle(ref, () => ({
      exportPLY: () => {
        if (!meshRef.current) return;
        
        const geometry = meshRef.current.geometry.clone();
        const positions = geometry.attributes.position;
        const uvs = geometry.attributes.uv;
        
        const dCanvas = document.createElement('canvas');
        const dCtx = dCanvas.getContext('2d');
        const cCanvas = document.createElement('canvas');
        const cCtx = cCanvas.getContext('2d');
        if (!dCtx || !cCtx) return;
        
        const dImg = depthTexture.image;
        const cImg = imageTexture.image;
        
        if (!dImg.width || !dImg.height || !cImg.width || !cImg.height) {
          toast({ title: "Export Error", description: "Textures not ready. Please try again." });
          return;
        }

        dCanvas.width = dImg.width;
        dCanvas.height = dImg.height;
        dCtx.drawImage(dImg, 0, 0);
        const depthData = dCtx.getImageData(0, 0, dCanvas.width, dCanvas.height).data;

        cCanvas.width = cImg.width;
        cCanvas.height = cImg.height;
        cCtx.drawImage(cImg, 0, 0);
        const colorData = cCtx.getImageData(0, 0, cCanvas.width, cCanvas.height).data;

        // Build vertex and color data
        const vertexData = [];
        const pointCount = positions.count;
        
        for (let i = 0; i < pointCount; i++) {
          const u = uvs.getX(i);
          const v = uvs.getY(i);
          
          const dx = Math.min(Math.floor(u * (dCanvas.width - 1)), dCanvas.width - 1);
          const dy = Math.min(Math.floor((1 - v) * (dCanvas.height - 1)), dCanvas.height - 1);
          const dIdx = (dy * dCanvas.width + dx) * 4;
          const depth = depthData[dIdx] / 255;

          const cx = Math.min(Math.floor(u * (cCanvas.width - 1)), cCanvas.width - 1);
          const cy = Math.min(Math.floor((1 - v) * (cCanvas.height - 1)), cCanvas.height - 1);
          const cIdx = (cy * cCanvas.width + cx) * 4;
          
          const x = positions.getX(i);
          const y = positions.getY(i);
          const z = positions.getZ(i) + depth * displacementScale;
          const r = colorData[cIdx];
          const g = colorData[cIdx + 1];
          const b = colorData[cIdx + 2];

          vertexData.push({ x, y, z, r, g, b });
        }

        // Create ASCII PLY format
        let plyContent = 'ply\n';
        plyContent += 'format ascii 1.0\n';
        plyContent += `element vertex ${vertexData.length}\n`;
        plyContent += 'property float x\n';
        plyContent += 'property float y\n';
        plyContent += 'property float z\n';
        plyContent += 'property uchar red\n';
        plyContent += 'property uchar green\n';
        plyContent += 'property uchar blue\n';
        plyContent += 'end_header\n';

        for (const v of vertexData) {
          plyContent += `${v.x} ${v.y} ${v.z} ${Math.round(v.r)} ${Math.round(v.g)} ${Math.round(v.b)}\n`;
        }

        const blob = new Blob([plyContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `depthcloud_${Date.now()}.ply`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({ title: "Export Complete", description: "Your 3D point cloud has been saved!" });
      }
    }));

    const vertexShader = `
      uniform sampler2D uDepthMap;
      uniform float uDisplacementScale;
      uniform float uPointSize;
      uniform float uRenderMode;
      varying vec2 vUv;
      varying float vDepth;

      void main() {
        vUv = uv;
        vec4 depthColor = texture2D(uDepthMap, uv);
        float depth = depthColor.r;
        vDepth = depth;
        vec3 displacedPosition = position + normal * depth * uDisplacementScale;
        vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
        
        float size = uPointSize;
        if (uRenderMode > 0.5) {
          size *= 4.0;
        }
        
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform float uRenderMode;
      varying vec2 vUv;
      varying float vDepth;

      void main() {
        vec4 color = texture2D(uTexture, vUv);
        
        if (uRenderMode > 0.5) {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float alpha = exp(-dist * dist * 15.0);
          color.a *= alpha;
        }
        
        gl_FragColor = color;
      }
    `;

    return (
      <Center>
        <points ref={meshRef}>
          <planeGeometry args={[5, 5 * (imageTexture.image.height / imageTexture.image.width), segments, segments]} />
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </Center>
    );
  }
);

export function PointCloudCanvas(props: PointCloudViewerProps & { canvasRef?: React.RefObject<PointCloudRef | null> }) {
  return (
    <div className="w-full h-full bg-black/60 overflow-hidden border border-border relative">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
        <ambientLight intensity={0.5} />
        <PointCloud {...props} ref={props.canvasRef as any} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          minDistance={2} 
          maxDistance={20}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />
      </Canvas>
      <div className="absolute bottom-3 right-3 text-xs text-muted-foreground pointer-events-none font-mono bg-black/50 px-2 py-1 border border-border/50">
        MMB: Rotate | RMB: Pan | Wheel: Zoom
      </div>
    </div>
  );
}
