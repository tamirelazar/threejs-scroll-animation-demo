import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { TextureLoader } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// Setup

const scene = new THREE.Scene();

// Add this near the beginning of your file, after scene creation
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 0, 10);
spotLight.angle = Math.PI / 4;
spotLight.penumbra = 0.1;
spotLight.decay = 2;
spotLight.distance = 1000;
spotLight.castShadow = true;
scene.add(spotLight);

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
renderer.outputEncoding = THREE.sRGBEncoding;

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

// Add this after creating your lights
console.log('Ambient Light:', ambientLight);
console.log('Spot Light:', spotLight);

// Also, try increasing the intensity of your lights
ambientLight.intensity = 0.5;
spotLight.intensity = 1;
spotLight.position.set(0, 10, 10);

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
const loader = new GLTFLoader();
let tamirModel;

loader.load(
    'tamir.glb',
    function (gltf) {
        console.log('GLB loaded:', gltf);

        tamirModel = gltf.scene;
        
        const radius = torus.geometry.parameters.radius;
        tamirModel.rotation.y = -(Math.PI / 2); // Rotate 90 degrees on the y-axis
        tamirModel.scale.set(13, 13, 13);
        tamirModel.position.set(0, -(radius/2), -50); // Set the position relative to the torus

        tamirModel.traverse(function (child) {
            if (child.isMesh) {
                console.log('Mesh found:', child.name);
                console.log('Material:', child.material);

                // Enable shadow casting and receiving for each mesh
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material.map) {
                    console.log('Texture:', child.material.map);
                    child.material.map.encoding = THREE.sRGBEncoding;
                    child.material.needsUpdate = true;
                } else {
                    console.log('No texture found for this mesh');
                }
            }
        });

        camera.add(tamirModel); // Add the model to the camera
        scene.add(camera); // Ensure the camera is added to the scene

        // Add a spotlight in front of the model
        const modelSpotLight = new THREE.SpotLight(0xffffff, 1);
        modelSpotLight.position.set(0, 0, 10); // Position the light in front of the model
        modelSpotLight.angle = Math.PI / 4; // Narrow the spotlight angle
        modelSpotLight.penumbra = 0.1; // Soften the edges of the spotlight
        modelSpotLight.decay = 2; // Light decay
        modelSpotLight.distance = 1000; // Maximum range of the light
        modelSpotLight.castShadow = true; // Enable shadow casting

        camera.add(modelSpotLight); // Add the spotlight to the camera so it moves with the model

        // Render the scene after the model is loaded
        renderer.render(scene, camera);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error happened', error);
    }
);

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
  //camera.rotateY(0.01);

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

function compactGLB(bool) {
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
window.compactGLB = compactGLB;

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
