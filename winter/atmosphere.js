function createWinterAtmosphere() {
 const warm = mat(0xffd691, true), cable = mat(0x65525c);
 const bulbGeo = new THREE.SphereGeometry(1, 8, 6);
 const lamps = [];
 const canvas = document.createElement('canvas');canvas.width = canvas.height = 64;
 const ctx = canvas.getContext('2d');
 const radial = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
 radial.addColorStop(0, '#fff');radial.addColorStop(.3, '#ffffffd0');radial.addColorStop(1, '#ffffff00');
 ctx.fillStyle = radial;ctx.fillRect(0, 0, 64, 64);
 const glow = new THREE.CanvasTexture(canvas);
 const pool = new THREE.MeshBasicMaterial({ map: glow, color: 0xffb164, transparent: true, opacity: .22, depthWrite: false });
 const pools = new THREE.Group();scene.add(pools);
 function groundGlow(x, z, width, depth = width) {
  const shape = new THREE.PlaneGeometry(width, depth, 6, 6);shape.rotateX(-Math.PI / 2);
  const positions = shape.attributes.position;
  for (let i = 0; i < positions.count; i++) positions.setY(i, groundHeight(x + positions.getX(i), z + positions.getZ(i)) + .036);
  const patch = new THREE.Mesh(shape, pool);patch.position.set(x, 0, z);pools.add(patch);
 }
 function post(x, z, height) {
  const y = groundHeight(x, z);
  mesh(geom.cyl, 0x725d58, world, x, y + height / 2, z, .079, height, .079);
  mesh(bulbGeo, 0xe4e7ed, world, x, y + height, z, .14, .07, .14);
 }
 function light(x, y, z, r) {
  mesh(bulbGeo, warm, world, x, y, z, r, r * 1.22, r);
  mesh(geom.box, cable, world, x, y + r * 1.1, z, r, r * .45, r);
 }
 function span(a, b, sag, number) {
  const p = new THREE.Vector3(), q = new THREE.Vector3(), step = number * 2;
  for (let i = 1; i <= step; i++) {
   const t = i / step, previous = (i - 1) / step;
   p.set(lerp(a.x, b.x, previous), lerp(a.y, b.y, previous) - Math.sin(previous * Math.PI) * sag, lerp(a.z, b.z, previous));
   q.set(lerp(a.x, b.x, t), lerp(a.y, b.y, t) - Math.sin(t * Math.PI) * sag, lerp(a.z, b.z, t));
   const segment = mesh(geom.cyl, cable, world, (p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2, .015, p.distanceTo(q), .015);
   segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.sub(p).normalize());
   if (i % 2 === 1) light(lerp(a.x, b.x, t), lerp(a.y, b.y, t) - Math.sin(t * Math.PI) * sag - .12, lerp(a.z, b.z, t), .13);
  }
 }
 const at = (x, z, h) => ({ x, y: groundHeight(x, z) + h, z });
 post(-9, -5.4, 3.35);post(6, -5.4, 3.35);
 span(at(-9, -5.4, 3.32), at(6, -5.4, 3.32), .9, 13);
 groundGlow(firePos.x, firePos.z, 10.8, 8.7);groundGlow(-7, -9.8, 7, 5);

 for (const [x, marks] of [[15.55, [-11.5, -7.5, -3.5, .5, 4.5, 8.5]], [10.45, [-10, -2, 6]]]) {
  for (const z of marks) { post(x, z, .87);light(x, groundHeight(x, z) + .90, z, .16);groundGlow(x, z, 3); }
 }
 post(10.6, -12.4, 3);post(15.4, -12.4, 3);
 span(at(10.6, -12.4, 2.9), at(15.4, -12.4, 2.9), .36, 5);

 const market = districtLayout().districts.find(({ id }) => id === 'market');
 for (const dx of [-5, 0, 5]) {
  const x = market.x + dx;
  for (const side of [-1, 1]) {
   const z = market.z + 4.4 * side;
   light(x, groundHeight(x, z) + 2.23, z - .62 * side, .16);
   groundGlow(x, z - 1.35 * side, 4.7);
  }
  if (dx !== 0) {
   const lamp = new THREE.PointLight(0xffc88d, 5.5, 7, 2);lamp.position.set(x, 2.55, market.z);lamps.push(lamp);scene.add(lamp);
  }
  span(at(x, market.z - 2.2, 2.8), at(x, market.z + 2.2, 2.8), .32, 4);
 }

 const chimneys = [[-5.93, -12.99, 5.25], [15.29, -22.38, 4.4], [-16.34, -.85, 3.52]];
 const smoke = chimneys.flatMap(([x, z, y], n) => Array.from({ length: reduced ? 2 : 4 }, (_, i) => {
  const puff = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xc0c9df, opacity: .15, transparent: true, depthWrite: false }));
  smokeLayer.add(puff);return { puff, x, y, z, phase: i / (reduced ? 2 : 4) + n * .17 };
 }));
 function tick(time, daylight, wind, firePulse) {
  pool.opacity = .09 + (1 - daylight) * .2;
  for (const lamp of lamps) lamp.intensity = 2 + (1 - daylight) * 4.5;
  for (const { puff, x, y, z, phase } of smoke) {
   const p = (phase + (reduced ? 0 : time * .16)) % 1;
   puff.position.set(x + p * wind.x * 2, y + p * 3.25, z + p * wind.z * 2);
   puff.scale.setScalar(.33 + p * 1.3);
   puff.material.opacity = .20 * Math.sin(p * Math.PI);
  }
  fireGlow.material.opacity = .13 + (1 - daylight) * .07 + firePulse * .17;
 }
 return { tick };
}

const smokeLayer = new THREE.Group();
scene.add(smokeLayer);
const winterAtmosphere = createWinterAtmosphere();
