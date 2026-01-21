import * as THREE from "./vendor/three.module.js";
import * as CANNON from "./vendor/cannon-es.js";

const canvas = document.querySelector("#c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xe7e1d6, 6, 16);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 2.8, 6.6);

const hemi = new THREE.HemisphereLight(0xffffff, 0x8a775f, 0.7);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 0.9);
key.position.set(3, 6, 2);
scene.add(key);

const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
world.allowSleep = true;

const groundMat = new CANNON.Material("ground");
const bodyMat = new CANNON.Material("body");
const contactMat = new CANNON.ContactMaterial(groundMat, bodyMat, {
  friction: 0.6,
  restitution: 0.1,
});
world.addContactMaterial(contactMat);

const groundBody = new CANNON.Body({ mass: 0, material: groundMat });
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const groundGeo = new THREE.PlaneGeometry(30, 30);
const groundMat3 = new THREE.MeshStandardMaterial({ color: 0xd6cbb9 });
const groundMesh = new THREE.Mesh(groundGeo, groundMat3);
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

const wallMat = new THREE.MeshStandardMaterial({ color: 0xd8d0c2, side: THREE.DoubleSide });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), wallMat);
backWall.position.set(0, 2.6, -3.0);
scene.add(backWall);

const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), wallMat);
leftWall.position.set(-3.0, 2.6, 0);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), wallMat);
rightWall.position.set(3.0, 2.6, 0);
rightWall.rotation.y = -Math.PI / 2;
scene.add(rightWall);

const roof = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), wallMat);
roof.position.set(0, 4.5, 0);
roof.rotation.x = Math.PI / 2;
scene.add(roof);

const backWallBody = new CANNON.Body({ mass: 0 });
backWallBody.addShape(new CANNON.Plane());
backWallBody.position.set(0, 0, -3.0);
world.addBody(backWallBody);

const leftWallBody = new CANNON.Body({ mass: 0 });
leftWallBody.addShape(new CANNON.Plane());
leftWallBody.position.set(-3.0, 0, 0);
leftWallBody.quaternion.setFromEuler(0, Math.PI / 2, 0);
world.addBody(leftWallBody);

const rightWallBody = new CANNON.Body({ mass: 0 });
rightWallBody.addShape(new CANNON.Plane());
rightWallBody.position.set(3.0, 0, 0);
rightWallBody.quaternion.setFromEuler(0, -Math.PI / 2, 0);
world.addBody(rightWallBody);

const roofBody = new CANNON.Body({ mass: 0 });
roofBody.addShape(new CANNON.Plane());
roofBody.position.set(0, 4.5, 0);
roofBody.quaternion.setFromEuler(Math.PI / 2, 0, 0);
world.addBody(roofBody);

const meshToBody = new Map();
const pinMeshes = [];
const basketGroup = new THREE.Group();
const hintEl = document.querySelector(".hint");
const bodyColor = 0x7e5d41;
const nails = [];

function makeBox(name, size, position, mass = 0.6) {
  const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
  const mat = new THREE.MeshStandardMaterial({ color: bodyColor });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const half = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
  const shape = new CANNON.Box(half);
  const body = new CANNON.Body({ mass, material: bodyMat });
  body.addShape(shape);
  body.position.set(position.x, position.y, position.z);
  body.linearDamping = 0.45;
  body.angularDamping = 0.9;
  world.addBody(body);

  meshToBody.set(mesh, body);
  return { mesh, body, size };
}

function makeSphere(name, radius, position, mass = 0.5) {
  const geo = new THREE.SphereGeometry(radius, 24, 18);
  const mat = new THREE.MeshStandardMaterial({ color: bodyColor });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  scene.add(mesh);

  const shape = new CANNON.Sphere(radius);
  const body = new CANNON.Body({ mass, material: bodyMat });
  body.addShape(shape);
  body.position.set(position.x, position.y, position.z);
  body.linearDamping = 0.45;
  body.angularDamping = 0.9;
  world.addBody(body);

  meshToBody.set(mesh, body);
  return { mesh, body, radius };
}

const torso = makeBox("Torso", new THREE.Vector3(0.6, 0.9, 0.35), new THREE.Vector3(0, 2.6, 0), 1.2);
const head = makeSphere("Head", 0.26, new THREE.Vector3(0, 3.3, 0), 0.6);

