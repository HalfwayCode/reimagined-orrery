export function cameraWork(positions, controls, camera,cameraMode) {
    if(cameraMode==0)
    {
    controls.target.set(0, 0, 0);
    camera.maxDistance=15;
    camera.minDistance=3;
    }
    if(cameraMode==1)
    {
    controls.target.set(positions.x, positions.y, positions.z);
    
    // Konfiguracja opcji kontrolera
    controls.enableDamping = true;  // Płynne wygaszanie ruchu
    controls.dampingFactor = 0.05;  // Współczynnik tłumienia
    controls.enablePan = false;     // Wyłącz przesuwanie w płaszczyźnie
    controls.minDistance = 3;       // Minimalna odległość kamery od celu
    controls.maxDistance = 15;      // Maksymalna odległość kamery od celu (ustaw na więcej niż minDistance)
    controls.autoRotate = false;    // Możesz ustawić na true, aby włączyć automatyczne obracanie kamery

    // Ustaw pozycję kamery - trochę wyżej i na bok, aby mieć lepszy widok
    camera.position.set(positions.x, positions.y + 5, positions.z + 5);
    
    // Aktualizuj kontroler po wprowadzeniu zmian
    }
    if(cameraMode == 3){
        controls.target.set(positions.x, positions.y, positions.z);
    }

}
