import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls'; // Import OrbitControls from the import map
import { solar } from './solarSystem.js';

// Call the solar function, passing THREE
solar(THREE, OrbitControls);