const upperArmL = makeBox("UpperArm_L", new THREE.Vector3(0.2, 0.5, 0.2), new THREE.Vector3(-0.55, 2.75, 0), 0.5);
const lowerArmL = makeBox("LowerArm_L", new THREE.Vector3(0.18, 0.45, 0.18), new THREE.Vector3(-0.55, 2.2, 0), 0.45);
const upperArmR = makeBox("UpperArm_R", new THREE.Vector3(0.2, 0.5, 0.2), new THREE.Vector3(0.55, 2.75, 0), 0.5);
const lowerArmR = makeBox("LowerArm_R", new THREE.Vector3(0.18, 0.45, 0.18), new THREE.Vector3(0.55, 2.2, 0), 0.45);

const upperLegL = makeBox("UpperLeg_L", new THREE.Vector3(0.24, 0.6, 0.24), new THREE.Vector3(-0.2, 1.95, 0), 0.7);
const lowerLegL = makeBox("LowerLeg_L", new THREE.Vector3(0.22, 0.55, 0.22), new THREE.Vector3(-0.2, 1.4, 0), 0.6);
const upperLegR = makeBox("UpperLeg_R", new THREE.Vector3(0.24, 0.6, 0.24), new THREE.Vector3(0.2, 1.95, 0), 0.7);
const lowerLegR = makeBox("LowerLeg_R", new THREE.Vector3(0.22, 0.55, 0.22), new THREE.Vector3(0.2, 1.4, 0), 0.6);

function addBallJoint(bodyA, bodyB, pivotA, pivotB) {
  const constraint = new CANNON.PointToPointConstraint(bodyA, pivotA, bodyB, pivotB);
  world.addConstraint(constraint);
}

function addHinge(bodyA, bodyB, pivotA, pivotB, axis, min, max) {
  const constraint = new CANNON.HingeConstraint(bodyA, bodyB, {
    pivotA,
    pivotB,
    axisA: axis,
    axisB: axis,
  });
  if (typeof constraint.setLimits === "function") {
    constraint.setLimits(min, max);
  }
  world.addConstraint(constraint);
}

addBallJoint(torso.body, head.body, new CANNON.Vec3(0, 0.45, 0), new CANNON.Vec3(0, -0.2, 0));
addBallJoint(torso.body, upperArmL.body, new CANNON.Vec3(-0.35, 0.25, 0), new CANNON.Vec3(0, 0.25, 0));
addBallJoint(torso.body, upperArmR.body, new CANNON.Vec3(0.35, 0.25, 0), new CANNON.Vec3(0, 0.25, 0));
addBallJoint(torso.body, upperLegL.body, new CANNON.Vec3(-0.15, -0.45, 0), new CANNON.Vec3(0, 0.3, 0));
addBallJoint(torso.body, upperLegR.body, new CANNON.Vec3(0.15, -0.45, 0), new CANNON.Vec3(0, 0.3, 0));

addHinge(
  upperArmL.body,
  lowerArmL.body,
  new CANNON.Vec3(0, -0.25, 0),
  new CANNON.Vec3(0, 0.22, 0),
  new CANNON.Vec3(0, 0, 1),
  -0.2,
  1.3
);
addHinge(
  upperArmR.body,
  lowerArmR.body,
  new CANNON.Vec3(0, -0.25, 0),
  new CANNON.Vec3(0, 0.22, 0),
  new CANNON.Vec3(0, 0, 1),
  -1.3,
  0.2
);
addHinge(
  upperLegL.body,
  lowerLegL.body,
  new CANNON.Vec3(0, -0.3, 0),
  new CANNON.Vec3(0, 0.27, 0),
  new CANNON.Vec3(1, 0, 0),
  -0.2,
  1.2
);
addHinge(
  upperLegR.body,
  lowerLegR.body,
  new CANNON.Vec3(0, -0.3, 0),
  new CANNON.Vec3(0, 0.27, 0),
  new CANNON.Vec3(1, 0, 0),
  -0.2,
  1.2
);

function buildNailMesh() {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.5, 12),
    new THREE.MeshStandardMaterial({ color: 0x3d3a36 })
  );
  shaft.rotation.x = Math.PI / 2;
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.03, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: 0x2b2723 })
  );
  tip.position.z = -0.3;
  tip.rotation.x = Math.PI / 2;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0x2e2620 })
  );
  head.position.z = 0.3;
  group.add(shaft, tip, head);
  group.name = "Nail";
  return group;
}

function addPin(offset) {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x8d8d8d })
  );
  shaft.rotation.x = Math.PI / 2;
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.025, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: 0x6b6b6b })
  );
  tip.position.z = -0.13;
  tip.rotation.x = Math.PI / 2;
  const headPin = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xb23b3b })
  );
  headPin.position.z = 0.15;
  group.add(shaft, tip, headPin);
  group.position.copy(offset);
  group.name = "Pin";
  torso.mesh.add(group);
  pinMeshes.push(group);
}

