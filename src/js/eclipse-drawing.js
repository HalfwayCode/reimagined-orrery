        // Initialize scene, camera, and renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Set background color of the scene
        renderer.setClearColor(0x333333);

        // Initialize parameters
        const a = 1;                          // semi-major axis
        const e = 1 / Math.sqrt(2);           // eccentricity
        const b = a * Math.sqrt(1 - e * e);   // semi-minor axis

        // Define rotation functions
        function rotate3d(point, angle, x, y, z) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rotatedX = (cos + (1 - cos) * x * x) * point[0] +
                             ((1 - cos) * x * y - z * sin) * point[1] +
                             ((1 - cos) * x * z + y * sin) * point[2];
            const rotatedY = ((1 - cos) * y * x + z * sin) * point[0] +
                             (cos + (1 - cos) * y * y) * point[1] +
                             ((1 - cos) * y * z - x * sin) * point[2];
            const rotatedZ = ((1 - cos) * z * x - y * sin) * point[0] +
                             ((1 - cos) * z * y + x * sin) * point[1] +
                             (cos + (1 - cos) * z * z) * point[2];
            return [rotatedX, rotatedY, rotatedZ];
        }

        // Function to propagate position based on Kepler's laws
        function propagate(clock) {
            const T = 120;      // seconds
            const n = 2 * Math.PI / T;
            const tau = 0;      // time of pericenter passage

            const M = n * (clock - tau);
            const E = keplerSolve(e, M);
            const cose = Math.cos(E); // compute cosine of E

            const r = a * (1 - e * cose);
            const sX = r * ((cose - e) / (1 - e * cose));
            const sY = r * (Math.sqrt(1 - e * e) * Math.sin(E) / (1 - e * cose));
            const sZ = 0;

            // Apply rotations
            let point = rotate3d([sX, sY, sZ], Math.PI / 5, 0, 1, 0);
            point = rotate3d(point, Math.PI / 4, 0, 0, 1);
            point = rotate3d(point, Math.PI / 4, 1, 0, 0);

            return point;
        }

        // Kepler's equation solver
        function keplerSolve(e, M) {
            const tol = 1.0e-14;
            const Mnorm = M % (2 * Math.PI);
            let E0 = Mnorm;
            let dE = tol + 1;

            while (dE > tol) {
                const E = E0 - (E0 - e * Math.sin(E0) - Mnorm) / (1 - e * Math.cos(E0));
                dE = Math.abs(E - E0);
                E0 = E;
            }
            return E0;
        }

        // Create central body (star) and orbiting body
        const centralBodyGeometry = new THREE.SphereGeometry(0.1, 32, 32);
        const centralBodyMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const centralBody = new THREE.Mesh(centralBodyGeometry, centralBodyMaterial);
        scene.add(centralBody);

        const orbitingBodyGeometry = new THREE.SphereGeometry(0.04, 32, 32);
        const orbitingBodyMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const orbitingBody = new THREE.Mesh(orbitingBodyGeometry, orbitingBodyMaterial);
        scene.add(orbitingBody);

        // Create elliptical path
        const curve = new THREE.EllipseCurve(0, 0, 
            a, b, 
            0, 2 * Math.PI, 
            false, 
            0
        );
        const points = curve.getPoints(100);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const ellipse = new THREE.Line(geometry, material);
        scene.add(ellipse);

        // Set camera position
        camera.position.z = 5;

        // Animation loop
        const ts = 120;  // Number of time slices

        function animate() {
            requestAnimationFrame(animate);
            // Clear positions on each frame
            const loc = propagate(clock);
            orbitingBody.position.set(loc[0], loc[1], loc[2]);
            renderer.render(scene, camera);
        }

        // Set an initial clock
        let clock = 1;

        animate();
