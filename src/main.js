// main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { startGame } from './game.js';

// Setup Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
document.getElementById('game-container').appendChild(renderer.domElement);

// Optimized lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient light
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Stronger directional light
directionalLight.position.set(5, 10, 5); // Angled for better shadows
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 512; // Lower resolution for performance
directionalLight.shadow.mapSize.height = 512;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Optional OrbitControls for debugging
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false; // Disabled by default

// Initial camera position
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Start game with loading feedback
document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('ui-overlay').innerHTML = '<h1>Loading...</h1>'; // Show loading state
  startGame(scene, camera, renderer); // game.js will hide overlay after textures load
  camera.position.set(0, 15, 15); // Adjusted for better view of cards
  camera.lookAt(0, 0, 0);
});

// Optional: Resize handler for responsiveness
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});