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

document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'noreaCookieChoice';
  if (localStorage.getItem(storageKey)) return;

  const style = document.createElement('style');
  style.textContent = `
    .cookie-banner{position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:9999;display:flex;align-items:center;justify-content:space-between;gap:1rem;max-width:980px;margin:0 auto;padding:1rem 1rem 1rem 1.1rem;border:1px solid rgba(17,17,17,.12);border-radius:22px;background:rgba(255,255,255,.92);backdrop-filter:blur(18px);box-shadow:0 24px 80px rgba(0,0,0,.18);color:#111;animation:cookieIn .35s ease both}
    .cookie-banner p{margin:0;color:#54504a;font-size:.9rem;line-height:1.45}.cookie-banner strong{display:block;color:#111;text-transform:uppercase;letter-spacing:.16em;font-size:.7rem;margin-bottom:.2rem}.cookie-actions{display:flex;gap:.55rem;flex-shrink:0}.cookie-btn{border:1px solid rgba(17,17,17,.18);border-radius:999px;padding:.75rem 1rem;background:#fff;cursor:pointer;text-transform:uppercase;letter-spacing:.11em;font-size:.7rem;color:#111}.cookie-btn.accept{background:#111;color:#fff;border-color:#111}.cookie-btn:hover{transform:translateY(-1px)}@keyframes cookieIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}@media(max-width:620px){.cookie-banner{display:grid;bottom:.75rem;left:.75rem;right:.75rem;padding:.95rem}.cookie-actions{display:grid;grid-template-columns:1fr 1fr}.cookie-btn{width:100%;padding:.72rem .8rem}}
  `;
  document.head.appendChild(style);

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.innerHTML = `
    <p><strong>Cookie notice</strong> NORÉA uses essential cookies to keep your bag, checkout and site experience working smoothly.</p>
    <div class="cookie-actions">
      <button class="cookie-btn decline" type="button">Decline</button>
      <button class="cookie-btn accept" type="button">Accept</button>
    </div>
  `;
  document.body.appendChild(banner);

  const saveChoice = (choice) => {
    localStorage.setItem(storageKey, choice);
    banner.remove();
  };

  banner.querySelector('.accept').addEventListener('click', () => saveChoice('accepted'));
  banner.querySelector('.decline').addEventListener('click', () => saveChoice('declined'));
});
