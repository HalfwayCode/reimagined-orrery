export function solar(THREE, OrbitControls) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Create a div to display the planet/sun name
    const objectNameDiv = document.createElement('div');
    objectNameDiv.style.position = 'absolute';
    objectNameDiv.style.color = 'white';
    objectNameDiv.style.padding = '5px';
    objectNameDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    objectNameDiv.style.borderRadius = '5px';
    objectNameDiv.style.display = 'none'; // Initially hidden
    document.body.appendChild(objectNameDiv);

    const light = new THREE.PointLight(0xffffff, 2, 100);
    light.position.set(0, 0, 0);
    scene.add(light);

    const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData = { name: "Sun" };
    scene.add(sun);

    function createPlanet(size, color, distance, name) {
        const planetGeometry = new THREE.SphereGeometry(size, 32, 32);
        const planetMaterial = new THREE.MeshLambertMaterial({ color: color });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);

        planet.userData = { name };

        const pivot = new THREE.Object3D();
        pivot.position.set(0, 0, 0);
        scene.add(pivot);

        planet.position.set(distance, 0, 0);
        pivot.add(planet);

        return { planet, pivot };
    }

    const planets = [
        createPlanet(0.5, 0xaaaaaa, 3, "Mercury"),
        createPlanet(0.6, 0xff4500, 5, "Venus"),
        createPlanet(0.7, 0x0000ff, 7, "Earth"),
        createPlanet(0.6, 0xff0000, 9, "Mars"),
        createPlanet(1.2, 0xffa500, 12, "Jupiter"),
        createPlanet(1.0, 0xffff00, 16, "Saturn"),
        createPlanet(0.8, 0x00ffff, 20, "Uranus"),
        createPlanet(0.75, 0x0000ff, 24, "Neptune")
    ];

    const celestialBodies = planets.map(p => p.planet);
    celestialBodies.push(sun);

    camera.position.z = 25;

    const controls = new OrbitControls(camera, renderer.domElement); // Use OrbitControls directly
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;

    document.addEventListener('mousemove', onMouseMove, false);

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        objectNameDiv.style.left = event.clientX + 10 + 'px';
        objectNameDiv.style.top = event.clientY + 10 + 'px';
    }

    function animate() {
        requestAnimationFrame(animate);

        sun.rotation.y += 0.005;

        planets.forEach((item, index) => {
            const { planet, pivot } = item;
            pivot.rotation.y += 0.01 / (index + 1);
        });

        controls.update();
        renderer.render(scene, camera);

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(celestialBodies);

        celestialBodies.forEach(body => {
            body.material.emissive && body.material.emissive.set(0x000000); // Reset the emissive color if the material supports it
        });

        if (intersects.length > 0) {
            intersects[0].object.material.emissive && intersects[0].object.material.emissive.set(0x00ff00);

            objectNameDiv.style.display = 'block';
            objectNameDiv.innerHTML = intersects[0].object.userData.name;
        } else {
            objectNameDiv.style.display = 'none';
        }
    }

    animate();
}
