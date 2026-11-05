// Lo-fi banner interactions. No libraries or network requests.
const board = document.querySelector(".banner-wall");
const statusLine = document.querySelector("#status");
const sticker = document.querySelector("#sticker");
let topLayer = 10;
let scale = 1;
let angle = 0;
const positions = new Map();
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setPosition(element, x, y) {
  positions.set(element, { x, y });
  element.style.setProperty("--x", `${x}px`);
  element.style.setProperty("--y", `${y}px`);
}

// Pointer capture keeps dragging responsive on a mouse, pen, or touchscreen.
document.querySelectorAll("[data-drag]").forEach((element) => {
  let drag = null;
  let suppressClick = false;
  element.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const position = positions.get(element) || { x: 0, y: 0 };
    drag = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      ...position,
      rect: element.getBoundingClientRect(),
      moved: false,
    };
    suppressClick = false;
  });
  element.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) {
      element.setPointerCapture(event.pointerId);
      element.style.zIndex = ++topLayer;
      element.classList.add("dragging");
      drag.moved = true;
    }
    const bounds = board.getBoundingClientRect();
    const x =
      drag.x +
      Math.max(
        bounds.left - drag.rect.left,
        Math.min(bounds.right - drag.rect.right, dx),
      );
    const y =
      drag.y +
      Math.max(
        bounds.top - drag.rect.top,
        Math.min(bounds.bottom - drag.rect.bottom, dy),
      );
    setPosition(element, x, y);
  });
  function finish(event) {
    if (!drag || event.pointerId !== drag.id) return;
    suppressClick = drag.moved;
    if (element.hasPointerCapture(event.pointerId))
      element.releasePointerCapture(event.pointerId);
    element.classList.remove("dragging");
    if (drag.moved) statusLine.textContent = "(っ˘ω˘ς ) 放在這裡剛剛好";
    drag = null;
  }
  element.addEventListener("pointerup", finish);
  element.addEventListener("pointercancel", finish);
  element.addEventListener(
    "click",
    (event) => {
      if (suppressClick) {
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressClick = false;
      }
    },
    true,
  );
  element.addEventListener("keydown", (event) => {
    const directions = {
      ArrowLeft: [-10, 0],
      ArrowRight: [10, 0],
      ArrowUp: [0, -10],
      ArrowDown: [0, 10],
    };
    if (!directions[event.key]) return;
    event.preventDefault();
    const pos = positions.get(element) || { x: 0, y: 0 };
    const [dx, dy] = directions[event.key];
    const box = element.getBoundingClientRect();
    const bounds = board.getBoundingClientRect();
    setPosition(
      element,
      pos.x +
        Math.max(
          bounds.left - box.left,
          Math.min(bounds.right - box.right, dx),
        ),
      pos.y +
        Math.max(
          bounds.top - box.top,
          Math.min(bounds.bottom - box.bottom, dy),
        ),
    );
  });
});

sticker.addEventListener("click", (event) => {
  if (event.detail === 0) document.querySelector("#person-photo").showPopover();
  else {
    statusLine.textContent = "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ 雙擊放大人物 / 拖動我到任何地方";
    if (document.body.classList.contains("still") || reducedMotion.matches)
      return;
    const rect = board.getBoundingClientRect();
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.textContent = "♡ +1";
    spark.style.left = `${event.clientX - rect.left}px`;
    spark.style.top = `${event.clientY - rect.top}px`;
    board.append(spark);
    setTimeout(() => spark.remove(), 1500);
  }
});
sticker.addEventListener("dblclick", () =>
  document.querySelector("#person-photo").showPopover(),
);
document.querySelector("#smaller").addEventListener("click", () => {
  scale = Math.max(0.65, scale - 0.1);
  sticker.style.setProperty("--scale", scale);
});
document.querySelector("#bigger").addEventListener("click", () => {
  scale = Math.min(1.4, scale + 0.1);
  sticker.style.setProperty("--scale", scale);
});
document.querySelector("#rotate").addEventListener("click", () => {
  angle += 15;
  sticker.style.setProperty("--angle", `${angle}deg`);
});
document
  .querySelector("#motion")
  .addEventListener("change", (event) =>
    document.body.classList.toggle("still", event.target.checked),
  );
document.querySelector("#reset").addEventListener("click", () => {
  document.querySelectorAll("[data-drag]").forEach((element) => {
    setPosition(element, 0, 0);
    element.style.removeProperty("z-index");
  });
  scale = 1;
  angle = 0;
  sticker.style.setProperty("--scale", 1);
  sticker.style.setProperty("--angle", "0deg");
  document.querySelectorAll(".qq-window").forEach((win) => {
    if (win.matches(":popover-open")) win.hidePopover();
    win.style.translate = "";
  });
  statusLine.textContent = "♡ 一切回到最初的樣子";
});

