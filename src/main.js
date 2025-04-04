// main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { startGame } from './game.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('game-container').appendChild(renderer.domElement);

scene.background = new THREE.Color(0x000000);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 512;
directionalLight.shadow.mapSize.height = 512;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
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

export function attachStartButtonListeners() {
  document.querySelectorAll('.start-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('ui-overlay').innerHTML = '<h1>Loading...</h1>';
      const level = parseInt(btn.dataset.level);
      const audioContext = new THREE.AudioListener().context;
      audioContext.resume().then(() => {
        startGame(scene, camera, renderer, level, attachStartButtonListeners); // Pass the function
        camera.position.set(0, 15, 15);
        camera.lookAt(0, 0, 0);
      });
    });
  });
}
attachStartButtonListeners();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});