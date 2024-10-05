import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js';

// Create the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up the camera position
camera.position.set(15, 10, 15); // Move the camera further back
camera.lookAt(0, 0, 0); // Ensure it looks at the center of the scene


// Orbit control setup
/*
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.minPolarAngle = 0; // Allow looking all the way down
controls.maxPolarAngle = Math.PI; // Allow looking fully up (180 degrees)
controls.minDistance = 1;
controls.maxDistance = 50;
*/

// Orbit control setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth control updates
controls.dampingFactor = 0.25;  // Control smoothness
controls.screenSpacePanning = false; // Disable panning in the screen space

// Allow looking straight down and up
controls.minPolarAngle = 0; // Minimum vertical angle (down)
controls.maxPolarAngle = Math.PI; // Maximum vertical angle (up)

// Set zoom limits
controls.minDistance = 1; // Minimum zoom distance
controls.maxDistance = 50; // Maximum zoom distance


// Kepler solver functions
function keplerStart3(e, M) {
  return M + e * Math.sin(M); // Simplified starting approximation
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

// Propagate function to calculate the position of the planet based on the clock
function propagate(clock, planetParams) {
  const { a, e, T } = planetParams;
  const n = (2 * Math.PI) / T; // Mean motion
  const M = n * clock; // Mean anomaly
  const E = keplerSolve(e, M); // Solve for eccentric anomaly
  const cose = Math.cos(E);
  const sine = Math.sin(E);

  // Calculate radial distance
  const r = a * (1 - e * cose); // Adjusted for eccentricity

  // Calculate position in 3D (orbital plane)
  const s_x = r * (cose - e); // X position in orbit
  const s_y = r * sine * Math.sqrt(1 - e ** 2); // Y position in orbit
  const s_z = 0; // You might adjust this for 3D representation if necessary

  // Apply 3D rotations (rotate around y, z, and x)
  let point = new THREE.Vector3(s_x, s_y, s_z);

  // Rotate around Y (pi/5), Z (pi/4), X (pi/4)
  const rotateY = new THREE.Matrix4().makeRotationY(Math.PI / 5);
  const rotateZ = new THREE.Matrix4().makeRotationZ(Math.PI / 4);
  const rotateX = new THREE.Matrix4().makeRotationX(Math.PI / 4);
  point.applyMatrix4(rotateY).applyMatrix4(rotateZ).applyMatrix4(rotateX);

  return point;
}

// Planet parameters (semi-major axis, eccentricity, period, and color)
const planets = [
  { a: 3, e: 0.205, T: 88, color: 0xaaaaaa, name: 'Mercury' },
  { a: 5, e: 0.0067, T: 225, color: 0xff4500, name: 'Venus' },
  { a: 7, e: 0.0167, T: 365, color: 0x0000ff, name: 'Earth' },
  { a: 9, e: 0.0934, T: 687, color: 0xff0000, name: 'Mars' },
  { a: 12, e: 0.0489, T: 4331, color: 0xffa500, name: 'Jupiter' },
  { a: 16, e: 0.0565, T: 10747, color: 0xffff00, name: 'Saturn' },
  { a: 20, e: 0.046, T: 30589, color: 0x00ffff, name: 'Uranus' },
  { a: 24, e: 0.0097, T: 59800, color: 0x0000ff, name: 'Neptune' }
];

// Generate orbit points for each planet and draw their orbits
planets.forEach(planet => {
  const orbitPoints = [];
  const ts = 100; // Number of time slices for orbit points

  // Generate orbit points
  for (let clock = 0; clock < ts; clock++) {
    const loc = propagate(clock, planet);
    orbitPoints.push(loc);

    // Create a small sphere at each orbit point
    const orbitPointGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const orbitPointMaterial = new THREE.MeshBasicMaterial({ color: planet.color });
    const orbitPointMesh = new THREE.Mesh(orbitPointGeometry, orbitPointMaterial);
    orbitPointMesh.position.copy(loc);
    scene.add(orbitPointMesh);
  }

  // Create the orbit path using LineSegments
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  scene.add(orbitLine);
});

// Create a moving body (planet) for each planet
const planetMeshes = planets.map(planet => {
  const planetGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const planetMaterial = new THREE.MeshBasicMaterial({ color: planet.color });
  const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
  scene.add(planetMesh);
  return planetMesh;
});

// Create Sun
const sunGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sunMesh);

// Create Moon
const moonGeometry = new THREE.SphereGeometry(0.05, 16, 16);
const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
scene.add(moonMesh);

// Create asteroid instanced mesh
const asteroidGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
const asteroidMesh = new THREE.InstancedMesh(asteroidGeometry, asteroidMaterial, 1000); // 1000 asteroids
scene.add(asteroidMesh);

// Set random positions for asteroids
for (let i = 0; i < 1000; i++) {
  const position = new THREE.Vector3(
    Math.random() * 100 - 50, // random x position
    Math.random() * 100 - 50, // random y position
    Math.random() * 100 - 50  // random z position
  );
  const matrix = new THREE.Matrix4().setPosition(position);
  asteroidMesh.setMatrixAt(i, matrix);
}

let clock = 0; // Time counter

// Animation loop
// Update the eclipse logic in your animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Update orbit controls

  // Update the position of each planet along its orbit
  planets.forEach((planet, i) => {
    const loc = propagate(clock, planet);
    planetMeshes[i].position.copy(loc);
  });

  // Position the Sun and the Moon
  const earthPosition = propagate(clock, planets[2]); // Earth index is 2
  sunMesh.position.set(0, 0, 0); // Sun is at the origin

  // Calculate moon's position
  const moonOrbitRadius = 0.3; // Distance from Earth to Moon
  const moonAngle = clock * 2 * Math.PI / 30; // Adjust speed as needed
  moonMesh.position.x = earthPosition.x + moonOrbitRadius * Math.cos(moonAngle);
  moonMesh.position.y = earthPosition.y + moonOrbitRadius * Math.sin(moonAngle);
  moonMesh.position.z = earthPosition.z; // Keep it in the same plane

  // Determine if an eclipse occurs
  const distanceToSun = sunMesh.position.distanceTo(moonMesh.position);
  const moonRadius = moonMesh.geometry.parameters.radius; 
  const sunRadius = sunMesh.geometry.parameters.radius;

  // Calculate apparent size based on distances
  const sunDistance = sunMesh.position.distanceTo(earthPosition);
  const moonDistance = moonMesh.position.distanceTo(earthPosition);
  
  const sunApparentSize = sunRadius / sunDistance;
  const moonApparentSize = moonRadius / moonDistance;

  // Determine eclipse type
  if (moonApparentSize >= sunApparentSize) {
      // Total eclipse
      moonMesh.scale.set(1.5, 1.5, 1.5); // Scale up for total eclipse effect
      moonMesh.material.color.set(0x000000); // Change color for total eclipse
  } else {
      // Partial eclipse
      moonMesh.scale.set(1, 1, 1); // Normal scale for partial eclipse
      moonMesh.material.color.set(0x808080); // Change color for partial eclipse
  }

  clock += 0.05; // Increment the clock (time)

  renderer.render(scene, camera);
}

animate();
