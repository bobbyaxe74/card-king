import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { startGame } from './game.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Stronger directional
directionalLight.position.set(5, 10, 5); // Angle it
directionalLight.castShadow = true; // Add shadows
scene.add(directionalLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('ui-overlay').style.display = 'none';
  startGame(scene, camera, renderer);
  camera.position.set(0, 15, 15); // Adjusted
  camera.lookAt(0, 0, 0);
});
