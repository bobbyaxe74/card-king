// game.js
import * as THREE from 'three';
import { gsap } from 'gsap';

export function startGame(scene, camera, renderer) {
  let cards = [];
  let flippedCards = [];
  const level = 8; // 8 pairs = 16 cards

  // Placeholder textures (add your own in /src/assets/)
  const cardTextures = [
    new THREE.TextureLoader().load('https://via.placeholder.com/200x300/FF0000/FFFFFF?text=1'),
    new THREE.TextureLoader().load('https://via.placeholder.com/200x300/00FF00/FFFFFF?text=2'),
    new THREE.TextureLoader().load('https://via.placeholder.com/200x300/0000FF/FFFFFF?text=3'),
    new THREE.TextureLoader().load('https://via.placeholder.com/200x300/FFFF00/FFFFFF?text=4'),
    new THREE.TextureLoader().load('https://via.placeholder.com/200x300/FF00FF/FFFFFF?text=5'),
    new THREE.TextureLoader().load('https://via.placeholder.com/200x300/00FFFF/FFFFFF?text=6'),
    new THREE.TextureLoader().load('https://via.placeholder.com/200x300/800080/FFFFFF?text=7'),
    new THREE.TextureLoader().load('https://via.placeholder.com/200x300/808080/FFFFFF?text=8'),
  ];
  const backTexture = new THREE.TextureLoader().load('https://via.placeholder.com/200x300/16A085/FFFFFF?text=Back');

  function createCard(x, z, value) {
    const geometry = new THREE.BoxGeometry(2, 3, 0.1); // Width, height, thickness
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x333333 }), // Left
      new THREE.MeshStandardMaterial({ color: 0x333333 }), // Right
      new THREE.MeshStandardMaterial({ color: 0x333333 }), // Top
      new THREE.MeshStandardMaterial({ color: 0x333333 }), // Bottom
      new THREE.MeshStandardMaterial({ map: backTexture }), // Front (visible initially)
      new THREE.MeshStandardMaterial({ map: cardTextures[value] }), // Back (visible when flipped)
    ];
    const card = new THREE.Mesh(geometry, materials);
    card.position.set(x, 0, z);
    card.rotation.x = -Math.PI / 2; // Lay flat
    card.userData = { value, flipped: false };
    scene.add(card);
    return card;
  }

  function setupBoard() {
    const gridSize = 4;
    const spacing = 2.5;
    let values = Array.from({ length: level }, (_, i) => i).concat(Array.from({ length: level }, (_, i) => i));
    values = shuffle(values);

    for (let i = 0; i < values.length; i++) {
      const x = (i % gridSize - gridSize / 2 + 0.5) * spacing;
      const z = (Math.floor(i / gridSize) - gridSize / 2 + 0.5) * spacing;
      cards.push(createCard(x, z, values[i]));
    }
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
    const timerDuration = 30000;
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

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Add a floor for context
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.1;
  scene.add(floor);

  setupBoard();
  startTimer();

  renderer.shadowMap.enabled = true; // Enable shadows
  cards.forEach(card => card.castShadow = true); // After setupBoard
  floor.receiveShadow = true; // Add in game.js after floor creation
}