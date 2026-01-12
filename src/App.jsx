import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// Complete data for all 32 crystallographic point groups
const pointGroups = [
  // TRICLINIC SYSTEM
  {
    id: '1',
    name: '1 (C₁)',
    system: 'Triclinic',
    schoenflies: 'C₁',
    description: 'No symmetry except identity',
    example: 'CuSO₄·5H₂O',
    geometry: 'scalene',
    operations: []
  },
  {
    id: '-1',
    name: '-1 (Cᵢ)',
    system: 'Triclinic',
    schoenflies: 'Cᵢ',
    description: 'Inversion center only',
    example: 'CaSO₄·2H₂O',
    geometry: 'scalene',
    operations: [{ type: 'inversion' }]
  },
  
  // MONOCLINIC SYSTEM
  {
    id: '2',
    name: '2 (C₂)',
    system: 'Monoclinic',
    schoenflies: 'C₂',
    description: 'One 2-fold rotation axis',
    example: 'Gypsum',
    geometry: 'monoclinic',
    operations: [{ type: 'rotation', order: 2, axis: [0, 1, 0] }]
  },
  {
    id: 'm',
    name: 'm (Cs)',
    system: 'Monoclinic',
    schoenflies: 'Cs',
    description: 'One mirror plane',
    example: 'Clinohedrite',
    geometry: 'monoclinic',
    operations: [{ type: 'mirror', normal: [1, 0, 0] }]
  },
  {
    id: '2/m',
    name: '2/m (C₂h)',
    system: 'Monoclinic',
    schoenflies: 'C₂h',
    description: '2-fold axis perpendicular to mirror',
    example: 'Borax',
    geometry: 'monoclinic',
    operations: [
      { type: 'rotation', order: 2, axis: [0, 1, 0] },
      { type: 'mirror', normal: [1, 0, 0] },
      { type: 'inversion' }
    ]
  },
  
  // ORTHORHOMBIC SYSTEM
  {
    id: '222',
    name: '222 (D₂)',
    system: 'Orthorhombic',
    schoenflies: 'D₂',
    description: 'Three perpendicular 2-fold axes',
    example: 'α-Sulfur',
    geometry: 'orthorhombic',
    operations: [
      { type: 'rotation', order: 2, axis: [1, 0, 0] },
      { type: 'rotation', order: 2, axis: [0, 1, 0] },
      { type: 'rotation', order: 2, axis: [0, 0, 1] }
    ]
  },
  {
    id: 'mm2',
    name: 'mm2 (C₂v)',
    system: 'Orthorhombic',
    schoenflies: 'C₂v',
    description: '2-fold axis, two perpendicular mirrors',
    example: 'Hemimorphite',
    geometry: 'orthorhombic',
    operations: [
      { type: 'rotation', order: 2, axis: [0, 0, 1] },
      { type: 'mirror', normal: [1, 0, 0] },
      { type: 'mirror', normal: [0, 1, 0] }
    ]
  },
  {
    id: 'mmm',
    name: 'mmm (D₂h)',
    system: 'Orthorhombic',
    schoenflies: 'D₂h',
    description: 'Three perpendicular mirror planes',
    example: 'Barite',
    geometry: 'orthorhombic',
    operations: [
      { type: 'rotation', order: 2, axis: [1, 0, 0] },
      { type: 'rotation', order: 2, axis: [0, 1, 0] },
      { type: 'rotation', order: 2, axis: [0, 0, 1] },
      { type: 'mirror', normal: [1, 0, 0] },
      { type: 'mirror', normal: [0, 1, 0] },
      { type: 'mirror', normal: [0, 0, 1] },
      { type: 'inversion' }
    ]
  },
  
  // TETRAGONAL SYSTEM
  {
    id: '4',
    name: '4 (C₄)',
    system: 'Tetragonal',
    schoenflies: 'C₄',
    description: 'One 4-fold rotation axis',
    example: 'Wulfenite',
    geometry: 'tetragonal',
    operations: [{ type: 'rotation', order: 4, axis: [0, 0, 1] }]
  },
  {
    id: '-4',
    name: '-4 (S₄)',
    system: 'Tetragonal',
    schoenflies: 'S₄',
    description: '4-fold rotoinversion axis',
    example: 'Chalcopyrite',
    geometry: 'tetragonal',
    operations: [
      { type: 'rotation', order: 4, axis: [0, 0, 1], roto: true }
    ]
  },
  {
    id: '4/m',
    name: '4/m (C₄h)',
    system: 'Tetragonal',
    schoenflies: 'C₄h',
    description: '4-fold axis perpendicular to mirror',
    example: 'Scheelite',
    geometry: 'tetragonal',
    operations: [
      { type: 'rotation', order: 4, axis: [0, 0, 1] },
      { type: 'mirror', normal: [0, 0, 1] },
      { type: 'inversion' }
    ]
  },
  {
    id: '422',
    name: '422 (D₄)',
    system: 'Tetragonal',
    schoenflies: 'D₄',
    description: '4-fold axis with perpendicular 2-folds',
    example: 'Cristobalite',
    geometry: 'tetragonal',
    operations: [
      { type: 'rotation', order: 4, axis: [0, 0, 1] },
      { type: 'rotation', order: 2, axis: [1, 0, 0] },
      { type: 'rotation', order: 2, axis: [0, 1, 0] },
      { type: 'rotation', order: 2, axis: [1, 1, 0] },
      { type: 'rotation', order: 2, axis: [1, -1, 0] }
    ]
  },
  {
    id: '4mm',
    name: '4mm (C₄v)',
    system: 'Tetragonal',
    schoenflies: 'C₄v',
    description: '4-fold axis with 4 vertical mirrors',
    example: 'Diaboleite',
    geometry: 'tetragonal',
    operations: [
      { type: 'rotation', order: 4, axis: [0, 0, 1] },
      { type: 'mirror', normal: [1, 0, 0] },
      { type: 'mirror', normal: [0, 1, 0] },
      { type: 'mirror', normal: [1, 1, 0] },
      { type: 'mirror', normal: [1, -1, 0] }
    ]
  },
  {
    id: '-42m',
    name: '-42m (D₂d)',
    system: 'Tetragonal',
    schoenflies: 'D₂d',
    description: '4-bar with 2-folds and mirrors',
    example: 'Chalcopyrite',
    geometry: 'tetragonal',
    operations: [
      { type: 'rotation', order: 4, axis: [0, 0, 1], roto: true },
      { type: 'rotation', order: 2, axis: [1, 0, 0] },
      { type: 'rotation', order: 2, axis: [0, 1, 0] },
      { type: 'mirror', normal: [1, 1, 0] },
      { type: 'mirror', normal: [1, -1, 0] }
    ]
  },
  {
    id: '4/mmm',
    name: '4/mmm (D₄h)',
    system: 'Tetragonal',
    schoenflies: 'D₄h',
    description: 'Highest tetragonal symmetry',
    example: 'Rutile',
    geometry: 'tetragonal',
    operations: [
      { type: 'rotation', order: 4, axis: [0, 0, 1] },
      { type: 'rotation', order: 2, axis: [1, 0, 0] },
      { type: 'rotation', order: 2, axis: [0, 1, 0] },
      { type: 'mirror', normal: [0, 0, 1] },
      { type: 'mirror', normal: [1, 0, 0] },
      { type: 'mirror', normal: [0, 1, 0] },
      { type: 'inversion' }
    ]
  },
  
  // TRIGONAL SYSTEM
  {
    id: '3',
    name: '3 (C₃)',
    system: 'Trigonal',
    schoenflies: 'C₃',
    description: 'One 3-fold rotation axis',
    example: 'Sodium periodate',
    geometry: 'trigonal',
    operations: [{ type: 'rotation', order: 3, axis: [0, 0, 1] }]
  },
  {
    id: '-3',
    name: '-3 (C₃ᵢ)',
    system: 'Trigonal',
    schoenflies: 'C₃ᵢ',
    description: '3-fold axis with inversion',
    example: 'Dolomite',
    geometry: 'trigonal',
    operations: [
      { type: 'rotation', order: 3, axis: [0, 0, 1] },
      { type: 'inversion' }
    ]
  },
  {
    id: '32',
    name: '32 (D₃)',
    system: 'Trigonal',
    schoenflies: 'D₃',
    description: '3-fold with perpendicular 2-folds',
    example: 'α-Quartz',
    geometry: 'trigonal',
    operations: [
      { type: 'rotation', order: 3, axis: [0, 0, 1] },
      { type: 'rotation', order: 2, axis: [1, 0, 0] },
      { type: 'rotation', order: 2, axis: [0.5, 0.866, 0] },
      { type: 'rotation', order: 2, axis: [-0.5, 0.866, 0] }
    ]
  },
  {
    id: '3m',
    name: '3m (C₃v)',
    system: 'Trigonal',
    schoenflies: 'C₃v',
    description: '3-fold axis with 3 vertical mirrors',
    example: 'Tourmaline',
    geometry: 'trigonal',
    operations: [
      { type: 'rotation', order: 3, axis: [0, 0, 1] },
      { type: 'mirror', normal: [1, 0, 0] },
      { type: 'mirror', normal: [0.5, 0.866, 0] },
      { type: 'mirror', normal: [-0.5, 0.866, 0] }
    ]
  },
  {
    id: '-3m',
    name: '-3m (D₃d)',
    system: 'Trigonal',
    schoenflies: 'D₃d',
    description: 'Highest trigonal symmetry',
    example: 'Calcite',
    geometry: 'trigonal',
    operations: [
      { type: 'rotation', order: 3, axis: [0, 0, 1] },
      { type: 'rotation', order: 2, axis: [1, 0, 0] },
      { type: 'mirror', normal: [1, 0, 0] },
      { type: 'inversion' }
    ]
  },
  
  // HEXAGONAL SYSTEM
  {
    id: '6',
    name: '6 (C₆)',
    system: 'Hexagonal',
    schoenflies: 'C₆',
    description: 'One 6-fold rotation axis',
    example: 'Nepheline',
    geometry: 'hexagonal',
    operations: [{ type: 'rotation', order: 6, axis: [0, 0, 1] }]
  },
  {
    id: '-6',
    name: '-6 (C₃h)',
    system: 'Hexagonal',
    schoenflies: 'C₃h',
    description: '6-fold rotoinversion axis',
    example: 'Benitoite',
    geometry: 'hexagonal',
    operations: [
      { type: 'rotation', order: 6, axis: [0, 0, 1], roto: true },
      { type: 'mirror', normal: [0, 0, 1] }
    ]
  },
  {
    id: '6/m',
    name: '6/m (C₆h)',
    system: 'Hexagonal',
    schoenflies: 'C₆h',
    description: '6-fold axis perpendicular to mirror',
    example: 'Apatite',
    geometry: 'hexagonal',
    operations: [
      { type: 'rotation', order: 6, axis: [0, 0, 1] },
      { type: 'mirror', normal: [0, 0, 1] },
      { type: 'inversion' }
    ]
  },
  {
    id: '622',
    name: '622 (D₆)',
    system: 'Hexagonal',
    schoenflies: 'D₆',
    description: '6-fold axis with perpendicular 2-folds',
    example: 'β-Quartz',
    geometry: 'hexagonal',
    operations: [
      { type: 'rotation', order: 6, axis: [0, 0, 1] },
      { type: 'rotation', order: 2, axis: [1, 0, 0] },
      { type: 'rotation', order: 2, axis: [0, 1, 0] },
      { type: 'rotation', order: 2, axis: [0.866, 0.5, 0] }
    ]
  },
  {
    id: '6mm',
    name: '6mm (C₆v)',
    system: 'Hexagonal',
    schoenflies: 'C₆v',
    description: '6-fold axis with 6 vertical mirrors',
    example: 'Wurtzite',
    geometry: 'hexagonal',
    operations: [
      { type: 'rotation', order: 6, axis: [0, 0, 1] },
      { type: 'mirror', normal: [1, 0, 0] },
      { type: 'mirror', normal: [0, 1, 0] },
      { type: 'mirror', normal: [0.866, 0.5, 0] }
    ]
  },
  {
    id: '-6m2',
    name: '-6m2 (D₃h)',
    system: 'Hexagonal',
    schoenflies: 'D₃h',
    description: '6-bar with mirrors and 2-folds',
    example: 'Schorl',
    geometry: 'hexagonal',
    operations: [
      { type: 'rotation', order: 6, axis: [0, 0, 1], roto: true },
      { type: 'mirror', normal: [0, 0, 1] },
      { type: 'rotation', order: 2, axis: [1, 0, 0] }
    ]
  },
  {
    id: '6/mmm',
    name: '6/mmm (D₆h)',
    system: 'Hexagonal',
    schoenflies: 'D₆h',
    description: 'Highest hexagonal symmetry',
    example: 'Beryl',
    geometry: 'hexagonal',
    operations: [
      { type: 'rotation', order: 6, axis: [0, 0, 1] },
      { type: 'rotation', order: 2, axis: [1, 0, 0] },
      { type: 'mirror', normal: [0, 0, 1] },
      { type: 'mirror', normal: [1, 0, 0] },
      { type: 'inversion' }
    ]
  },
  
  // CUBIC SYSTEM
  {
    id: '23',
    name: '23 (T)',
    system: 'Cubic',
    schoenflies: 'T',
    description: 'Tetrahedral rotation group',
    example: 'Sodium chlorate',
    geometry: 'tetrahedron',
    operations: [
      { type: 'rotation', order: 3, axis: [1, 1, 1] },
      { type: 'rotation', order: 3, axis: [-1, 1, 1] },
      { type: 'rotation', order: 2, axis: [1, 0, 0] },
      { type: 'rotation', order: 2, axis: [0, 1, 0] },
      { type: 'rotation', order: 2, axis: [0, 0, 1] }
    ]
  },
  {
    id: 'm-3',
    name: 'm-3 (Th)',
    system: 'Cubic',
    schoenflies: 'Th',
    description: 'Tetrahedral group with inversion',
    example: 'Pyrite',
    geometry: 'tetrahedron',
    operations: [
      { type: 'rotation', order: 3, axis: [1, 1, 1] },
      { type: 'rotation', order: 2, axis: [1, 0, 0] },
      { type: 'inversion' }
    ]
  },
  {
    id: '432',
    name: '432 (O)',
    system: 'Cubic',
    schoenflies: 'O',
    description: 'Octahedral rotation group',
    example: 'Cuprite',
    geometry: 'cube',
    operations: [
      { type: 'rotation', order: 4, axis: [1, 0, 0] },
      { type: 'rotation', order: 4, axis: [0, 1, 0] },
      { type: 'rotation', order: 4, axis: [0, 0, 1] },
      { type: 'rotation', order: 3, axis: [1, 1, 1] },
      { type: 'rotation', order: 2, axis: [1, 1, 0] }
    ]
  },
  {
    id: '-43m',
    name: '-43m (Td)',
    system: 'Cubic',
    schoenflies: 'Td',
    description: 'Tetrahedral group with mirrors',
    example: 'Sphalerite',
    geometry: 'tetrahedron',
    operations: [
      { type: 'rotation', order: 3, axis: [1, 1, 1] },
      { type: 'rotation', order: 2, axis: [1, 0, 0] },
      { type: 'mirror', normal: [1, 1, 0] },
      { type: 'mirror', normal: [1, 0, 1] }
    ]
  },
  {
    id: 'm-3m',
    name: 'm-3m (Oh)',
    system: 'Cubic',
    schoenflies: 'Oh',
    description: 'Highest cubic symmetry',
    example: 'Halite, Diamond',
    geometry: 'cube',
    operations: [
      { type: 'rotation', order: 4, axis: [1, 0, 0] },
      { type: 'rotation', order: 4, axis: [0, 1, 0] },
      { type: 'rotation', order: 4, axis: [0, 0, 1] },
      { type: 'rotation', order: 3, axis: [1, 1, 1] },
      { type: 'mirror', normal: [1, 0, 0] },
      { type: 'mirror', normal: [0, 1, 0] },
      { type: 'mirror', normal: [0, 0, 1] },
      { type: 'inversion' }
    ]
  }
];

