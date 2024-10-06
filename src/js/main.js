document.addEventListener('DOMContentLoaded', function () {
    const videoElement = document.querySelector('.background-clip');
    const buttonElement = document.getElementById('button');

    if (buttonElement) {
        buttonElement.addEventListener('click', (e) => {
            e.preventDefault();

            setTimeout(() => {
                document.body.classList.add('slide-up');
                setTimeout(() => {
                    window.location.href = 'solarSystem.html';
                }, 500);
            }, 300);

            if (videoElement) {
                videoElement.pause();
                videoElement.classList.add('hidden');
            }
        });
    }
});