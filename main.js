import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// Setup

const scene = new THREE.Scene();

// Get the frame container dimensions
const frameContainer = document.getElementById('frameContainer');
const frameWidth = frameContainer.clientWidth;
const frameHeight = frameContainer.clientHeight;

// Update the camera to use the frame's dimensions
const camera = new THREE.PerspectiveCamera(85, frameWidth / frameHeight, 0.1, 1000);

// Update the renderer to use the frame's dimensions
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(frameWidth, frameHeight);

renderer.render(scene, camera);

// Torus 

const geometry = new THREE.TorusGeometry(24, 0.2, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0xff6347 });
const torus = new THREE.Mesh(geometry, material);

torus.position.set(0, 0, -50); // Set the position relative to the camera
//torus.position.set(-10, 4, -30); // Set the position relative to the camera

camera.add(torus);

// Lights

const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

// Helpers

// const lightHelper = new THREE.PointLightHelper(pointLight)
// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(lightHelper, gridHelper)

// const controls = new OrbitControls(camera, renderer.domElement);

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  scene.add(star);
}

Array(200).fill().forEach(addStar);

// Background

const spaceTexture = new THREE.TextureLoader().load('space.jpg');
scene.background = spaceTexture;

// Load the Tamir.fbx model
const loader = new FBXLoader();
let tamirModel;
loader.load('Tamir.fbx', function (object) {
    const radius = torus.geometry.parameters.radius;
    object.rotation.y = Math.PI / 2; // Rotate 90 degrees on the z-axis
    object.scale.set(13, 13, 13);
    object.position.set(0, -(radius/2), -50); // Set the position relative to the torus

    tamirModel = object; // Store the model reference
    camera.add(object); // Add the model to the camera
    scene.add(camera); // Ensure the camera is added to the scene
}, undefined, function (error) {
    console.error(error);
});

// Moon

const moonTexture = new THREE.TextureLoader().load('moon.jpg');
const normalTexture = new THREE.TextureLoader().load('normal.jpg');

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    normalMap: normalTexture,
  })
);

//scene.add(moon);

moon.position.z = -30;
moon.position.y = 3;
//moon.position.setX(-10);

// Rotate Camera to Look At

function rotateCameraToLookAt() {
  const t = document.body.getBoundingClientRect().top;
  // moon.rotation.x += 0.05;
  // moon.rotation.y += 0.075;
  // moon.rotation.z += 0.05;

  camera.position.z = t * -0.01;
  camera.position.x = t * -0.0002;
  camera.rotation.y = t * -0.0002;

  // Make the camera look at the torus
  const direction = new THREE.Vector3();
  direction.subVectors(torus.position, camera.position).normalize();
  
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
  
  camera.quaternion.copy(quaternion);
  
  const inverseQuaternion = quaternion.clone().invert();
  torus.quaternion.copy(inverseQuaternion);
}

document.body.onscroll = rotateCameraToLookAt;
rotateCameraToLookAt();

// Animation Loop

function animate() {
  requestAnimationFrame(animate);

  //torus.rotation.x += 0.005;
  //torus.rotation.y += 0.001;
  //torus.rotation.z += 0.005;

  //torus.position.x += Math.sin(Date.now() * 0.001);

  moon.rotation.x += 0.005;

  // controls.update();

  renderer.render(scene, camera);
}

animate();

function compactTorus(bool) {
  const targetPositionZ = bool ? -34 : -50;
  const targetScale = bool ? 0.75 : 1;

  const duration = 1000; // Duration of the animation in milliseconds
  const startTime = performance.now();

  function animate() {
    const elapsedTime = performance.now() - startTime;
    const progress = Math.min(elapsedTime / duration, 1);

    torus.position.z = THREE.MathUtils.lerp(torus.position.z, targetPositionZ, progress);
    const scale = THREE.MathUtils.lerp(torus.scale.x, targetScale, progress);
    torus.scale.set(scale, scale, scale);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

// Expose the function to the global scope
window.compactTorus = compactTorus;

function compactFBX(bool) {
  if (!tamirModel) return; // Ensure the model is loaded

  const radius = torus.geometry.parameters.radius;

  const targetPositionZ = bool ? -15 : -50;
  const targetPositionY = bool ? -18 : -(radius/2);
  const targetScale = bool ? 13 : 13;

  const duration = 1000; // Duration of the animation in milliseconds
  const startTime = performance.now();

  function animate() {
    const elapsedTime = performance.now() - startTime;
    const progress = Math.min(elapsedTime / duration, 1);

    tamirModel.position.z = THREE.MathUtils.lerp(tamirModel.position.z, targetPositionZ, progress);
    tamirModel.position.y = THREE.MathUtils.lerp(tamirModel.position.y, targetPositionY, progress);

    const scale = THREE.MathUtils.lerp(tamirModel.scale.x, targetScale, progress);
    tamirModel.scale.set(scale, scale, scale);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

// Expose the function to the global scope
window.compactFBX = compactFBX;