document.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('.hero-video');
  const soundBtn = document.getElementById('heroSoundBtn');

  if (!video || !soundBtn) return;

  const updateButton = () => {
    const soundIsOn = !video.muted;
    soundBtn.textContent = soundIsOn ? 'Sound On' : 'Sound Off';
    soundBtn.classList.toggle('sound-on', soundIsOn);
    soundBtn.setAttribute('aria-pressed', String(soundIsOn));
    soundBtn.setAttribute('aria-label', soundIsOn ? 'Turn hero video sound off' : 'Turn hero video sound on');
  };

  video.muted = true;
  video.volume = 1;
  video.playsInline = true;
  updateButton();

  const tryPlayMuted = () => {
    video.muted = true;
    video.play().catch(() => {});
    updateButton();
  };

  tryPlayMuted();

  soundBtn.addEventListener('click', async () => {
    try {
      if (video.muted) {
        video.muted = false;
        video.volume = 1;
        video.currentTime = video.currentTime || 0;
        await video.play();
      } else {
        video.muted = true;
      }
      updateButton();
    } catch (error) {
      video.muted = true;
      updateButton();
      alert('Your browser blocked sound. Tap the video once, then tap Sound On again.');
    }
  });

  video.addEventListener('click', async () => {
    try {
      video.muted = false;
      video.volume = 1;
      await video.play();
      updateButton();
    } catch (error) {
      updateButton();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && video.muted) {
      video.play().catch(() => {});
    }
  });
});