// The blue title bar is also a handle, like an old desktop window.
document.querySelectorAll(".qq-window").forEach((win) => {
  const handle = win.querySelector("header");
  let drag;
  let x = 0,
    y = 0;
  win.addEventListener("toggle", (event) => {
    if (event.newState === "open") {
      x = 0;
      y = 0;
      win.style.translate = "";
    }
  });
  handle.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button") || event.button !== 0) return;
    const rect = win.getBoundingClientRect();
    drag = { px: event.clientX, py: event.clientY, x, y, rect };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = Math.max(
      -drag.rect.left,
      Math.min(innerWidth - drag.rect.right, event.clientX - drag.px),
    );
    const dy = Math.max(
      -drag.rect.top,
      Math.min(innerHeight - drag.rect.bottom, event.clientY - drag.py),
    );
    x = drag.x + dx;
    y = drag.y + dy;
    win.style.translate = `${x}px ${y}px`;
  });
  handle.addEventListener("pointerup", () => {
    drag = null;
  });
  handle.addEventListener("pointercancel", () => {
    drag = null;
  });
});

// Offset star frames recreate the repeated sparkle cels in old banner GIFs.
document.querySelectorAll(".banner").forEach((banner, bannerIndex) => {
  const layer = document.createElement("div");
  layer.className = "bling-layer";
  layer.setAttribute("aria-hidden", "true");
  const points = [
    [3, 14],
    [21, 68],
    [41, 6],
    [58, 81],
    [76, 13],
    [92, 69],
    [35, 43],
    [84, 39],
  ];
  points.forEach(([x, y], index) => {
    const star = document.createElement("span");
    star.className = "bling";
    star.textContent = index % 3 === 0 ? "✧" : "✦";
    star.style.setProperty("--bx", `${x}%`);
    star.style.setProperty("--by", `${y}%`);
    star.style.setProperty("--bs", `${22 + (index % 3) * 12}px`);
    star.style.setProperty("--bd", `${-(index * 0.3 + bannerIndex * 0.6)}s`);
    layer.append(star);
  });
  banner.append(layer);
});
const hot = document.createElement("span");
hot.className = "hot-badge";
hot.textContent = "HOT!";
hot.setAttribute("aria-hidden", "true");
document.querySelector(".feature").append(hot);

// GIF images cannot be paused with animation-play-state: swap in a still frame.
function syncAdMotion() {
  const paused =
    document.querySelector("#motion").checked || reducedMotion.matches;
  document.body.classList.toggle("still", paused);
  document.querySelectorAll(".looping-ad").forEach((img) => {
    const next = paused ? img.dataset.still : img.dataset.animated;
    if (img.getAttribute("src") !== next) img.src = next;
  });
}
document.querySelector("#motion").addEventListener("change", syncAdMotion);
reducedMotion.addEventListener("change", syncAdMotion);
syncAdMotion();

// Background track: autoplay when permitted, otherwise start on first interaction.
const music = document.querySelector("#background-music");
const musicButton = document.querySelector("#music-toggle");
let musicChosen = false;
music.volume = 0.45;
function updateMusicButton() {
  const playing = !music.paused;
  musicButton.textContent = playing ? "♫ 暫停音樂" : "♪ 播放音樂";
  musicButton.setAttribute(
    "aria-label",
    playing ? "Pause background music" : "Play background music",
  );
  musicButton.setAttribute("aria-pressed", String(playing));
}
async function playMusic() {
  try {
    await music.play();
  } catch (_) {
    updateMusicButton();
  }
}
music.addEventListener("play", updateMusicButton);
music.addEventListener("pause", updateMusicButton);
music.addEventListener("error", () => {
  musicButton.textContent = "♪ 重試音樂";
  musicButton.setAttribute("aria-label", "Retry background music");
});
musicButton.addEventListener("click", () => {
  musicChosen = true;
  if (music.paused) {
    if (music.error) music.load();
    playMusic();
  } else music.pause();
});
function firstMusicInteraction(event) {
  if (event.target.closest("#music-toggle") || musicChosen) return;
  if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
  musicChosen = true;
  playMusic();
}
document.addEventListener("click", firstMusicInteraction);
document.addEventListener("keydown", firstMusicInteraction);
playMusic();
