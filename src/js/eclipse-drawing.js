import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js';

// Create the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set the initial camera position
const cameraDistance = 3;
camera.position.set(cameraDistance, 1, cameraDistance);
camera.lookAt(0, 0, 0);

// Orbit control setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 1;
controls.maxDistance = 10;

// Orbital parameters
const a = 1; // semi-major axis
const e = 1 / Math.sqrt(2); // eccentricity
const ts = 120; // Number of time slices

const clock = new THREE.Clock();
const orbitPoints = [];

// Function to calculate the eccentric anomaly E
function keplerStart3(e, M) {
  const t34 = e ** 2;
  const t35 = e * t34;
  const t33 = Math.cos(M);
  return M + (-0.5 * t35 + e + (t34 + (3 / 2) * t33 * t35) * t33) * Math.sin(M);
}

function eps3(e, M, x) {
  const t1 = Math.cos(x);
  const t2 = -1 + e * t1;
  const t3 = Math.sin(x);
  const t4 = e * t3;
  const t5 = -x + t4 + M;
  const t6 = t5 / ((0.5 * t5 * t4 / t2) + t2);
  return t5 / ((0.5 * t3 - (1 / 6) * t1 * t6) * e * t6 + t2);
}

function keplerSolve(e, M) {
  const tol = 1.0e-14;
  const Mnorm = M % (2 * Math.PI);
  let E0 = keplerStart3(e, Mnorm);
  let dE = tol + 1;
  let count = 0;

  while (dE > tol) {
    const E = E0 - eps3(e, Mnorm, E0);
    dE = Math.abs(E - E0);
    E0 = E;
    count++;

    if (count === 100) {
      console.warn("KeplerSolve failed to converge!");
      break;
    }
  }
  return E0;
}

// Generate orbit points and create orbit point spheres
for (let i = 0; i < ts; i++) {
  const M = (2 * Math.PI / ts) * i; // Mean anomaly
  const E = keplerSolve(e, M); // Solve for Eccentric anomaly
  const r = a * (1 - e * Math.cos(E));
  
  // 3D positions considering rotation
  const x = r * (Math.cos(E) - e); // Adjusted for focus
  const y = r * Math.sqrt(1 - e * e) * Math.sin(E);
  const z = 0; // Keep Z at 0 for now; can be adjusted for 3D

  // Apply rotations to the position
  const rotateY = new THREE.Matrix4().makeRotationY(Math.PI / 5);
  const rotateZ = new THREE.Matrix4().makeRotationZ(Math.PI / 4);
  const rotateX = new THREE.Matrix4().makeRotationX(Math.PI / 4);
  
  const position = new THREE.Vector3(x, y, z).applyMatrix4(rotateY).applyMatrix4(rotateZ).applyMatrix4(rotateX);
  orbitPoints.push(position);
  
  // Create a small sphere at each orbit point
  const orbitPointGeometry = new THREE.SphereGeometry(0.02, 8, 8);
  const orbitPointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const orbitPointMesh = new THREE.Mesh(orbitPointGeometry, orbitPointMaterial);
  orbitPointMesh.position.copy(position);
  scene.add(orbitPointMesh);
}

// Create the orbit path using LineSegments
const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
scene.add(orbitLine);

// Create a small moving body
const bodyGeometry = new THREE.SphereGeometry(0.04, 8, 8);
const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
scene.add(bodyMesh);

let currentIndex = 0;

function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Update orbit controls

  // Update the position of the moving body
  bodyMesh.position.copy(orbitPoints[currentIndex]);
  currentIndex = (currentIndex + 1) % orbitPoints.length; // Loop through orbit points

  renderer.render(scene, camera);
}

animate();
