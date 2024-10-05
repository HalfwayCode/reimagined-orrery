import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js';

// Create the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up the camera position
camera.position.set(0, 0, 30);

// Create a div to display the planet/sun name
const objectNameDiv = document.createElement('div');
objectNameDiv.style.position = 'absolute';
objectNameDiv.style.color = 'white';
objectNameDiv.style.padding = '5px';
objectNameDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
objectNameDiv.style.borderRadius = '5px';
objectNameDiv.style.display = 'none'; // Initially hidden
document.body.appendChild(objectNameDiv);

// Create a section to display detailed info about the clicked planet
const infoSection = document.createElement('div');
infoSection.style.position = 'absolute';
infoSection.style.top = '50px';
infoSection.style.right = '50px';
infoSection.style.color = 'white';
infoSection.style.padding = '20px';
infoSection.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
infoSection.style.borderRadius = '10px';
infoSection.style.display = 'none'; // Initially hidden
document.body.appendChild(infoSection);

// Orbit control setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth control updates
controls.dampingFactor = 0.25;  // Control smoothness
controls.screenSpacePanning = false; // Disable panning in the screen space
controls.enableZoom = true;

// Kepler solver functions (Kepler's laws for planet orbits)
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

  // Apply 3D rotations
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
  { a: 3, e: 0.205, T: 88, color: 0xaaaaaa, name: 'Mercury', description: 'Mercury is the smallest planet in the Solar System.' },
  { a: 5, e: 0.0067, T: 225, color: 0xff4500, name: 'Venus', description: 'Venus is the second planet from the Sun and is the hottest.' },
  { a: 7, e: 0.0167, T: 365, color: 0x0000ff, name: 'Earth', description: 'Earth is the third planet from the Sun and the only known planet to harbor life.' },
  { a: 9, e: 0.0934, T: 687, color: 0xff0000, name: 'Mars', description: 'Mars is the fourth planet and is often called the "Red Planet".' },
  { a: 12, e: 0.0489, T: 4331, color: 0xffa500, name: 'Jupiter', description: 'Jupiter is the largest planet in the Solar System.' },
  { a: 16, e: 0.0565, T: 10747, color: 0xffff00, name: 'Saturn', description: 'Saturn is known for its extensive ring system.' },
  { a: 20, e: 0.046, T: 30589, color: 0x00ffff, name: 'Uranus', description: 'Uranus is the seventh planet and has a unique sideways rotation.' },
  { a: 24, e: 0.0097, T: 59800, color: 0x0000ff, name: 'Neptune', description: 'Neptune is the eighth planet and is known for its deep blue color.' }
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
  planetMesh.userData = { name: planet.name, description: planet.description };
  scene.add(planetMesh);
  return planetMesh;
});

// Create Sun
const sunGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.userData = { name: "Sun", description: "The Sun is the star at the center of the Solar System." };
scene.add(sunMesh);

// Create Moon
const moonGeometry = new THREE.SphereGeometry(0.05, 16, 16);
const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
moonMesh.userData = { name: "Moon", description: "The Moon is Earth's only natural satellite." };
scene.add(moonMesh);

// Update positions of the planets and moon
let clock = 0;
function animate() {
  requestAnimationFrame(animate);
  clock += 0.01;

  planetMeshes.forEach((planet, index) => {
    const loc = propagate(clock, planets[index]);
    planet.position.copy(loc);
  });

  // Position moon relative to the Earth (third planet)
  const earthPosition = planetMeshes[2].position; // Earth is the third planet
  moonMesh.position.set(earthPosition.x + 0.2, earthPosition.y, earthPosition.z);
  
  // Render the scene
  controls.update();
  renderer.render(scene, camera);
}

// Click event to display object name and info
renderer.domElement.addEventListener('click', (event) => {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);
  
  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;
    objectNameDiv.style.display = 'block';
    objectNameDiv.style.left = `${event.clientX}px`;
    objectNameDiv.style.top = `${event.clientY}px`;
    objectNameDiv.innerHTML = `${intersectedObject.userData.name}`;

    // Display additional info
    infoSection.innerHTML = intersectedObject.userData.description;
    infoSection.style.display = 'block';
  } else {
    objectNameDiv.style.display = 'none';
    infoSection.style.display = 'none';
  }
});

// Responsive resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the animation
animate();