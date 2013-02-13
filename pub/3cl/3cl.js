(function() {

if (!Detector.webgl) {
  Detector.addGetWebGLMessage();
}

var camera,
    scene,
    renderer,
    geometry,
    material,
    i, h,
    color,
    colors = [],
    sprite,
    size,
    mouseX = 0, mouseY = 0;

var Init = function() {
  var root = document.body.appendChild(
    document.createElement('div'));
  root.setAttribute('id', 'root');

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 3000);
  camera.position.z = 1400;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xffffff, 0.0009);

  geometry = new THREE.Geometry();

  sprite = THREE.ImageUtils.loadTexture('ball.png');

  for (i = 0; i < 5000; i++) {
    var vertex = new THREE.Vector3();
    vertex.x = 2000 * Math.random() - 1000;
    vertex.y = 2000 * Math.random() - 1000;
    vertex.z = 2000 * Math.random() - 1000;

    geometry.vertices.push(vertex);

    colors[i] = new THREE.Color(0xffffff);
    colors[i].setHSV((vertex.x + 1000) / 2000, 1, 1);
  }

  geometry.colors = colors;

  material = new THREE.ParticleBasicMaterial({
    size: 85,
    map: sprite,
    vertexColors: true,
    transparent: true
  });
  material.color.setHSV(1.0, 0.2, 0.8);

  particles = new THREE.ParticleSystem(geometry, material);
  particles.sortParticles = true;

  scene.add(particles);

  renderer = new THREE.WebGLRenderer({
    clearAlpha: 0
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  root.appendChild(renderer.domElement);

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0';
  root.appendChild(stats.domElement);

  document.addEventListener('mousemove', MouseDidMove, false);
  window.addEventListener('resize', WindowDidResize, false);
};

var MouseDidMove = function(e) {
  mouseX = e.clientX - window.innerWidth / 2;
  mouseY = e.clientY - window.innerHeight / 2;
};

var WindowDidResize = function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.upateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

var Animate = function() {
  requestAnimationFrame(Animate);

  var time = Date.now() * 0.00005;
  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y += (-mouseY - camera.position.y) * 0.05;

  camera.lookAt(scene.position);

  h = (360 * (1.0 + time) % 360) / 360;
  material.color.setHSV(h, 0.8, 1.0);

  renderer.render(scene, camera);
  stats.update();
};

Init();
Animate();

})();