// Geometry generator functions
function createGeometry(type) {
  switch (type) {
    case 'scalene':
      return new THREE.BoxGeometry(1.8, 1.2, 0.9);
    case 'monoclinic':
      const monoGeo = new THREE.BoxGeometry(1.6, 1.2, 1);
      monoGeo.applyMatrix4(new THREE.Matrix4().makeShear(0.3, 0, 0, 0, 0, 0));
      return monoGeo;
    case 'orthorhombic':
      return new THREE.BoxGeometry(1.6, 1.2, 0.9);
    case 'tetragonal':
      return new THREE.BoxGeometry(1.2, 1.8, 1.2);
    case 'trigonal':
      return new THREE.CylinderGeometry(1.2, 1.2, 1.8, 3);
    case 'hexagonal':
      return new THREE.CylinderGeometry(1.2, 1.2, 1.8, 6);
    case 'cube':
      return new THREE.BoxGeometry(1.5, 1.5, 1.5);
    case 'tetrahedron':
      return new THREE.TetrahedronGeometry(1.3);
    default:
      return new THREE.BoxGeometry(1.5, 1.5, 1.5);
  }
}

function SymmetryObject({ group, showAxes, showPlanes, showInversion, autoRotate, animationMode }) {
  const meshRef = useRef();
  const groupRef = useRef();
  const cloneRef = useRef();
  const animationTimeRef = useRef(0);
  
  const geometry = useMemo(() => createGeometry(group.geometry), [group.geometry]);
  
  useFrame((state, delta) => {
    if (autoRotate && !animationMode && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
    
    // Handle animation in useFrame for better performance
    if (animationMode && cloneRef.current) {
      animationTimeRef.current += delta;
      const t = (animationTimeRef.current % 2) / 2; // 2 second loop
      
      // Reset transforms
      cloneRef.current.rotation.set(0, 0, 0);
      cloneRef.current.scale.set(1, 1, 1);
      cloneRef.current.position.set(0, 0, 0);
      
      if (animationMode.type === 'rotation') {
        const axis = new THREE.Vector3(...animationMode.axis).normalize();
        const angle = (2 * Math.PI / animationMode.order) * t;
        const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        cloneRef.current.setRotationFromQuaternion(quaternion);
      } else if (animationMode.type === 'mirror') {
        const normal = new THREE.Vector3(...animationMode.normal).normalize();
        // Reflect across the plane
        const scale = 1 - 2 * t;
        if (Math.abs(normal.x) > 0.5) cloneRef.current.scale.x = scale;
        if (Math.abs(normal.y) > 0.5) cloneRef.current.scale.y = scale;
        if (Math.abs(normal.z) > 0.5) cloneRef.current.scale.z = scale;
      } else if (animationMode.type === 'inversion') {
        const scale = 1 - 2 * t;
        cloneRef.current.scale.set(scale, scale, scale);
      }
    } else {
      animationTimeRef.current = 0;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Main crystal shape */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          color="#4a90e2"
          wireframe={false}
          transparent={true}
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Wireframe overlay */}
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#1a3a5a" wireframe={true} />
      </mesh>
      
      {/* Clone for animation */}
      {animationMode && (
        <group ref={cloneRef}>
          <mesh geometry={geometry}>
            <meshStandardMaterial
              color="#ff6b35"
              wireframe={false}
              transparent={true}
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh geometry={geometry}>
            <meshBasicMaterial color="#d64520" wireframe={true} />
          </mesh>
        </group>
      )}
      
      {/* Symmetry elements */}
      {group.operations.map((op, i) => {
        if (op.type === 'rotation' && showAxes) {
          const axis = new THREE.Vector3(...op.axis).normalize();
          const length = 3;
          const color = op.roto ? '#ff6b35' : '#e63946';
          
          return (
            <group key={`rot-${i}`}>
              <mesh
                position={axis.clone().multiplyScalar(length / 2)}
                quaternion={new THREE.Quaternion().setFromUnitVectors(
                  new THREE.Vector3(0, 1, 0),
                  axis
                )}
              >
                <cylinderGeometry args={[0.03, 0.03, length, 8]} />
                <meshBasicMaterial color={color} />
              </mesh>
              <Html position={axis.clone().multiplyScalar(length / 2 + 0.3)}>
                <div style={{
                  color: color,
                  fontSize: '11px',
                  fontWeight: 'bold',
                  background: 'rgba(255,255,255,0.9)',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap'
                }}>
                  {op.order}{op.roto ? '̄' : ''}
                </div>
              </Html>
            </group>
          );
        }
        
        if (op.type === 'mirror' && showPlanes) {
          const normal = new THREE.Vector3(...op.normal).normalize();
          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            normal
          );
          
          return (
            <mesh key={`mirror-${i}`} quaternion={quaternion}>
              <planeGeometry args={[2.5, 2.5]} />
              <meshBasicMaterial
                color="#2196f3"
                transparent={true}
                opacity={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        }
        
        if (op.type === 'inversion' && showInversion) {
          return (
            <group key={`inv-${i}`}>
              <mesh>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#1a1a1a" />
              </mesh>
              <Html position={[0, 0.3, 0]}>
                <div style={{
                  color: '#1a1a1a',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  background: 'rgba(255,255,255,0.9)',
                  padding: '2px 4px',
                  borderRadius: '3px'
                }}>
                  ī
                </div>
              </Html>
            </group>
          );
        }
        
        return null;
      })}
    </group>
  );
}

function Scene({ group, showAxes, showPlanes, showInversion, autoRotate, animationMode }) {
  return (
    <>
      <color attach="background" args={['#f8f9fa']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <SymmetryObject 
        group={group} 
        showAxes={showAxes}
        showPlanes={showPlanes}
        showInversion={showInversion}
        autoRotate={autoRotate}
        animationMode={animationMode}
      />
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      <gridHelper args={[10, 20, '#cccccc', '#e0e0e0']} position={[0, -2, 0]} />
    </>
  );
}

export default function CrystalSymmetryExplorer() {
  const [selectedGroup, setSelectedGroup] = useState(pointGroups[0]);
  const [showAxes, setShowAxes] = useState(true);
  const [showPlanes, setShowPlanes] = useState(true);
  const [showInversion, setShowInversion] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [filterSystem, setFilterSystem] = useState('All');
  const [animationMode, setAnimationMode] = useState(null);
  
  const systems = ['All', 'Triclinic', 'Monoclinic', 'Orthorhombic', 'Tetragonal', 'Trigonal', 'Hexagonal', 'Cubic'];
  
  const filteredGroups = filterSystem === 'All' 
    ? pointGroups 
    : pointGroups.filter(g => g.system === filterSystem);
  
  // Animation control - simplified
  const startAnimation = (operation) => {
    setAnimationMode(operation);
    setAutoRotate(false);
  };
  
  const stopAnimation = () => {
    setAnimationMode(null);
  };
  
  // Get available operations for current group
  const rotations = selectedGroup.operations.filter(op => op.type === 'rotation');
  const mirrors = selectedGroup.operations.filter(op => op.type === 'mirror');
  const hasInversion = selectedGroup.operations.some(op => op.type === 'inversion');
  
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Left Panel - Controls */}
      <div style={{ 
        width: '340px', 
        padding: '20px', 
        overflowY: 'auto',
        background: '#ffffff',
        borderRight: '1px solid #e0e0e0'
      }}>
        <h1 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '22px', 
          fontWeight: '700',
          color: '#1a1a1a'
        }}>
          Crystal Symmetry Explorer
        </h1>
        <p style={{ 
          margin: '0 0 20px 0', 
          fontSize: '13px', 
          color: '#666',
          lineHeight: '1.5'
        }}>
          Interactive visualization of the 32 crystallographic point groups
        </p>
        
        {/* Filter by Crystal System */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontSize: '13px', 
            fontWeight: '600',
            color: '#444'
          }}>
            Crystal System
          </label>
          <select 
            value={filterSystem}
            onChange={(e) => setFilterSystem(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              fontSize: '13px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: 'white'
            }}
          >
            {systems.map(sys => (
              <option key={sys} value={sys}>{sys}</option>
            ))}
          </select>
        </div>
        
        {/* Point Group Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontSize: '13px', 
            fontWeight: '600',
            color: '#444'
          }}>
            Point Group ({filteredGroups.length} total)
          </label>
          <select 
            value={selectedGroup.id}
            onChange={(e) => {
              const group = pointGroups.find(g => g.id === e.target.value);
              setSelectedGroup(group);
              stopAnimation();
            }}
            style={{ 
              width: '100%', 
              padding: '8px', 
              fontSize: '13px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: 'white'
            }}
          >
            {filteredGroups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} - {g.system}
              </option>
            ))}
          </select>
        </div>
        
        {/* Display Options */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '12px', 
          background: '#f5f5f5',
          borderRadius: '6px'
        }}>
          <h3 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '13px', 
            fontWeight: '600',
            color: '#444'
          }}>
            Display Options
          </h3>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '8px',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            <input 
              type="checkbox" 
              checked={showAxes}
              onChange={(e) => setShowAxes(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ color: '#e63946', fontWeight: '500' }}>●</span>
            <span style={{ marginLeft: '6px' }}>Rotation axes</span>
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '8px',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            <input 
              type="checkbox" 
              checked={showPlanes}
              onChange={(e) => setShowPlanes(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ color: '#2196f3', fontWeight: '500' }}>▢</span>
            <span style={{ marginLeft: '6px' }}>Mirror planes</span>
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '8px',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            <input 
              type="checkbox" 
              checked={showInversion}
              onChange={(e) => setShowInversion(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ color: '#1a1a1a', fontWeight: '500' }}>●</span>
            <span style={{ marginLeft: '6px' }}>Inversion center</span>
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            <input 
              type="checkbox" 
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ marginLeft: '6px' }}>Auto-rotate</span>
          </label>
        </div>
        
        {/* Animation Controls */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '12px', 
          background: '#fff3e0',
          borderRadius: '6px',
          borderLeft: '4px solid #ff9800'
        }}>
          <h3 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '13px', 
            fontWeight: '600',
            color: '#e65100'
          }}>
            Animate Symmetry Operations
          </h3>
          
          {animationMode && (
            <div style={{ 
              marginBottom: '10px', 
              padding: '8px', 
              background: '#ffecb3',
              borderRadius: '4px',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Animation active</span>
              <button
                onClick={stopAnimation}
                style={{
                  padding: '4px 8px',
                  background: '#e65100',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              >
                Stop
              </button>
            </div>
          )}
          
          {rotations.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#555' }}>
                Rotations:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {rotations.map((op, i) => (
                  <button
                    key={i}
                    onClick={() => startAnimation(op)}
                    disabled={animationMode !== null}
                    style={{
                      padding: '6px 10px',
                      background: animationMode === op ? '#ff9800' : '#fff',
                      color: animationMode === op ? '#fff' : '#e63946',
                      border: '1px solid #e63946',
                      borderRadius: '4px',
                      cursor: animationMode ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      opacity: animationMode && animationMode !== op ? 0.5 : 1
                    }}
                  >
                    {op.order}{op.roto ? '̄' : ''}-fold
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {mirrors.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#555' }}>
                Mirrors:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {mirrors.map((op, i) => (
                  <button
                    key={i}
                    onClick={() => startAnimation(op)}
                    disabled={animationMode !== null}
                    style={{
                      padding: '6px 10px',
                      background: animationMode === op ? '#ff9800' : '#fff',
                      color: animationMode === op ? '#fff' : '#2196f3',
                      border: '1px solid #2196f3',
                      borderRadius: '4px',
                      cursor: animationMode ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      opacity: animationMode && animationMode !== op ? 0.5 : 1
                    }}
                  >
                    Mirror {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {hasInversion && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#555' }}>
                Inversion:
              </div>
              <button
                onClick={() => startAnimation({ type: 'inversion' })}
                disabled={animationMode !== null}
                style={{
                  padding: '6px 10px',
                  background: animationMode?.type === 'inversion' ? '#ff9800' : '#fff',
                  color: animationMode?.type === 'inversion' ? '#fff' : '#1a1a1a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '4px',
                  cursor: animationMode ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  opacity: animationMode && animationMode?.type !== 'inversion' ? 0.5 : 1
                }}
              >
                Invert
              </button>
            </div>
          )}
          
          {rotations.length === 0 && mirrors.length === 0 && !hasInversion && (
            <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
              No symmetry operations to animate
            </div>
          )}
        </div>
        
        {/* Group Information */}
        <div style={{ 
          padding: '14px', 
          background: '#e3f2fd',
          borderRadius: '6px',
          borderLeft: '4px solid #2196f3'
        }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '15px', 
            fontWeight: '700',
            color: '#1565c0'
          }}>
            {selectedGroup.name}
          </h3>
          
          <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#333' }}>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong>System:</strong> {selectedGroup.system}
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong>Schoenflies:</strong> {selectedGroup.schoenflies}
            </p>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong>Description:</strong> {selectedGroup.description}
            </p>
            <p style={{ margin: '0' }}>
              <strong>Example:</strong> {selectedGroup.example}
            </p>
          </div>
        </div>
        
        {/* Legend */}
        <div style={{ 
          marginTop: '20px', 
          padding: '12px', 
          background: '#fafafa',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#666'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#444' }}>
            Symmetry Elements
          </h4>
          <div style={{ lineHeight: '1.6' }}>
            <div><span style={{ color: '#e63946' }}>●</span> Red axes: proper rotation (n)</div>
            <div><span style={{ color: '#ff6b35' }}>●</span> Orange axes: rotoinversion (n̄)</div>
            <div><span style={{ color: '#2196f3' }}>▢</span> Blue planes: mirror (m)</div>
            <div><span style={{ color: '#1a1a1a' }}>●</span> Black sphere: inversion (ī)</div>
            <div style={{ marginTop: '8px', color: '#ff6b35' }}>
              <span style={{ color: '#ff6b35' }}>●</span> Orange copy: animated operation
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          fontSize: '12px', 
          color: '#666',
          background: '#fff9e6',
          borderRadius: '6px',
          lineHeight: '1.5'
        }}>
          <strong>Controls:</strong> Drag to rotate • Scroll to zoom • Right-drag to pan
        </div>
      </div>
      
      {/* Right Panel - 3D Viewer */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Top info bar */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
              {selectedGroup.name}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              {selectedGroup.system} System • {selectedGroup.schoenflies}
            </div>
          </div>
          <div style={{ 
            textAlign: 'right',
            background: 'rgba(255,255,255,0.2)',
            padding: '8px 12px',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '2px' }}>Example Mineral</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>{selectedGroup.example}</div>
          </div>
        </div>
        
        {/* Canvas */}
        <div style={{ flex: 1 }}>
          <Canvas camera={{ position: [4, 3, 4], fov: 50 }}>
            <Scene 
              group={selectedGroup}
              showAxes={showAxes}
              showPlanes={showPlanes}
              showInversion={showInversion}
              autoRotate={autoRotate}
              animationMode={animationMode}
            />
          </Canvas>
        </div>
        
        {/* Bottom info panel */}
        <div style={{
          padding: '16px 24px',
          background: '#f8f9fa',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>
              SYMMETRY OPERATIONS
            </div>
            <div style={{ fontSize: '13px', color: '#333' }}>
              {rotations.length} rotation{rotations.length !== 1 ? 's' : ''} • {' '}
              {mirrors.length} mirror{mirrors.length !== 1 ? 's' : ''} • {' '}
              {hasInversion ? '1 inversion' : 'no inversion'}
            </div>
          </div>
          
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>
              CRYSTAL DESCRIPTION
            </div>
            <div style={{ fontSize: '13px', color: '#333' }}>
              {selectedGroup.description}
            </div>
          </div>
          
          {animationMode && (
            <div style={{ 
              flex: 1, 
              minWidth: '200px',
              background: '#fff3e0',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #ff9800'
            }}>
              <div style={{ fontSize: '11px', color: '#e65100', marginBottom: '4px', fontWeight: '600' }}>
                ANIMATION ACTIVE
              </div>
              <div style={{ fontSize: '13px', color: '#333' }}>
                {animationMode.type === 'rotation' && `${animationMode.order}-fold rotation`}
                {animationMode.type === 'mirror' && 'Mirror reflection'}
                {animationMode.type === 'inversion' && 'Inversion through center'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
