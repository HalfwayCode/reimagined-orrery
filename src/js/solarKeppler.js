export function solarKeppler(THREE, OrbitControls) {
  // Create the scene, camera, and renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Set up the camera position
  camera.position.set(30, 20, 30); // Move the camera further back
  camera.lookAt(0, 0, 0); // Ensure it looks at the center of the scene

  // Orbit control setup
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Smooth control updates
  controls.dampingFactor = 0.25; // Control smoothness
  controls.screenSpacePanning = false; // Disable panning in the screen space
  controls.minPolarAngle = 0; // Minimum vertical angle (down)
  controls.maxPolarAngle = Math.PI; // Maximum vertical angle (up)
  controls.minDistance = 1; // Minimum zoom distance
  controls.maxDistance = 50; // Maximum zoom distance

  // Scale factor
  const scaleFactor = 0.5; // Define the desired scale factor

  // Kepler solver functions
  function keplerStart3(e, M) {
      const t33 = Math.cos(M);
      const t34 = e * e;
      const t35 = e * t34;
      return M + (-0.5 * t35 + e + (t34 + 1.5 * t33 * t35) * t33) * Math.sin(M);
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

      // Calculate radial distance and apply scale factor
      const r = (a * scaleFactor) * (1 - e * cose); // Adjusted for eccentricity and scaled

      // Calculate position in 3D (orbital plane) and apply scale factor
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

  // Variable to store comets
  let comets = []; // Initialize comets variable here

  // Function to draw an ellipse orbit
  function drawOrbit(scene, planetParams, color = 0x000000) {
      const ts = Math.ceil(planetParams.T * 2); // Dynamic ts value based on semi-major axis
      const orbitPoints = [];

      // Generate orbit points over time slices
      for (let clock = 0; clock < ts; clock++) {
          const loc = propagate(clock, planetParams);
          orbitPoints.push(loc);
      }

      // Create geometry for the orbit
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({ color: color });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbitLine); // Add the orbit line to the scene
  }

  // Generate orbit points for each planet and draw their orbits
  planets.forEach(planet => {
      drawOrbit(scene, planet, planet.color); // Call the drawOrbit function for each planet
  });

  // Create a moving body (planet) for each planet
  const planetMeshes = planets.map(planet => {
      const planetGeometry = new THREE.SphereGeometry(0.3 * scaleFactor, 16, 16); // Scale the size
      const planetMaterial = new THREE.MeshBasicMaterial({ color: planet.color });
      const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
      scene.add(planetMesh);
      return planetMesh;
  });

  // Create Sun
  const sunGeometry = new THREE.SphereGeometry(0.5 * scaleFactor, 32, 32); // Scale the Sun size
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sunMesh);

  // Create Moon
  const moonGeometry = new THREE.SphereGeometry(0.05 * scaleFactor, 16, 16); // Scale the Moon size
  const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
  const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
  scene.add(moonMesh);

  // Fetch the comet data from the NASA API
  fetch('https://data.nasa.gov/resource/b67r-rgxc.json')
      .then(response => {
          console.log('Received response from NASA API:', response);
          return response.json();
      })
      .then(data => {
          console.log('Received comet data from NASA API:', data);
          // Process the comet data
          comets = data.map(comet => {
              return {
                  name: comet.name,
                  x: parseFloat(comet.x) || 0, // Ensure x is a number, default to 0 if NaN
                  y: parseFloat(comet.y) || 0, // Ensure y is a number, default to 0 if NaN
                  z: parseFloat(comet.z) || 0, // Ensure z is a number, default to 0 if NaN
                  color: 0xffffff
              };
          });

          console.log('Processed comet data:', comets);

          // Create a mesh for each comet
          const cometMeshes = comets.map(comet => {
              const cometGeometry = new THREE.SphereGeometry(0.1, 16, 16);
              const cometMaterial = new THREE.MeshBasicMaterial({ color: comet.color });
              const cometMesh = new THREE.Mesh(cometGeometry, cometMaterial);
              cometMesh.name = comet.name; // Set the name for referencing later
              scene.add(cometMesh);
              return cometMesh;
          });

          console.log('Created comet meshes:', cometMeshes);
      })
      .catch(error => {
          console.error('Error fetching comet data:', error);
      });

  let clock = 0; // Time counter

  // Animation loop
  function animate() {
      requestAnimationFrame(animate);
      controls.update(); // Update orbit controls

      // Update the position of each comet
      comets.forEach((comet, i) => {
          const cometMesh = scene.getObjectByName(comet.name);
          if (cometMesh) { // Ensure cometMesh exists
              cometMesh.position.set(comet.x, comet.y, comet.z);
          }
      });

      // Update the position of each planet along its orbit
      planets.forEach((planet, i) => {
          const loc = propagate(clock, planet);
          planetMeshes[i].position.copy(loc);
      });

      // Position the Sun and the Moon
      const earthPosition = propagate(clock, planets[2]); // Earth index is 2
      sunMesh.position.set(0, 0, 0); // Sun is at the origin

      // Calculate moon's position
      const moonOrbitRadius = 0.5 * scaleFactor; // Distance from Earth to Moon
      const moonAngle = clock * 2 * Math.PI / 10; // Adjust speed as needed (increased to 10)
      moonMesh.position.x = earthPosition.x + moonOrbitRadius * Math.cos(moonAngle);
      moonMesh.position.y = earthPosition.y + moonOrbitRadius * Math.sin(moonAngle);
      moonMesh.position.z = 0; // Keep Moon on the same plane for simplicity

      renderer.render(scene, camera); // Render the scene
      clock += 0.05; // Increment time
  }

  animate(); // Start the animation loop
}
