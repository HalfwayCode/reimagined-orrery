import { cameraWork } from './cameraWork.js';
import { EffectComposer } from 'EffectComposer';
import { RenderPass } from 'RenderPass';
import { UnrealBloomPass } from 'UnrealBloomPass';
import { FilmPass } from 'FilmPass';
import { SMAAPass } from 'SMAAPass';


export function solar(THREE, OrbitControls) {

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    let cameraObject;
    let offset;
    let kek;

    //composer do post processingu
    const composer = new EffectComposer(renderer);

    const renderPass = new RenderPass( scene, camera );
    composer.addPass( renderPass );

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 5, 0.4, 0.9);
    composer.addPass(bloomPass);

    const filmPass = new FilmPass( 0.2, 0.3, 1 , 0);
    composer.addPass(filmPass);

    const smaaPass = new SMAAPass();
    composer.addPass(smaaPass);
    let cameraMode=0;
    let baseSpeed = 0.001;
    let speedModifier = 10.0;

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

    const light = new THREE.PointLight(0xffffff, 1, 50);
    light.position.set(0, 0, 0);
    scene.add(light);

    //oswietlenie ambient
    const ambientLight = new THREE.AmbientLight(0x1c1c1c);
    scene.add(ambientLight);
    
    //setting background image
    const spaceTexture = new THREE.TextureLoader().load('../../src/assets/textures/8k_stars_milky_way.jpg');
    scene.background = spaceTexture;

    //Utwórz sferę jako tło
    const sphereGeometry = new THREE.SphereGeometry(800, 128, 128); // Duży promień
    const sphereMaterial = new THREE.MeshBasicMaterial({
        map: spaceTexture,
        side: THREE.BackSide // Odwróć materiał, aby był widoczny z wnętrza
    });
    const backgroundSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(backgroundSphere);

    // 3. Opcjonalnie: Ustaw sferę jako dziecko kamery
    //camera.add(backgroundSphere); // Teraz sfera będzie obracać się razem z kamerą

    //load textures
    const sunTexture = new THREE.TextureLoader().load('../../src/assets/textures/2k_sun.jpg');
    
    const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);

    sun.userData = { name: "Sun", description: "The Sun is the star at the center of the Solar System." };
    scene.add(sun);

    cameraObject = sun;

    const solarSystemGroup = new THREE.Group();
    solarSystemGroup.add(sun);
    scene.add(solarSystemGroup);

    function createRing(size, color) {
        const ringGeometry = new THREE.RingGeometry(size, size + 0.5, 64); // Zewnętrzny promień + grubość
        const ringMaterial = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.31 });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Ustawienie pierścienia w poziomie
        return ring;
    }
    
    function createPlanet(size, color, distance, name, description, distanceFromSun, orbitalPeriod, numberOfMoons, type) {
        const planetTexture = new THREE.TextureLoader().load(`../../src/assets/textures/2k_${name.toLowerCase()}.jpg`)
        const planetGeometry = new THREE.SphereGeometry(size, 32, 32);
        const planetMaterial = new THREE.MeshLambertMaterial({ map: planetTexture });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    
        planet.userData = {
            name,
            description,
            distanceFromSun,
            orbitalPeriod,
            numberOfMoons,
            type 
        };
    
        const pivot = new THREE.Object3D();
        pivot.position.set(0, 0, 0);
        scene.add(pivot);
    
        planet.position.set(distance, 0, 0);
        pivot.add(planet);
        console.log(planet.position.x);

        if (name.toLowerCase() === 'saturn') {
            const ring = createRing(size * 1.5, 0x998e77); // Ustal odpowiednią wielkość i kolor
            ring.position.set(distance, 0, 0);
            pivot.add(ring); // Dodaj pierścień do obiektu pivot
        }

        return { planet, pivot };
    }
    

    const planets = [
        createPlanet(0.5, 0xaaaaaa, 3, "Mercury", "Mercury is the smallest planet in the Solar System.", "57.91 million km", "88 days", 0, "rocky"),
        createPlanet(0.6, 0xff4500, 5, "Venus", "Venus is the second planet from the Sun and is the hottest.", "108.2 million km", "225 days", 0, "rocky"),
        createPlanet(0.7, 0x0000ff, 7, "Earth", "Earth is the third planet from the Sun and the only known planet to harbor life.", "149.6 million km", "365.25 days", 1, "rocky"),
        createPlanet(0.6, 0xff0000, 9, "Mars", "Mars is the fourth planet and is often called the 'Red Planet'.", "227.9 million km", "687 days", 2, "rocky"),
        createPlanet(1.2, 0xffa500, 12, "Jupiter", "Jupiter is the largest planet in the Solar System.", "778.5 million km", "11.86 years", 75, "gas giant"),
        createPlanet(1.0, 0xffff00, 16, "Saturn", "Saturn is known for its extensive ring system.", "1.4 billion km", "29 years", 82, "gas giant"),
        createPlanet(0.8, 0x00ffff, 20, "Uranus", "Uranus is the seventh planet and has a unique sideways rotation.", "2.87 billion km", "84 years", 27, "ice giant"),
        createPlanet(0.75, 0x0000ff, 24, "Neptune", "Neptune is the eighth planet and is known for its deep blue color.", "4.5 billion km", "164.8 years", 14, "ice giant")
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
    document.addEventListener('keydown', handleKeyDown, false);

    const scrollbar = document.getElementById('scrollbar');

    scrollbar.addEventListener('input', () => {
        const value = parseInt(scrollbar.value, 10); //scrollbar.value 0-100
        speedModifier = value / 5; //speedModifier 0-20
    });
    
    function handleKeyDown(event) {
        if (event.key === 'Escape') {
            cameraMode = 0;
        }
    }
    
    
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
            cameraMode = 1;
    
            // Display detailed info about the clicked planet/sun
            infoSection.innerHTML = `<h2><b>${clickedObject.userData.name}</b></h2>
                                     <p>${clickedObject.userData.description}</p>
                                     <p>Distance from Sun: <b>${clickedObject.userData.distanceFromSun}</b></p>
                                     <p>Orbital Period: <b>${clickedObject.userData.orbitalPeriod}</b></p>
                                     <p>Number of Moons: <b>${clickedObject.userData.numberOfMoons}</b></p>
                                     <p>Type: <b>${clickedObject.userData.type}</b></p>`; // Display the type of planet
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

        sun.rotation.y += baseSpeed * speedModifier / 20;

        planets.forEach((item, index) => {
            const { planet, pivot } = item;
            pivot.rotation.y += (baseSpeed * speedModifier) / (index + 1);
            planet.rotation.y += baseSpeed* 5 * speedModifier / (index + 11);
        });

        kek = getIndependentPosition(cameraObject);
        cameraWork(kek,controls,camera,cameraMode);
        controls.update();
        composer.render(scene, camera);

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
