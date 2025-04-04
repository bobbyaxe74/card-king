// game.js
import * as THREE from 'three';
import { gsap } from 'gsap';
import cardBack from './assets/image/card-back.png';
import card1 from './assets/image/card1.png';
import card2 from './assets/image/card2.png';
import card3 from './assets/image/card3.png';
import card4 from './assets/image/card4.png';
import card5 from './assets/image/card5.png';
import card6 from './assets/image/card6.png';
import card7 from './assets/image/card7.png';
import card8 from './assets/image/card8.png';
import card9 from './assets/image/card9.png';
import card10 from './assets/image/card10.png';
import card11 from './assets/image/card11.png';
import card12 from './assets/image/card12.png';
import card13 from './assets/image/card13.png';
import card14 from './assets/image/card14.png';
import card15 from './assets/image/card15.png';
import card16 from './assets/image/card16.png';
import card17 from './assets/image/card17.png';
import card18 from './assets/image/card18.png';
import card19 from './assets/image/card19.png';
import card20 from './assets/image/card20.png';
import card21 from './assets/image/card21.png';
import card22 from './assets/image/card22.png';
import card23 from './assets/image/card23.png';
import matImage from './assets/texture/mat.png';
import flipWav from './assets/audio/flip.wav';
import matchWav from './assets/audio/match.wav';
import winWav from './assets/audio/win.wav';
import loseWav from './assets/audio/lose.wav';
import backgroundWav from './assets/audio/background.wav';

let backTexture;
let cardTextures = [];
let matTexture;

// Audio variables
let flipSound, matchSound, winSound, loseSound, backgroundMusic;
let audioListener;

function preloadTexturesAndAudio(callback) {
  const loader = new THREE.TextureLoader();
  const audioLoader = new THREE.AudioLoader();
  const texturePromises = [];
  const audioPromises = [];

  texturePromises.push(new Promise(resolve => {
    loader.load(cardBack, texture => {
      backTexture = texture;
      resolve();
    });
  }));

  [card1, card2, card3, card4, card5, card6, card7, card8, card9, card10, card11, card12, card13, card14, card15, card16, card17, card18, card19, card20, card21, card22, card23].forEach(card => {
    texturePromises.push(new Promise(resolve => {
      loader.load(card, texture => {
        cardTextures.push(texture);
        resolve();
      }, undefined, () => {
        cardTextures.push(new THREE.TextureLoader().load('/assets/image/card1.png'));
        resolve();
      });
    }));
  });

  texturePromises.push(new Promise(resolve => {
    loader.load(matImage, texture => {
      matTexture = texture;
      resolve();
    }, undefined, () => {
      matTexture = null;
      resolve();
    });
  }));

  audioListener = new THREE.AudioListener();

  audioPromises.push(new Promise(resolve => {
    audioLoader.load(flipWav, buffer => {
      flipSound = new THREE.Audio(audioListener);
      flipSound.setBuffer(buffer);
      flipSound.setVolume(0.5);
      resolve();
    }, undefined, () => {
      console.warn('Failed to load flip.wav, sound will be unavailable.');
      flipSound = null;
      resolve();
    });
  }));

  audioPromises.push(new Promise(resolve => {
    audioLoader.load(matchWav, buffer => {
      matchSound = new THREE.Audio(audioListener);
      matchSound.setBuffer(buffer);
      matchSound.setVolume(0.7);
      resolve();
    }, undefined, () => {
      console.warn('Failed to load match.wav, sound will be unavailable.');
      matchSound = null;
      resolve();
    });
  }));

  audioPromises.push(new Promise(resolve => {
    audioLoader.load(winWav, buffer => {
      winSound = new THREE.Audio(audioListener);
      winSound.setBuffer(buffer);
      winSound.setVolume(0.8);
      resolve();
    }, undefined, () => {
      console.warn('Failed to load win.wav, sound will be unavailable.');
      winSound = null;
      resolve();
    });
  }));

  audioPromises.push(new Promise(resolve => {
    audioLoader.load(loseWav, buffer => {
      loseSound = new THREE.Audio(audioListener);
      loseSound.setBuffer(buffer);
      loseSound.setVolume(0.8);
      resolve();
    }, undefined, () => {
      console.warn('Failed to load lose.wav, sound will be unavailable.');
      loseSound = null;
      resolve();
    });
  }));

  audioPromises.push(new Promise(resolve => {
    audioLoader.load(backgroundWav, buffer => {
      backgroundMusic = new THREE.Audio(audioListener);
      backgroundMusic.setBuffer(buffer);
      backgroundMusic.setLoop(true);
      backgroundMusic.setVolume(0.3);
      resolve();
    }, undefined, () => {
      console.warn('Failed to load background.wav, music will be unavailable.');
      backgroundMusic = null;
      resolve();
    });
  }));

  Promise.all([...texturePromises, ...audioPromises]).then(callback);
}