addPin(new THREE.Vector3(0.2, 0.1, 0.22));
addPin(new THREE.Vector3(-0.15, -0.35, 0.2));
addPin(new THREE.Vector3(0.0, 0.5, 0.22));

function buildBasket() {
  const rimGeo = new THREE.TorusGeometry(0.55, 0.08, 12, 24);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x6a4b31 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  basketGroup.add(rim);

  const baseGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.18, 20);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x8a6546 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.06;
  basketGroup.add(base);

  basketGroup.position.set(0, 0.05, 0);
  scene.add(basketGroup);
}

function makeLoosePin() {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x8d8d8d })
  );
  shaft.rotation.x = Math.PI / 2;
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.02, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: 0x6b6b6b })
  );
  tip.position.z = -0.13;
  tip.rotation.x = Math.PI / 2;
  const headPin = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xb23b3b })
  );
  headPin.position.z = 0.12;
  group.add(shaft, tip, headPin);
  group.name = "Pin";
  pinMeshes.push(group);
  return group;
}

function populateBasket() {
  buildBasket();
  const positions = [
    new THREE.Vector3(0.0, 0.18, 0.0),
    new THREE.Vector3(0.18, 0.16, 0.1),
    new THREE.Vector3(-0.15, 0.16, -0.1),
    new THREE.Vector3(0.1, 0.16, -0.15),
    new THREE.Vector3(-0.2, 0.16, 0.15),
    new THREE.Vector3(0.0, 0.16, -0.22),
  ];

  positions.forEach((pos) => {
    const pin = makeLoosePin();
    pin.position.copy(pos);
    basketGroup.add(pin);
  });
}

populateBasket();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane();
const dragBody = new CANNON.Body({ mass: 0 });
dragBody.type = CANNON.Body.KINEMATIC;
world.addBody(dragBody);

let dragConstraint = null;
let dragPointLocal = null;
let dragActive = false;
let downTime = 0;
let downPos = new THREE.Vector2();
let selectedPin = null;
let selectedPinHome = null;
let pinDragPlane = new THREE.Plane();
let planeOffset = 0;
let depthControlActive = false;
let depthLastY = 0;
let dragTargetBody = null;
let lastPointerY = 0;

function getIntersectedNail() {
  raycaster.setFromCamera(pointer, camera);
  const nailMeshes = nails.map((entry) => entry.mesh);
  const hits = raycaster.intersectObjects(nailMeshes, true);
  if (!hits.length) return null;
  let obj = hits[0].object;
  while (obj && obj.name !== "Nail") {
    obj = obj.parent;
  }
  return obj ? { mesh: obj, point: hits[0].point } : null;
}

function getIntersectedMesh() {
  raycaster.setFromCamera(pointer, camera);
  const meshes = Array.from(meshToBody.keys());
  const hits = raycaster.intersectObjects(meshes, true);
  if (!hits.length) return null;

  let obj = hits[0].object;
  while (obj && !meshToBody.has(obj)) {
    obj = obj.parent;
  }
  return { mesh: obj, point: hits[0].point };
}

function getIntersectedPin() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pinMeshes, true);
  if (!hits.length) return null;
  let obj = hits[0].object;
  while (obj && obj.name !== "Pin") {
    obj = obj.parent;
  }
  return obj ? { mesh: obj, point: hits[0].point } : null;
}

function returnPinToBasket(pin) {
  const spread = 0.18;
  pin.position.set(
    (Math.random() - 0.5) * spread,
    0.16,
    (Math.random() - 0.5) * spread
  );
  pin.rotation.set(0, 0, 0);
  basketGroup.add(pin);
}

function placePinOnMesh(pin, hit) {
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  const placePoint = hit.point.clone().add(camDir.multiplyScalar(0.06));
  const localPoint = hit.mesh.worldToLocal(placePoint.clone());
  hit.mesh.add(pin);
  pin.position.copy(localPoint);
  pin.rotation.set(0, 0, 0);
}

function startDrag(hit) {
  if (!hit) return;
  const body = meshToBody.get(hit.mesh);
  if (!body) return;

  dragActive = true;
  dragTargetBody = body;
  dragPointLocal = new CANNON.Vec3();
  const hitPoint = new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z);
  body.pointToLocalFrame(hitPoint, dragPointLocal);
  dragBody.position.set(hitPoint.x, hitPoint.y, hitPoint.z);

  dragConstraint = new CANNON.PointToPointConstraint(
    body,
    dragPointLocal,
    dragBody,
    new CANNON.Vec3(0, 0, 0)
  );
  world.addConstraint(dragConstraint);

  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  dragPlane.setFromNormalAndCoplanarPoint(camDir, hit.point);
}

