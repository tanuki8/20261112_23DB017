(() => {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const livesLabel = document.querySelector("#lives");
  const coinsLabel = document.querySelector("#coins");
  const message = document.querySelector("#game-message");
  const startHint = document.querySelector("#start-hint");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const WORLD_WIDTH = 3300;
  const GRAVITY = 0.58;
  const platforms = [
    { x: 0, y: 475, w: 690, h: 90 },
    { x: 790, y: 475, w: 510, h: 90 },
    { x: 1400, y: 475, w: 560, h: 90 },
    { x: 2070, y: 475, w: 1230, h: 90 },
    { x: 310, y: 390, w: 125, h: 18 },
    { x: 500, y: 330, w: 120, h: 18 },
    { x: 865, y: 390, w: 125, h: 18 },
    { x: 1080, y: 335, w: 130, h: 18 },
    { x: 1510, y: 390, w: 135, h: 18 },
    { x: 1740, y: 330, w: 130, h: 18 },
    { x: 2180, y: 390, w: 140, h: 18 },
    { x: 2420, y: 335, w: 140, h: 18 },
    { x: 2700, y: 390, w: 125, h: 18 },
  ];
  const coinSpots = [
    [350, 348], [540, 288], [900, 348], [1127, 293],
    [1555, 348], [1785, 288], [2225, 348], [2470, 293],
  ];
  const hazards = [
    { x: 580, y: 443, w: 34, h: 32 },
    { x: 1160, y: 443, w: 34, h: 32 },
    { x: 1850, y: 443, w: 34, h: 32 },
    { x: 2340, y: 443, w: 34, h: 32 },
    { x: 2850, y: 443, w: 34, h: 32 },
  ];
  const keys = { left: false, right: false, jump: false };
  let player;
  let coins;
  let lives;
  let cameraX;
  let won;
  let lastTime = 0;
  let elapsed = 0;

  function reset() {
    player = { x: 70, y: 400, w: 30, h: 42, vx: 0, vy: 0, grounded: false, invulnerable: 0 };
    coins = coinSpots.map(([x, y]) => ({ x, y, collected: false }));
    lives = 3;
    cameraX = 0;
    won = false;
    livesLabel.textContent = `× ${lives}`;
    coinsLabel.textContent = `0 / ${coins.length}`;
    message.hidden = true;
    startHint.hidden = false;
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function hurt() {
    if (player.invulnerable > 0 || won) return;
    lives -= 1;
    livesLabel.textContent = `× ${lives}`;
    if (lives <= 0) {
      reset();
      return;
    }
    player.x = Math.max(70, player.x - 120);
    player.y = 400;
    player.vx = 0;
    player.vy = 0;
    player.invulnerable = 1.4;
  }

  function update(dt) {
    if (won) return;
    elapsed += dt;
    const speed = 3.8;
    player.vx = (Number(keys.right) - Number(keys.left)) * speed;
    if (keys.jump && player.grounded) {
      player.vy = -11.2;
      player.grounded = false;
      startHint.hidden = true;
    }
    if (keys.left || keys.right) startHint.hidden = true;

    const oldY = player.y;
    player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x + player.vx));
    player.vy = Math.min(13, player.vy + GRAVITY);
    player.y += player.vy;
    player.grounded = false;

    for (const platform of platforms) {
      const horizontalOverlap = player.x + player.w > platform.x && player.x < platform.x + platform.w;
      if (horizontalOverlap && player.vy >= 0 && oldY + player.h <= platform.y && player.y + player.h >= platform.y) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.grounded = true;
      }
    }

    for (const hazard of hazards) {
      if (overlaps(player, hazard)) hurt();
    }
    if (player.y > HEIGHT + 50) hurt();
    if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);

    for (const coin of coins) {
      if (!coin.collected && overlaps(player, { x: coin.x - 12, y: coin.y - 12, w: 24, h: 24 })) {
        coin.collected = true;
        coinsLabel.textContent = `${coins.filter((item) => item.collected).length} / ${coins.length}`;
      }
    }

    if (player.x > WORLD_WIDTH - 145) {
      won = true;
      message.hidden = false;
    }
    cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, player.x - WIDTH * 0.38));
  }

  function roundedRect(x, y, w, h, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#9ed5e8");
    sky.addColorStop(0.66, "#d2e8d1");
    sky.addColorStop(1, "#e5e3b5");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "rgba(255, 244, 191, .78)";
    ctx.beginPath();
    ctx.arc(760 - cameraX * 0.04, 100, 34, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 7; i += 1) {
      const x = ((i * 205 - cameraX * 0.18) % (WIDTH + 180)) - 70;
      const y = 93 + (i % 3) * 55;
      drawCloud(x, y, .72 + (i % 2) * .16);
    }

    drawHillLayer("#9cc9ae", 355, .2, 80);
    drawHillLayer("#78b293", 408, .38, 110);
    drawHillLayer("#65a27d", 450, .58, 135);
  }

  function drawCloud(x, y, scale) {
    ctx.fillStyle = "rgba(255, 255, 255, .54)";
    ctx.beginPath();
    ctx.ellipse(x, y, 34 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 15 * scale, y - 7 * scale, 19 * scale, 16 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 9 * scale, y - 4 * scale, 17 * scale, 13 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHillLayer(color, baseY, factor, amplitude) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT);
    for (let x = 0; x <= WIDTH; x += 8) {
      const worldX = x + cameraX * factor;
      const y = baseY + Math.sin(worldX / 115) * amplitude * .38 + Math.sin(worldX / 247) * amplitude * .22;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(WIDTH, HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  function drawPlatform(platform) {
    const x = platform.x - cameraX;
    if (x + platform.w < -2 || x > WIDTH + 2) return;
    ctx.fillStyle = platform.h > 30 ? "#805d43" : "#795c45";
    roundedRect(x, platform.y, platform.w, platform.h, platform.h > 30 ? 5 : 6);
    ctx.fillStyle = platform.h > 30 ? "#79b84d" : "#8bc858";
    roundedRect(x, platform.y, platform.w, platform.h > 30 ? 12 : 7, 5);
    ctx.fillStyle = "rgba(227, 247, 171, .42)";
    ctx.fillRect(x + 11, platform.y + 3, Math.max(0, platform.w - 24), 2);
    if (platform.h > 30) {
      ctx.fillStyle = "rgba(58, 45, 48, .17)";
      for (let i = 18; i < platform.w; i += 44) {
        ctx.fillRect(x + i, platform.y + 23 + (i % 3) * 10, 3, 3);
      }
    }
  }

  function drawCoin(coin) {
    if (coin.collected) return;
    const x = coin.x - cameraX;
    if (x < -30 || x > WIDTH + 30) return;
    const pulse = 1 + Math.sin(elapsed * 5 + coin.x) * .08;
    ctx.save();
    ctx.translate(x, coin.y);
    ctx.scale(pulse, 1);
    ctx.fillStyle = "rgba(255, 211, 78, .23)";
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffca45";
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff1a4";
    ctx.beginPath();
    ctx.arc(-2, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHazard(hazard) {
    const x = hazard.x - cameraX;
    if (x + hazard.w < 0 || x > WIDTH) return;
    ctx.fillStyle = "#df6c68";
    ctx.beginPath();
    ctx.moveTo(x, hazard.y + hazard.h);
    ctx.lineTo(x + 7, hazard.y + 8);
    ctx.lineTo(x + 14, hazard.y + hazard.h);
    ctx.lineTo(x + 22, hazard.y + 3);
    ctx.lineTo(x + 34, hazard.y + hazard.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f59878";
    ctx.fillRect(x + 7, hazard.y + hazard.h - 4, 6, 3);
  }

  function drawGoal() {
    const x = WORLD_WIDTH - 116 - cameraX;
    ctx.fillStyle = "#f0eee3";
    ctx.fillRect(x, 310, 5, 165);
    ctx.fillStyle = "#f47e79";
    ctx.beginPath();
    ctx.moveTo(x + 5, 313);
    ctx.lineTo(x + 64, 329);
    ctx.lineTo(x + 5, 347);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f8e29b";
    ctx.beginPath();
    ctx.arc(x + 2, 307, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlayer() {
    if (player.invulnerable > 0 && Math.floor(elapsed * 13) % 2 === 0) return;
    const x = player.x - cameraX;
    const y = player.y;
    ctx.fillStyle = "rgba(37, 57, 57, .2)";
    ctx.beginPath();
    ctx.ellipse(x + player.w / 2, y + player.h + 3, 17, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#415b86";
    roundedRect(x + 3, y + 18, 24, 21, 6);
    ctx.fillStyle = "#f2ae77";
    roundedRect(x + 5, y + 3, 20, 20, 8);
    ctx.fillStyle = "#263650";
    ctx.beginPath();
    ctx.ellipse(x + 15, y + 5, 12, 6, -.08, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#283a55";
    ctx.fillRect(x + 17, y + 12, 2, 3);
    ctx.fillStyle = "#f1cf75";
    ctx.fillRect(x + 5, y + 25, 20, 4);
    ctx.fillStyle = "#edcfac";
    ctx.fillRect(x + 5, y + 38, 8, 4);
    ctx.fillRect(x + 18, y + 38, 8, 4);
  }

  function draw() {
    drawBackground();
    for (const platform of platforms) drawPlatform(platform);
    for (const coin of coins) drawCoin(coin);
    for (const hazard of hazards) drawHazard(hazard);
    drawGoal();
    drawPlayer();
  }

  function frame(time) {
    const dt = Math.min((time - lastTime) / 1000 || 0, 0.033);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function setKey(key, pressed) {
    if (key === "ArrowLeft" || key === "a" || key === "A") keys.left = pressed;
    if (key === "ArrowRight" || key === "d" || key === "D") keys.right = pressed;
    if (key === " " || key === "ArrowUp" || key === "w" || key === "W") keys.jump = pressed;
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(event.key)) event.preventDefault();
    setKey(event.key, true);
  });
  window.addEventListener("keyup", (event) => setKey(event.key, false));
  window.addEventListener("blur", () => {
    keys.left = false;
    keys.right = false;
    keys.jump = false;
  });

  document.querySelectorAll("[data-control]").forEach((button) => {
    const control = button.dataset.control;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      keys[control] = true;
      button.setPointerCapture(event.pointerId);
    });
    const release = () => { keys[control] = false; };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });

  document.querySelector("#restart-button").addEventListener("click", reset);
  document.querySelector("#play-again").addEventListener("click", reset);
  reset();
  requestAnimationFrame(frame);
})();
