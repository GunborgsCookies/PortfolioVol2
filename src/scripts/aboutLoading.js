const terminalContainer = document.getElementById("terminal-popup");
const terminal = document.getElementById("terminal-lines");
const profile = document.getElementById("profile-container");
const projects = document.getElementById("project-grid");
const profileImg = document.getElementById("profile-img");
const tiles = document.querySelectorAll(".project-tile");
const skipButton = document.getElementById("skip-intro-btn");
const accessOverlay = document.getElementById("access-overlay");
const aboutText = document.getElementById("about-text");
const aboutLines = document.querySelectorAll(".typed-line");
const closeTerminalBtn = document.getElementById("close-terminal");
const openTerminalBtn = document.getElementById("open-terminal-btn");

let hasRun = false;
let introDone = false;

document.body.style.overflow = "hidden";

const terminalAudio = new Audio("/src/assets/audio/terminal-beep.mp3");
const glitchAudio = new Audio("/src/assets/audio/glitch.mp3");
const accessAudio = new Audio("/src/assets/audio/access-granted.mp3");

const voiceClips = [
  new Audio("/src/assets/audio/Connection established.mp3"),
  new Audio("/src/assets/audio/Identity confirmed.mp3"),
  new Audio("/src/assets/audio/Authorization level.mp3"),
  new Audio("/src/assets/audio/Loading subject.mp3"),
  new Audio("/src/assets/audio/Initializing profile.mp3"),
  new Audio("/src/assets/audio/All systems online.mp3")
];

const terminalLines = [
  "> CONNECTED.",
  "> Identity: Alexander Haanpää confirmed.",
  "> Authorization level: GRANTED.",
  "> Loading subject information...",
  "> Initializing profile interface...",
  "> All systems online."
];

function typeLine(text, delay, animated = false) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const line = document.createElement("div");
      if (animated) {
        let index = 0;
        const interval = setInterval(() => {
          line.textContent += text[index];
          index++;
          if (index >= text.length) {
            clearInterval(interval);
            terminal.scrollTop = terminal.scrollHeight;
            resolve();
          }
        }, 35);
      } else {
        line.textContent = text;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
        terminalAudio.currentTime = 0;
        terminalAudio.play();
        resolve();
      }
      terminal.appendChild(line);
    }, delay);
  });
}

function triggerGlitch() {
  profileImg.classList.add("glitch-now");
  glitchAudio.currentTime = 0;
  glitchAudio.play();
  setTimeout(() => {
    profileImg.classList.remove("glitch-now");
  }, 500);
}

function randomGlitchLoop() {
  setInterval(() => {
    if (profileImg.classList.contains("opacity-0")) return;
    if (Math.random() > 0.6) {
      triggerGlitch();
    }
  }, 3000);
}

function scrollToAbout() {
  const profile = document.getElementById("profile-container");
  if (!profile) return;

  profile.classList.remove("hidden");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const offset = profile.getBoundingClientRect().top + window.scrollY;
      const extraOffset = 80;
      window.scrollTo({
        top: offset - extraOffset,
        behavior: "smooth"
      });
    });
  });
}

function showAccessOverlay() {
  if (accessOverlay) {
    accessOverlay.classList.remove("hidden");
    accessOverlay.classList.add("animate-access");
    setTimeout(() => {
      accessOverlay.classList.add("hidden");
      accessOverlay.classList.remove("animate-access");
    }, 2000);
  }
}

function showDockStatusAndScroll() {
  const dockStatus = document.getElementById("dock-status");
  if (dockStatus) {
    dockStatus.classList.remove("hidden");
    dockStatus.textContent = "✅ CONNECTED TO CORTEX. LOADING PROFILE...";
  }

  setTimeout(() => {
    if (dockStatus) dockStatus.classList.add("hidden");
    terminalContainer.classList.remove("hidden");
    runIntroSequence();
  }, 1000);
}

async function runAboutMeTyping() {
  if (!aboutText || aboutLines.length === 0) return;
  aboutText.classList.remove("opacity-0");

  aboutLines.forEach((line) => (line.textContent = "> "));

  let i = 0;

  function type(line, cb) {
    const text = line.getAttribute("data-full-text") || "";
    let char = 0;
    const typing = setInterval(() => {
      line.textContent += text[char];
      char++;
      if (char === text.length) {
        clearInterval(typing);
        cb();
      }
    }, 25);
  }

  function runTyping() {
    if (i >= aboutLines.length) return;
    type(aboutLines[i], () => {
      i++;
      runTyping();
    });
  }

  runTyping();
}

async function runIntroSequence(skip = false) {
  if (hasRun) return;
  hasRun = true;

  const webbutveckling = document.getElementById("webbutveckling");
  const grafiskdesign = document.getElementById("grafiskdesign");

  let scrollTriggered = false;

  for (let i = 0; i < terminalLines.length; i++) {
    await typeLine(terminalLines[i], skip ? 150 : 200);

    if (terminalLines[i] === "> Loading subject information...") {
      scrollTriggered = true; // 👈 Kom ihåg att vi ska scrolla sen
    }

    if (!skip && voiceClips[i]) {
      voiceClips[i].currentTime = 0;
      await new Promise((resolve) => {
        voiceClips[i].play();
        voiceClips[i].onended = resolve;
      });
    }
  }

  showAccessOverlay();

  profile.classList.remove("hidden");
  triggerGlitch();
  profileImg.classList.remove("opacity-0");
  randomGlitchLoop();

  projects.classList.remove("hidden");
  webbutveckling?.classList.remove("hidden", "opacity-0");
  grafiskdesign?.classList.remove("hidden", "opacity-0");

  webbutveckling?.classList.add("section-fade-in");
  grafiskdesign?.classList.add("section-fade-in");

  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.remove("opacity-0", "scale-90");
      tile.classList.add("animate-pop-in");
    }, 300 * index);
  });

  setTimeout(() => {
    runAboutMeTyping();
    introDone = true;
    document.body.style.overflow = "auto";
    terminalContainer.classList.add("hidden");
    if (skipButton) skipButton.classList.add("hidden");

    // 👇 Scrollen görs nu – efter allt är synligt
    if (scrollTriggered) {
      setTimeout(() => {
        scrollToAbout();
      }, 100);
    }

  }, 3000);
}

if (skipButton) {
  skipButton.addEventListener("click", () => {
    terminalContainer.classList.remove("hidden");
    runIntroSequence(true);
    skipButton.classList.add("hidden");
  });
}

if (closeTerminalBtn) {
  closeTerminalBtn.addEventListener("click", () => {
    terminalContainer.classList.add("hidden");
  });
}

if (openTerminalBtn) {
  openTerminalBtn.addEventListener("click", () => {
    terminalContainer.classList.remove("hidden");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  terminalContainer.classList.add("hidden");
});

window.showDockStatusAndScroll = showDockStatusAndScroll;

window.addEventListener("load", () => {
  // styrs via dock
});
