document.addEventListener('DOMContentLoaded', function () {
    const videoElement = document.querySelector('.background-clip');
    const buttonElement = document.getElementById('button');
    const transitionElement = document.querySelector('.page-transition');

    if (buttonElement) {
        buttonElement.addEventListener('click', (e) => {
            e.preventDefault();

            transitionElement.classList.add('active');

            setTimeout(() => {
                //document.body.classList.add('slide-up');
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