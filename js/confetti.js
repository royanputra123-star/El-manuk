// confetti.js
// Efek confetti ringan menggunakan canvas, tanpa dependency eksternal.

(function (global) {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let particles = [];
  let animId = null;

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const COLORS = ['#58CC02', '#FFD43B', '#FFFFFF', '#3AB0FF', '#FF6B6B', '#1CB0F6'];

  function spawnParticles(count) {
    const w = canvas.width;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: -20 - Math.random() * 100,
        r: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speedY: 2 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.5 ? 'circle' : 'rect',
      });
    }
  }

  function loop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      }
      ctx.restore();
    });
    particles = particles.filter(p => p.y < canvas.height + 30);
    if (particles.length > 0) {
      animId = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(animId);
      animId = null;
      canvas.classList.remove('active');
    }
  }

  function fire(intensity) {
    if (!canvas || !ctx) return;
    canvas.classList.add('active');
    resize();
    spawnParticles(intensity || 120);
    if (!animId) animId = requestAnimationFrame(loop);
  }

  global.Confetti = { fire };
})(window);
