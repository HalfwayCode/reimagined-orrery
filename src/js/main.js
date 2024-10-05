
import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import { solar } from './solarSystem.js';

document.addEventListener('DOMContentLoaded', function () {
    const videoElement = document.querySelector('.background-clip');
    const buttonElement = document.getElementById('button');

    buttonElement.addEventListener('click', (e) => {

        setTimeout(() => {
            document.body.classList.add('slide-up');
            

            setTimeout(() => {
                window.location.href = buttonElement.href; 
            }, 500); 
        }, 300); 
        solar(THREE, OrbitControls);

        e.preventDefault(); 
        videoElement.pause();
        videoElement.classList.add('hidden');
      });
});

