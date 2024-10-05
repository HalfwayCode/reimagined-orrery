const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.PointLight(0xffffff, 2, 100);
light.position.set(0, 0, 0);
scene.add(light);

const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);


raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();

// Dodanie event listenera na kliknięcia myszy
window.addEventListener('click', onMouseClick, false);
function onMouseClick(event) {
    // Przekształcenie współrzędnych myszy na współrzędne NDC (Normalized Device Coordinates)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Ustawienie Raycastera
    raycaster.setFromCamera(mouse, camera);

    // Sprawdzenie przecięć z obiektami w scenie
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        // Wybór pierwszego przeciętego obiektu
        selectedObject = intersects[0].object;

        // Wykonanie jakiejś akcji (np. zmiana koloru)
        selectedObject.material.color.set(0xff0000); // Zmiana koloru na czerwony
        console.log('Kliknięto obiekt:', selectedObject);
    }
}
function createPlanet(size, color, distance) {
    const planetGeometry = new THREE.SphereGeometry(size, 32, 32);
    const planetMaterial = new THREE.MeshLambertMaterial({ color: color });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);

    const pivot = new THREE.Object3D();
    pivot.position.set(0, 0, 0);
    scene.add(pivot);
    
    planet.position.set(distance, 0, 0);
    pivot.add(planet);
    
    return { planet, pivot };
}

const planets = [
    createPlanet(0.5, 0xaaaaaa, 3),   // Mercury
    createPlanet(0.6, 0xff4500, 5),   // Venus
    createPlanet(0.7, 0x0000ff, 7),   // Earth
    createPlanet(0.6, 0xff0000, 9),   // Mars
    createPlanet(1.2, 0xffa500, 12),  // Jupiter
    createPlanet(1.0, 0xffff00, 16),  // Saturn
    createPlanet(0.8, 0x00ffff, 20),  // Ur anus
    createPlanet(0.75, 0x0000ff, 24), // Neptune
];

camera.position.z = 25;

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;

function animate() {
    
    requestAnimationFrame(animate);

    sun.rotation.y += 0.005;

    planets.forEach((item, index) => {
        const { planet, pivot } = item;
        pivot.rotation.y += 0.01 / (index + 1);
    });

    controls.update();
    renderer.render(scene, camera);
}

animate();