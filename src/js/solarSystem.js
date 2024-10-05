
export function solar(THREE, OrbitControls) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    let cameraObject;
    let offset;
    let kek;
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

    const light = new THREE.PointLight(0xffffff, 2, 100);
    light.position.set(0, 0, 0);
    scene.add(light);
    
    const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData = { name: "Sun", description: "The Sun is the star at the center of the Solar System." };
    scene.add(sun);
    const solarSystemGroup = new THREE.Group();
    solarSystemGroup.add(sun);
    scene.add(solarSystemGroup);
        
    function createPlanet(size, color, distance, name, description) {
        const planetGeometry = new THREE.SphereGeometry(size, 32, 32);
        const planetMaterial = new THREE.MeshLambertMaterial({ color: color });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);

        planet.userData = { name, description };

        const pivot = new THREE.Object3D();
        pivot.position.set(0, 0, 0);
        scene.add(pivot);

        planet.position.set(distance, 0, 0);
        pivot.add(planet);

        return { planet, pivot };
    }

    const planets = [
        createPlanet(0.5, 0xaaaaaa, 3, "Mercury", "Mercury is the smallest planet in the Solar System."),
        createPlanet(0.6, 0xff4500, 5, "Venus", "Venus is the second planet from the Sun and is the hottest."),
        createPlanet(0.7, 0x0000ff, 7, "Earth", "Earth is the third planet from the Sun and the only known planet to harbor life."),
        createPlanet(0.6, 0xff0000, 9, "Mars", "Mars is the fourth planet and is often called the 'Red Planet'."),
        createPlanet(1.2, 0xffa500, 12, "Jupiter", "Jupiter is the largest planet in the Solar System."),
        createPlanet(1.0, 0xffff00, 16, "Saturn", "Saturn is known for its extensive ring system."),
        createPlanet(0.8, 0x00ffff, 20, "Uranus", "Uranus is the seventh planet and has a unique sideways rotation."),
        createPlanet(0.75, 0x0000ff, 24, "Neptune", "Neptune is the eighth planet and is known for its deep blue color.")
    ];

    const celestialBodies = planets.map(p => p.planet);
    celestialBodies.push(sun);

    camera.position.set(0, 0, 30);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;

    // Update camera and renderer on window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('click', onMouseClick, false);

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        objectNameDiv.style.left = event.clientX + 10 + 'px';
        objectNameDiv.style.top = event.clientY + 10 + 'px';
    }
    
    function onMouseClick(event) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(celestialBodies);
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            cameraObject = clickedObject;
            const independentPosition = getIndependentPosition(clickedObject);
            // Display detailed info about the clicked planet/sun
            infoSection.innerHTML = `<h2>${clickedObject.userData.name}</h2><p>${clickedObject.userData.description}</p>`;
            infoSection.style.display = 'block';
        } else {
            // Hide the info section if clicked on empty space
            infoSection.style.display = 'none';
        }
    }
    function getIndependentPosition(obj) {
        const worldPosition = new THREE.Vector3();
        obj.getWorldPosition(worldPosition); // Używamy getWorldPosition
        return {
            x: worldPosition.x,
            y: worldPosition.y,
            z: worldPosition.z
        };
    }
    function animate() {
        requestAnimationFrame(animate);

        offset = new THREE.Vector3(0, 0, 0); 
        //solarSystemGroup.position.copy(offset);

        sun.rotation.y += 0.005;

        planets.forEach((item, index) => {
            const { planet, pivot } = item;
            pivot.rotation.y += 0.01 / (index + 1);
        });
        kek = getIndependentPosition(cameraObject);
        controls.target.set(kek.x,
            kek.y,
            kek.z);
        camera.position.set(kek.x,kek.y,kek.z+5)
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
