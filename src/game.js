// game.js
import * as THREE from 'three';
import { gsap } from 'gsap';

let backTexture;
let cardTextures = [];

function preloadTextures(callback) {
  const loader = new THREE.TextureLoader();
  const texturePromises = [];

  texturePromises.push(new Promise(resolve => {
    loader.load('/assets/card-back.png', texture => {
      backTexture = texture;
      resolve();
    });
  }));

  for (let i = 1; i <= 8; i++) {
    texturePromises.push(new Promise(resolve => {
      loader.load(`/assets/card${i}.png`, texture => {
        cardTextures.push(texture);
        resolve();
      });
    }));
  }

  Promise.all(texturePromises).then(callback);
}

export function startGame(scene, camera, renderer) {
  let cards = [];
  let flippedCards = [];
  const level = 8;

  const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

  function createCard(x, z, value) {
    const geometry = new THREE.BoxGeometry(2, 3, 0.1);
    const materials = [
      edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial,
      new THREE.MeshStandardMaterial({ map: backTexture }),
      new THREE.MeshStandardMaterial({ map: cardTextures[value] }),
    ];
    const card = new THREE.Mesh(geometry, materials);
    card.position.set(x, 0, z);
    card.rotation.x = -Math.PI / 2;
    card.userData = { value, flipped: false };
    card.castShadow = true;
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

  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.1;
  floor.receiveShadow = true;
  scene.add(floor);

  preloadTextures(() => {
    document.getElementById('ui-overlay').style.display = 'none';
    setupBoard();
    startTimer();
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    cards.forEach(card => card.castShadow = true);
  });
}