export function startGame(scene, camera, renderer, level = 8, attachStartButtonListeners) {
  let cards = [];
  let flippedCards = [];
  let timerInterval = null;
  let score = 0;
  let consecutiveMatches = 0;
  let timeRemaining = level * 3000 + 5000;

  camera.add(audioListener);

  const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

  function createCard(x, z, value) {
    const geometry = new THREE.BoxGeometry(2, 3, 0.1);
    const materials = [
      edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial,
      new THREE.MeshStandardMaterial({ map: backTexture, emissive: 0xFFFFFF, emissiveIntensity: 0.0 }),
      new THREE.MeshStandardMaterial({ map: cardTextures[value % cardTextures.length], emissive: 0xFFFFFF, emissiveIntensity: 0.0 }),
    ];
    const card = new THREE.Mesh(geometry, materials);
    card.position.set(x, 0, z);
    card.rotation.x = -Math.PI / 2;
    card.userData = { value, flipped: false, baseY: 0 };
    card.castShadow = true;
    scene.add(card);

    // Removed the general floating animation here

    return card;
  }

  function setupBoard() {
    const gridSize = Math.ceil(Math.sqrt(level * 2));
    const spacingX = 2.5;
    const spacingZ = 3.5;
    let values = Array.from({ length: level }, (_, i) => i).concat(Array.from({ length: level }, (_, i) => i));
    values = shuffle(values);

    for (let i = 0; i < values.length; i++) {
      const x = (i % gridSize - gridSize / 2 + 0.5) * spacingX;
      const z = (Math.floor(i / gridSize) - gridSize / 2 + 0.5) * spacingZ;
      cards.push(createCard(x, z, values[i]));
    }

    camera.position.z = gridSize * 3;
    camera.position.y = gridSize * 2;
    camera.lookAt(0, 0, 0);
  }

  function clearScene() {
    cards.forEach(card => {
      gsap.killTweensOf(card.position); // Still needed for hover animations
      scene.remove(card);
      card.geometry.dispose();
      card.material.forEach(mat => mat.dispose());
    });
    cards = [];
    flippedCards = [];
    scene.children.forEach(child => {
      if (child.isMesh && child.geometry instanceof THREE.PlaneGeometry) {
        scene.remove(child);
        child.geometry.dispose();
        child.material.dispose();
      }
    });
  }

  function restartGame() {
    clearScene();
    score = 0;
    consecutiveMatches = 0;
    timeRemaining = level * 3000 + 5000;
    document.getElementById('ui-overlay').style.display = 'none';
    document.getElementById('timer').style.display = 'block';
    document.getElementById('score').style.display = 'block';
    setupBoard();
    startTimer();
    renderer.shadowMap.enabled = true;
    cards.forEach(card => card.castShadow = true);

    if (backgroundMusic && !backgroundMusic.isPlaying) {
      backgroundMusic.play();
    }
  }

  function newGame() {
    clearScene();
    score = 0;
    consecutiveMatches = 0;
    timeRemaining = 0;
    document.getElementById('ui-overlay').innerHTML = `
      <h1>Memory Game</h1>
      <button class="start-btn" data-level="4">Easy</button>
      <button class="start-btn" data-level="8">Medium</button>
      <button class="start-btn" data-level="12">Hard</button>
    `;
    document.getElementById('ui-overlay').style.display = 'flex';
    if (backgroundMusic && backgroundMusic.isPlaying) {
      backgroundMusic.stop();
    }
    attachStartButtonListeners();
  }

  function flipCard(card) {
    if (card.userData.flipped || flippedCards.length >= 2) return;
    card.userData.flipped = true;
    gsap.to(card.rotation, {
      y: Math.PI,
      duration: 0.5,
      ease: 'power2.out',
    });
    flippedCards.push(card);

    if (flipSound && !flipSound.isPlaying) {
      flipSound.play();
    }

    if (flippedCards.length === 2) {
      setTimeout(checkMatch, 1000);
    }
  }

  function checkMatch() {
    if (flippedCards[0].userData.value === flippedCards[1].userData.value) {
      if (matchSound && !matchSound.isPlaying) {
        matchSound.play();
      }

      const points = Math.floor(timeRemaining / 1000);
      consecutiveMatches++;
      score += points + (consecutiveMatches > 1 ? consecutiveMatches * 5 : 0);

      const scoreElement = document.getElementById('score');
      scoreElement.textContent = `Score: ${score}`;

      flippedCards.forEach(card => {
        gsap.to(card.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.5,
          onComplete: () => {
            scene.remove(card);
            card.geometry.dispose();
            card.material.forEach(mat => mat.dispose());
          },
        });
      });
      cards = cards.filter(c => !flippedCards.includes(c));
      if (cards.length === 0) {
        document.getElementById('ui-overlay').innerHTML = `
          <h1>You Win!</h1>
          <p>Final Score: ${score}</p>
          <button class="play-again-btn">Play Again</button>
        `;
        document.getElementById('ui-overlay').style.display = 'flex';
        gsap.to(camera.position, { z: 10, y: 10, duration: 1, ease: 'power2.inOut' });

        if (winSound && !winSound.isPlaying) {
          winSound.play();
        }

        if (backgroundMusic && backgroundMusic.isPlaying) {
          backgroundMusic.stop();
        }

        if (timerInterval) {
          clearInterval(timerInterval);
        }
        document.getElementById('timer').style.display = 'none';
        document.getElementById('score').style.display = 'none';

        document.querySelector('.play-again-btn').addEventListener('click', restartGame);
      }
    } else {
      consecutiveMatches = 0;
      flippedCards.forEach(card => {
        card.userData.flipped = false;
        gsap.to(card.rotation, {
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        });
      });
    }
    flippedCards = [];
  }

  function startTimer() {
    timeRemaining = level * 3000 + 5000;

    const timerElement = document.getElementById('timer');
    const scoreElement = document.getElementById('score');
    timerElement.style.display = 'block';
    scoreElement.style.display = 'block';
    scoreElement.textContent = `Score: ${score}`;

    function updateTimerDisplay() {
      const seconds = Math.floor(timeRemaining / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      timerElement.textContent = `Time: ${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')} | Level: ${level === 4 ? 'Easy' : level === 8 ? 'Medium' : 'Hard'}`;
    }

    updateTimerDisplay();

    timerInterval = setInterval(() => {
      timeRemaining -= 1000;
      updateTimerDisplay();

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        if (cards.length > 0) {
          document.getElementById('ui-overlay').innerHTML = `
            <h1>Time’s Up!</h1>
            <p>Final Score: ${score}</p>
            <button class="play-again-btn">Play Again</button>
            <button class="new-game-btn">New Game</button>
          `;
          document.getElementById('ui-overlay').style.display = 'flex';

          if (loseSound && !loseSound.isPlaying) {
            loseSound.play();
          }

          if (backgroundMusic && backgroundMusic.isPlaying) {
            backgroundMusic.stop();
          }

          document.getElementById('timer').style.display = 'none';
          document.getElementById('score').style.display = 'none';

          document.querySelector('.play-again-btn').addEventListener('click', restartGame);
          document.querySelector('.new-game-btn').addEventListener('click', newGame);
        }
      }
    }, 1000);
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cards);
    if (intersects.length > 0) flipCard(intersects[0].object);
  });

  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cards);
    cards.forEach(card => {
      if (intersects.length > 0 && intersects[0].object === card && !card.userData.flipped) {
        gsap.to(card.position, { y: card.userData.baseY + 0.5, duration: 0.2 });
        gsap.to(card.material[4], { emissiveIntensity: 0.3, duration: 0.2 });
      } else {
        gsap.to(card.position, { y: card.userData.baseY, duration: 0.2 });
        gsap.to(card.material[4], { emissiveIntensity: 0, duration: 0.2 });
      }
    });
  });

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const matGeometry = new THREE.PlaneGeometry(4, 8);
  const matMaterial = matTexture
    ? new THREE.MeshStandardMaterial({
        map: matTexture,
        transparent: true,
        opacity: 0.8,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      })
    : new THREE.MeshStandardMaterial({
        color: 0x808080,
        transparent: true,
        opacity: 0.0,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      });

  if (matTexture) {
    const mat1 = new THREE.Mesh(matGeometry, matMaterial);
    mat1.position.set(-4, 0, 0);
    mat1.rotation.x = -Math.PI / 2;
    scene.add(mat1);

    const mat2 = new THREE.Mesh(matGeometry, matMaterial);
    mat2.position.set(0, 0, 0);
    mat2.rotation.x = -Math.PI / 2;
    scene.add(mat2);

    const mat3 = new THREE.Mesh(matGeometry, matMaterial);
    mat3.position.set(4, 0, 0);
    mat3.rotation.x = -Math.PI / 2;
    scene.add(mat3);
  }

  const starCount = 200;
  const starGeometry = new THREE.BufferGeometry();

  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 100;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const starColors = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const color = new THREE.Color();
    color.setHSL(Math.random(), 0.7, 0.7);
    starColors[i * 3] = color.r;
    starColors[i * 3 + 1] = color.g;
    starColors[i * 3 + 2] = color.b;
  }
  starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starOpacities = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    starOpacities[i] = Math.random() * 0.5 + 0.3;
  }
  starGeometry.setAttribute('opacity', new THREE.BufferAttribute(starOpacities, 1));

  const starMaterial = new THREE.PointsMaterial({
    size: 0.1,
    transparent: true,
    opacity: 0.9,
    vertexColors: true,
  });

  starMaterial.onBeforeCompile = shader => {
    shader.vertexShader = `
      attribute float opacity;
      varying float vOpacity;
      ${shader.vertexShader}
    `;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <fog_vertex>',
      `
      #include <fog_vertex>
      vOpacity = opacity;
      `
    );
    shader.fragmentShader = `
      varying float vOpacity;
      ${shader.fragmentShader}
    `;
    shader.fragmentShader = shader.fragmentShader.replace(
      'gl_FragColor = vec4( diffuse, opacity );',
      'gl_FragColor = vec4( diffuse, opacity * vOpacity );'
    );
  };

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  function animateStars() {
    const opacities = starGeometry.attributes.opacity.array;
    for (let i = 0; i < starCount; i++) {
      opacities[i] = 0.3 + 0.5 * Math.sin(Date.now() * 0.001 + i);
    }
    starGeometry.attributes.opacity.needsUpdate = true;
    requestAnimationFrame(animateStars);
  }
  animateStars();

  preloadTexturesAndAudio(() => {
    document.getElementById('ui-overlay').style.display = 'none';
    setupBoard();
    startTimer();
    renderer.shadowMap.enabled = true;
    cards.forEach(card => card.castShadow = true);

    if (backgroundMusic && !backgroundMusic.isPlaying) {
      backgroundMusic.play();
    }
  });
}