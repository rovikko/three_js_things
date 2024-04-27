import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import * as GUI from 'dat.gui';

const LG_NAME = 'LG';

const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1e-20, 1e20);
camera.position.z = 5;

document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight)

const light = new THREE.HemisphereLight('white', 'grey');
scene.add(light);

const controls = new OrbitControls(camera, renderer.domElement);

const radius = 2;
const step = 10;

const geomLimit = 1000000;

const distThreshold = 1;//.3486
const N = 360 / step;
const rand = 0;

const center = new THREE.Vector3();
const pointer = new THREE.Vector3(0, radius, 0);

const pointsOnSphere = [];

const a = performance.now();

const props = {
    generate: () => recreateLG(true),
    randomizeAngle: 5,
    randomizeRadius: 0,
    angleStep: 10,
    connectionThreshold: 0.5,
    points: [],
    recreateSphere: true,
    mode: 'closest' // dist, closest
}

function generateSpherePoints(forceRegen) {
    if (!props.recreateSphere && props.points.length > 0 && !forceRegen) {
        return props.points;
    }

    const pointsOnSphere = [];
    const N = 360 / props.angleStep;
    const step = props.angleStep;
    const rand = props.randomizeAngle;
    const randRadius = props.randomizeRadius;


    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            const angle1 = ((i * step) + Math.random() * rand) * THREE.MathUtils.DEG2RAD;
            const angle2 = ((j * step) + Math.random() * rand) * THREE.MathUtils.DEG2RAD;
            const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle1);
            const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle2);
            const v2 = pointer.clone().applyQuaternion(q1.clone().multiply(q2))
            v2.multiplyScalar(1 + (-randRadius + Math.random() * randRadius))
            pointsOnSphere.push(v2);
        }
    }
    props.points = pointsOnSphere;
    return props.points;
}

function connectByThreshold(points) {
    const geomPoints = [];
    // threshold variant
    const distThreshold = props.connectionThreshold;
    for (const point1 of points) {
        for (const point2 of points) {
            if (point1.distanceTo(point2) < distThreshold) {
                geomPoints.push(point1, point2);
                if (geomPoints.length > geomLimit) {
                    break;
                }
            }
        }
    }
    return geomPoints;
}

function connectByClosest(points) {
    const geomPoints = [];
    for (const point1 of points) {
        let min = new THREE.Vector3(Infinity, Infinity, Infinity);
        for (const point2 of points) {
            if (point1.distanceTo(point2) < point1.distanceTo(min) && !point1.equals(point2)) {
                min = point2;
            }
        }
        geomPoints.push(point1, min);
        if (geomPoints.length > geomLimit) {
            break;
        }
    }
    return geomPoints;
}

function connectByClosestThreshold(points) {
    const geomPoints = [];
    const distThreshold = props.connectionThreshold;
    for (const point1 of points) {
        let min = point1;
        for (const point2 of points) {
            if (point1.distanceTo(point2) < distThreshold && !point1.equals(point2)) {
                min = point2;
            }
        }
        geomPoints.push(point1, min);
        if (geomPoints.length > geomLimit) {
            break;
        }
    }
    return geomPoints;
}

function createLG(geomPoints) {
    const lg = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(geomPoints), new THREE.LineBasicMaterial());
    lg.name = LG_NAME;
    return lg;
}

function recreateLG(forceRegen = false) {
    const lg = scene.getObjectByName(LG_NAME)
    scene.remove(lg);

    const points = generateSpherePoints(forceRegen);
    const connections = props.mode === 'dist' ? connectByThreshold(points) : connectByClosestThreshold(points);
    const newlg = createLG(connections)

    scene.add(newlg);
}

addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        recreateLG();
    }
})

const gui = new GUI.GUI();
gui.add(props, 'generate');
gui.add(props, 'recreateSphere');

gui.add(props, 'angleStep', 5, 30, 1).onChange(() => recreateLG());
gui.add(props, 'connectionThreshold', 0.1, 2, 0.0001).onChange(() => recreateLG(false));

gui.add(props, 'randomizeAngle', 0, 45, 1).onChange(() => recreateLG());
gui.add(props, 'randomizeRadius', 0, 3, 0.0001).onChange(() => recreateLG());

gui.add(props, 'mode', { dist: 'dist', closest: 'closest' }).onChange(() => recreateLG());

recreateLG();

animate();

function animate() {
    1
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function addLine(p1, p2) {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p1, p2]), new THREE.LineBasicMaterial());
    scene.add(line);
}






// VERY IMPORTANT CODE

// for (let i = 0; i < N; i++) {
//     for (let j = 0; j < N; j++) {
//         const angle1 = ((i * step) + Math.random() * rand) * THREE.MathUtils.DEG2RAD;
//         const angle2 = ((j * step) + Math.random() * rand) * THREE.MathUtils.DEG2RAD;
//         const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle1);
//         const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle2);
//         const v2 = pointer.clone().applyQuaternion(q1.clone().multiply(q2))
//         v2.multiplyScalar(0.8 + Math.random() * 1)
//         // const v1 = v2.clone().multiplyScalar(0.99);
//         pointsOnSphere.push(v2);
//         // addLine(v1, v2);
//     }
// }

// const geomPoints = [];

// threshold variant
// for (const point1 of pointsOnSphere) {
//     for (const point2 of pointsOnSphere) {
//         if (point1.distanceTo(point2) < distThreshold) {
//             geomPoints.push(point1, point2);
//             if (geomPoints.length > geomLimit) {
//                 break;
//             }
//         }
//     }
// }

// console.log(performance.now() - a)
// console.log(pointsOnSphere);
// console.log(geomPoints);

// scene.add(createLG(connectByThreshold(generateSpherePoints())))

// closest point variant
// for (const point1 of pointsOnSphere) {
//     let min = point1;
//     for (const point2 of pointsOnSphere) {
//         if (point1.distanceTo(point2) < distThreshold && !point1.equals(point2)) {
//             min = point2;
//         }
//     }
//     addLine(point1, min);
// }