function moveDrag() {
  if (!dragActive || !dragConstraint) return;
  raycaster.setFromCamera(pointer, camera);
  const hitPoint = new THREE.Vector3();
  raycaster.ray.intersectPlane(dragPlane, hitPoint);
  dragBody.position.set(hitPoint.x, hitPoint.y, hitPoint.z);
}

function endDrag() {
  dragActive = false;
  if (dragConstraint) {
    world.removeConstraint(dragConstraint);
    dragConstraint = null;
  }
  dragTargetBody = null;
}

function applyPoke(hit) {
  const body = meshToBody.get(hit.mesh);
  if (!body) return;
  const forceDir = new CANNON.Vec3(0, 1, 0);
  const worldPoint = new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z);
  body.applyImpulse(forceDir.scale(2.5), worldPoint);
}

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function updatePointerFromTouch(touch) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
}

function onPointerDown(event) {
  updatePointer(event);
  downTime = performance.now();
  downPos.set(event.clientX, event.clientY);
  planeOffset = 0;
  lastPointerY = event.clientY;

  const pinHit = getIntersectedPin();
  if (pinHit) {
    selectedPin = pinHit.mesh;
    selectedPinHome = {
      parent: selectedPin.parent,
      position: selectedPin.position.clone(),
      rotation: selectedPin.rotation.clone(),
    };
    scene.add(selectedPin);
    selectedPin.position.copy(pinHit.point);
    selectedPin.rotation.set(0, 0, 0);

    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    pinDragPlane.setFromNormalAndCoplanarPoint(camDir, pinHit.point);
    if (hintEl) {
      hintEl.textContent = "Move pin onto doll and release to place. Scroll to push/pull.";
    }
    return;
  }

  const hit = getIntersectedMesh();
  if (hit) {
    startDrag(hit);
  }
}

function onPointerMove(event) {
  updatePointer(event);
  const dy = lastPointerY - event.clientY;
  lastPointerY = event.clientY;

  if (dragActive && Math.abs(dy) > 0) {
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const offset = dy * 0.004;
    dragPlane.translate(camDir.multiplyScalar(offset));
  }
  if (selectedPin) {
    raycaster.setFromCamera(pointer, camera);
    const hitPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(pinDragPlane, hitPoint);
    selectedPin.position.copy(hitPoint);
    return;
  }
  if (dragActive) moveDrag();
}

function onPointerUp(event) {
  updatePointer(event);
  const elapsed = performance.now() - downTime;
  const moveDist = downPos.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
  const hit = getIntersectedMesh();

  if (selectedPin) {
    if (hit) {
      placePinOnMesh(selectedPin, hit);
    } else {
      returnPinToBasket(selectedPin);
    }
    selectedPin = null;
    selectedPinHome = null;
    if (hintEl) {
      hintEl.textContent = "Drag to grab, tap to poke. 60fps target.";
    }
  } else if (elapsed < 220 && moveDist < 6 && hit) {
    applyPoke(hit);
  }

  endDrag();
}

function onDoubleClick(event) {
  updatePointer(event);
  const nailHit = getIntersectedNail();
  if (nailHit) {
    const idx = nails.findIndex((entry) => entry.mesh === nailHit.mesh);
    if (idx !== -1) {
      const entry = nails[idx];
      world.removeConstraint(entry.constraint);
      world.removeBody(entry.body);
      scene.remove(entry.mesh);
      nails.splice(idx, 1);
    }
    return;
  }

  let body = null;
  let worldPoint = null;
  if (dragActive && dragTargetBody) {
    body = dragTargetBody;
    worldPoint = new THREE.Vector3(dragBody.position.x, dragBody.position.y, dragBody.position.z);
  } else {
    const hit = getIntersectedMesh();
    if (!hit) return;
    body = meshToBody.get(hit.mesh);
    worldPoint = hit.point.clone();
  }
  if (!body || !worldPoint) return;

  const nailMesh = buildNailMesh();
  nailMesh.position.copy(worldPoint);
  scene.add(nailMesh);

  const nailBody = new CANNON.Body({ mass: 0 });
  nailBody.addShape(new CANNON.Sphere(0.04));
  nailBody.position.set(worldPoint.x, worldPoint.y, worldPoint.z);
  world.addBody(nailBody);

  const localPoint = new CANNON.Vec3();
  body.pointToLocalFrame(new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z), localPoint);
  const constraint = new CANNON.PointToPointConstraint(
    body,
    localPoint,
    nailBody,
    new CANNON.Vec3(0, 0, 0)
  );
  world.addConstraint(constraint);
  nails.push({ mesh: nailMesh, body: nailBody, constraint });
}

