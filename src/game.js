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
      new THREE.MeshStandardMaterial({ map: backTexture, emissive: 0x00FFFF, emissiveIntensity: 0.2 }),
      new THREE.MeshStandardMaterial({ map: cardTextures[value % cardTextures.length], emissive: 0x00FFFF, emissiveIntensity: 0.2 }),
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

  // Star Particles (Background)
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
    color.setHSL(Math.random(), 0.7, 0.7); // Random hue, high saturation, high lightness
    starColors[i * 3] = color.r;
    starColors[i * 3 + 1] = color.g;
    starColors[i * 3 + 2] = color.b;
  }
  starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starOpacities = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    starOpacities[i] = Math.random() * 0.5 + 0.3; // Random opacity between 0.3 and 0.8
  }
  starGeometry.setAttribute('opacity', new THREE.BufferAttribute(starOpacities, 1));

  const starMaterial = new THREE.PointsMaterial({
    size: 0.1,
    transparent: true,
    opacity: 0.9,
    vertexColors: true, // Enable per-vertex colors
  });

  // Custom shader to handle per-vertex opacity
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
      opacities[i] = 0.3 + 0.5 * Math.sin(Date.now() * 0.001 + i); // Twinkle effect
    }
    starGeometry.attributes.opacity.needsUpdate = true;
    requestAnimationFrame(animateStars);
  }
  animateStars();

  preloadTextures(() => {
    document.getElementById('ui-overlay').style.display = 'none';
    setupBoard();
    startTimer();
    renderer.shadowMap.enabled = true;
    cards.forEach(card => card.castShadow = true);
  });
}