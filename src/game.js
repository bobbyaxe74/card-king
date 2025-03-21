// game.js
import * as THREE from 'three';
import { gsap } from 'gsap';

let backTexture;
let cardTextures = [];
let matTexture;

function preloadTextures(callback) {
  const loader = new THREE.TextureLoader();
  const texturePromises = [];

  texturePromises.push(new Promise(resolve => {
    loader.load('/assets/card-back.png', texture => {
      backTexture = texture;
      resolve();
    });
  }));

  for (let i = 1; i <= 12; i++) {
    texturePromises.push(new Promise(resolve => {
      loader.load(`/assets/card${i}.png`, texture => {
        cardTextures.push(texture);
        resolve();
      }, undefined, () => {
        cardTextures.push(new THREE.TextureLoader().load('/assets/card1.png'));
        resolve();
      });
    }));
  }

  texturePromises.push(new Promise(resolve => {
    loader.load('/assets/mat.png', texture => {
      matTexture = texture;
      resolve();
    }, undefined, () => {
      matTexture = null;
      resolve();
    });
  }));

  Promise.all(texturePromises).then(callback);
}

export function startGame(scene, camera, renderer, level = 8) {
  let cards = [];
  let flippedCards = [];

  const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

  function createCard(x, z, value) {
    const geometry = new THREE.BoxGeometry(2, 3, 0.1);
    const materials = [
      edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial,
      new THREE.MeshStandardMaterial({ map: backTexture }),
      new THREE.MeshStandardMaterial({ map: cardTextures[value % cardTextures.length] }),
    ];
    const card = new THREE.Mesh(geometry, materials);
    card.position.set(x, 0, z);
    card.rotation.x = -Math.PI / 2;
    card.userData = { value, flipped: false, baseY: 0 };
    card.castShadow = true;
    scene.add(card);

    // Add floating animation
    gsap.to(card.position, {
      y: "+=0.5",
      duration: 2 + Math.random() * 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: Math.random() * 2,
    });

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

  function flipCard(card) {
    if (card.userData.flipped || flippedCards.length >= 2) return;
    card.userData.flipped = true;
    gsap.to(card.rotation, {
      y: card.rotation.y + Math.PI,
      duration: 0.5,
      ease: 'power2.out',
    });
    flippedCards.push(card);

    if (flippedCards.length === 2) {
      setTimeout(checkMatch, 1000);
    }
  }

  function checkMatch() {
    if (flippedCards[0].userData.value === flippedCards[1].userData.value) {
      flippedCards.forEach(card => {
        gsap.to(card.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.5,
          onComplete: () => scene.remove(card),
        });
      });
      cards = cards.filter(c => !flippedCards.includes(c));
      if (cards.length === 0) {
        document.getElementById('ui-overlay').innerHTML = '<h1>You Win!</h1>';
        document.getElementById('ui-overlay').style.display = 'flex';
        gsap.to(camera.position, { z: 10, y: 10, duration: 1, ease: 'power2.inOut' });
      }
    } else {
      flippedCards.forEach(card => {
        card.userData.flipped = false;
        gsap.to(card.rotation, {
          y: card.rotation.y + Math.PI,
          duration: 0.5,
          ease: 'power2.out',
        });
      });
    }
    flippedCards = [];
  }

  function startTimer() {
    const timerDuration = level * 4000;
    const timerGeometry = new THREE.BoxGeometry(10, 0.2, 0.2);
    const timerMaterial = new THREE.MeshStandardMaterial({ color: 0xC0392B });
    const timerBar = new THREE.Mesh(timerGeometry, timerMaterial);
    timerBar.position.set(0, 5, 0);
    scene.add(timerBar);

    gsap.to(timerBar.scale, {
      x: 0,
      duration: timerDuration / 1000,
      ease: 'linear',
      onComplete: () => {
        if (cards.length > 0) {
          document.getElementById('ui-overlay').innerHTML = '<h1>Time’s Up!</h1>';
          document.getElementById('ui-overlay').style.display = 'flex';
        }
      },
    });
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
      } else {
        gsap.to(card.position, { y: card.userData.baseY, duration: 0.2 });
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

  // Mats (Floating in Space, Fully Transparent)
  const matGeometry = new THREE.PlaneGeometry(4, 8);
  const matMaterial = matTexture
    ? new THREE.MeshStandardMaterial({
        map: matTexture,
        transparent: true,
        opacity: 0.8,
        alphaTest: 0.5,
        side: THREE.DoubleSide, // Ensure visibility from all angles
      })
    : new THREE.MeshStandardMaterial({
        color: 0x808080,
        transparent: true,
        opacity: 0.0, // Fully transparent if no texture
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      });

  // Only add mats if the texture loaded successfully and isn't fully transparent
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

  // NET-like Background Effect
  const netParticleCount = 100;
  const netGeometry = new THREE.BufferGeometry();
  const netPositions = new Float32Array(netParticleCount * 3);
  const netVelocities = new Float32Array(netParticleCount * 3);

  for (let i = 0; i < netParticleCount; i++) {
    netPositions[i * 3] = (Math.random() - 0.5) * 50;
    netPositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    netPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    netVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
    netVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
    netVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
  }

  netGeometry.setAttribute('position', new THREE.BufferAttribute(netPositions, 3));
  const netMaterial = new THREE.PointsMaterial({
    size: 0.1,
    color: 0x00FFFF,
    transparent: true,
    opacity: 0.7,
  });
  const netParticles = new THREE.Points(netGeometry, netMaterial);
  scene.add(netParticles);

  const maxConnections = 5;
  const maxDistance = 10;
  const lineGeometry = new THREE.BufferGeometry();
  const linePositions = new Float32Array(netParticleCount * maxConnections * 6);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00FFFF,
    transparent: true,
    opacity: 0.3,
  });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  function updateLines() {
    const positions = netParticles.geometry.attributes.position.array;
    let lineIndex = 0;

    for (let i = 0; i < netParticleCount; i++) {
      const x1 = positions[i * 3];
      const y1 = positions[i * 3 + 1];
      const z1 = positions[i * 3 + 2];
      let connections = 0;

      for (let j = 0; j < netParticleCount; j++) {
        if (i === j || connections >= maxConnections) continue;

        const x2 = positions[j * 3];
        const y2 = positions[j * 3 + 1];
        const z2 = positions[j * 3 + 2];

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < maxDistance) {
          linePositions[lineIndex * 6] = x1;
          linePositions[lineIndex * 6 + 1] = y1;
          linePositions[lineIndex * 6 + 2] = z1;
          linePositions[lineIndex * 6 + 3] = x2;
          linePositions[lineIndex * 6 + 4] = y2;
          linePositions[lineIndex * 6 + 5] = z2;
          lineIndex++;
          connections++;
        }
      }
    }

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setDrawRange(0, lineIndex * 2);
    lineGeometry.attributes.position.needsUpdate = true;
  }

  function animateNet() {
    const positions = netParticles.geometry.attributes.position.array;
    for (let i = 0; i < netParticleCount; i++) {
      positions[i * 3] += netVelocities[i * 3];
      positions[i * 3 + 1] += netVelocities[i * 3 + 1];
      positions[i * 3 + 2] += netVelocities[i * 3 + 2];

      if (positions[i * 3] > 25) positions[i * 3] = -25;
      if (positions[i * 3] < -25) positions[i * 3] = 25;
      if (positions[i * 3 + 1] > 25) positions[i * 3 + 1] = -25;
      if (positions[i * 3 + 1] < -25) positions[i * 3 + 1] = 25;
      if (positions[i * 3 + 2] > 25) positions[i * 3 + 2] = -25;
      if (positions[i * 3 + 2] < -25) positions[i * 3 + 2] = 25;
    }
    netParticles.geometry.attributes.position.needsUpdate = true;
    updateLines();
    requestAnimationFrame(animateNet);
  }

  preloadTextures(() => {
    document.getElementById('ui-overlay').style.display = 'none';
    setupBoard();
    startTimer();
    renderer.shadowMap.enabled = true;
    cards.forEach(card => card.castShadow = true);
    animateNet();
  });
}