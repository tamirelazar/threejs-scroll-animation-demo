import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { TextureLoader } from 'three';
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
    object.rotation.y = Math.PI / 2; // Rotate 90 degrees on the y-axis
    object.scale.set(13, 13, 13);
    object.position.set(0, -(radius/2), -50); // Set the position relative to the torus

    // Apply materials and textures
    object.traverse(function (child) {
        if (child.isMesh) {
            // Check if the child already has a material with a map (texture)
            if (child.material && child.material.map) {
                // If it does, we can just use that material
                child.material.needsUpdate = true;
            } else {
                // If it doesn't, we can create a new material
                child.material = new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    specular: 0x333333,
                    shininess: 25
                });
            }
        }
    });

    tamirModel = object; // Store the model reference
    camera.add(object); // Add the model to the camera

    // Add a spotlight in front of the model
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 0, 10); // Position the light in front of the model
    spotLight.target = tamirModel; // Point the light at the model
    spotLight.angle = Math.PI / 4; // Narrow the spotlight angle
    spotLight.penumbra = 0.1; // Soften the edges of the spotlight
    spotLight.decay = 2; // Light decay
    spotLight.distance = 1000; // Maximum range of the light

    // // Add a helper to visualize the spotlight (optional, remove in production)
    // const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    // scene.add(spotLightHelper);

    camera.add(spotLight); // Add the spotlight to the camera so it moves with the model

    scene.add(camera); // Ensure the camera is added to the scene
}, 
// onProgress callback
function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
},
// onError callback
function (error) {
    console.error('An error happened', error);
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

  // Update the spotlight helper
  if (typeof spotLightHelper !== 'undefined') {
      spotLightHelper.update();
  }
}

animate();

function compactFBX(bool) {
    if (!tamirModel) return; // Ensure the model is loaded

    const radius = torus.geometry.parameters.radius;

    const targetPositionZ = bool ? -35 : -50;
    const targetPositionY = bool ? -15 : -(radius/2);
    const targetScale = bool ? 16 : 13; // Adjust these values as needed

    const duration = 2000; // Duration of the animation in milliseconds
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

function compactTorus(bool) {
    if (!torus) return; // Ensure the torus exists

    const targetRadius = bool ? 18 : 24; // Smaller radius when compact
    const targetTubeRadius = bool ? 0.15 : 0.2; // Smaller tube radius when compact
    const targetPositionZ = bool ? -35 : -50; // Move closer when compact

    const duration = 2000; // Duration of the animation in milliseconds
    const startTime = performance.now();

    function animate() {
        const elapsedTime = performance.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        const currentRadius = THREE.MathUtils.lerp(torus.geometry.parameters.radius, targetRadius, progress);
        const currentTubeRadius = THREE.MathUtils.lerp(torus.geometry.parameters.tube, targetTubeRadius, progress);
        
        // Update torus geometry
        torus.geometry.dispose(); // Dispose of old geometry
        torus.geometry = new THREE.TorusGeometry(currentRadius, currentTubeRadius, 16, 100);

        // Update position
        torus.position.z = THREE.MathUtils.lerp(torus.position.z, targetPositionZ, progress);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// Expose the function to the global scope
window.compactTorus = compactTorus;