
import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import { solar } from './solarSystem.js';


document.addEventListener('DOMContentLoaded', function () {
    solar(THREE, OrbitControls); 
});

const videoElement = document.querySelector('.background-clip');
const buttonElement = document.getElementById('button');

buttonElement.addEventListener('click', (e) => {
    e.preventDefault(); 
    videoElement.pause();
    videoElement.classList.add('hidden');

    setTimeout(() => {
        document.body.classList.add('slide-up');
        
        setTimeout(() => {
            window.location.href = buttonElement.href; 
        }, 500); 
    }, 300); 
});