function onTouchStart(event) {
  if (!event.touches.length) return;
  updatePointerFromTouch(event.touches[0]);
  downTime = performance.now();
  downPos.set(event.touches[0].clientX, event.touches[0].clientY);
  planeOffset = 0;

  if (event.touches.length === 2 && (dragActive || selectedPin)) {
    depthControlActive = true;
    depthLastY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
    event.preventDefault();
    return;
  }

  const pinHit = getIntersectedPin();
  if (pinHit) {
    selectedPin = pinHit.mesh;
    selectedPinHome = {
      parent: selectedPin.parent,
      position: selectedPin.position.clone(),
      rotation: selectedPin.rotation.clone(),
    };
    scene.add(selectedPin);
    selectedPin.position.copy(pinHit.point);
    selectedPin.rotation.set(0, 0, 0);

    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    pinDragPlane.setFromNormalAndCoplanarPoint(camDir, pinHit.point);
    if (hintEl) {
      hintEl.textContent = "Move pin onto doll and release to place. Two-finger drag for depth.";
    }
    return;
  }

  const hit = getIntersectedMesh();
  if (hit) {
    startDrag(hit);
  }
}

function onTouchMove(event) {
  if (!event.touches.length) return;
  updatePointerFromTouch(event.touches[0]);

  if (depthControlActive && event.touches.length >= 2) {
    const avgY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
    const dy = avgY - depthLastY;
    depthLastY = avgY;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const offset = dy * 0.006;
    if (selectedPin) {
      pinDragPlane.translate(camDir.multiplyScalar(offset));
    } else if (dragActive) {
      dragPlane.translate(camDir.multiplyScalar(offset));
    }
    event.preventDefault();
    return;
  }

  if (selectedPin) {
    raycaster.setFromCamera(pointer, camera);
    const hitPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(pinDragPlane, hitPoint);
    selectedPin.position.copy(hitPoint);
    return;
  }
  if (dragActive) moveDrag();
}

function onTouchEnd(event) {
  if (event.touches.length < 2) {
    depthControlActive = false;
  }

  if (event.changedTouches && event.changedTouches.length) {
    updatePointerFromTouch(event.changedTouches[0]);
  }
  const elapsed = performance.now() - downTime;
  const lastTouch = event.changedTouches && event.changedTouches[0];
  if (lastTouch) {
    const moveDist = downPos.distanceTo(new THREE.Vector2(lastTouch.clientX, lastTouch.clientY));
    const hit = getIntersectedMesh();
    if (selectedPin) {
      if (hit) {
        placePinOnMesh(selectedPin, hit);
      } else {
        returnPinToBasket(selectedPin);
      }
      selectedPin = null;
      selectedPinHome = null;
      if (hintEl) {
        hintEl.textContent = "Drag to grab, tap to poke. 60fps target.";
      }
    } else if (elapsed < 220 && moveDist < 10 && hit) {
      applyPoke(hit);
    }
  }

  endDrag();
}

function onWheel(event) {
  if (!dragActive && !selectedPin) return;
  event.preventDefault();
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  const offset = event.deltaY * 0.002;
  planeOffset += offset;
  if (selectedPin) {
    pinDragPlane.translate(camDir.multiplyScalar(offset));
  } else {
    dragPlane.translate(camDir.multiplyScalar(offset));
  }
}

function onKeyDown(event) {
  if (!dragActive && !selectedPin) return;
  const key = event.key.toLowerCase();
  if (!["q", "e", "w", "s"].includes(key)) return;
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  const step = key === "q" || key === "w" ? 0.08 : -0.08;
  planeOffset += step;
  if (selectedPin) {
    pinDragPlane.translate(camDir.multiplyScalar(step));
  } else {
    dragPlane.translate(camDir.multiplyScalar(step));
  }
}

window.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);
window.addEventListener("dblclick", onDoubleClick);
window.addEventListener("wheel", onWheel, { passive: false });
window.addEventListener("keydown", onKeyDown);
window.addEventListener("touchstart", onTouchStart, { passive: false });
window.addEventListener("touchmove", onTouchMove, { passive: false });
window.addEventListener("touchend", onTouchEnd);
window.addEventListener("touchcancel", onTouchEnd);

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.02);
  world.step(1 / 60, delta, 3);

  for (const [mesh, body] of meshToBody.entries()) {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  }

  renderer.render(scene, camera);
}

animate();
