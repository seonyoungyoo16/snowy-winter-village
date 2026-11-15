// Reserve winter-only idle bands in the existing Firebase numeric activity field.
const SLED_READY_BAND = .56, READY_SCALE = 1e15, READY_DURATION = 18000, START_DELAY = 3200, START_GRACE = 1100;
const PLACE_ACTIONS = { log: { wire: .66, duration: 2700 }, tea: { wire: .67, duration: 4200 } };
const readyWire = (at) => SLED_READY_BAND + at / READY_SCALE;

function readPlaceAction({ m, b }) {
 if (m !== 'idle') return '';
 if (b === PLACE_ACTIONS.log.wire) return 'log';
 if (b === PLACE_ACTIONS.tea.wire) return 'tea';
 return '';
}

function readReadyTime({ m, b }, now) {
 if ((m !== 'idle' && m !== 'sled') || !(b > SLED_READY_BAND && b < .57)) return 0;
 const at = Math.round((b - SLED_READY_BAND) * READY_SCALE);
 const lifetime = READY_DURATION + START_DELAY + START_GRACE;
 return Math.round(at / 50) * 50 === at && at > now - lifetime && at < now + 1000 ? at : 0;
}

function sledPair(entries) {
 const participants = [...entries].sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(0, 2);
 if (participants.length < 2 || participants[1].at - participants[0].at >= READY_DURATION) return null;
 return { participants, startAt: participants[1].at + START_DELAY };
}

function createWinterActivities() {
 const market = districtLayout().districts.find(({ id }) => id === 'market');
 const teaStand = { x: market.x - 4.2, z: market.z + 2.65 };
 const inRange = (p, point, distance) => Math.hypot(p.x - point.x, p.z - point.z) <= distance;
 const atFire = (p) => inRange(p, firePos, 3.5);
 const atTea = (p) => inRange(p, teaStand, 2.7);
 const atSled = (p) => inRange(p, sledStart, 2.5);
 const hasSledFriend = () => [...remotePlayers.values()].some(({ data }) => atSled(data) && data.m !== 'sled');
 const getAction = (actor) => actor.root.getObjectByName('winter-place-prop');
 let local = null, readyAt = 0, launch = null, glow = 0, teaKeeper = null;

 function tendMarket(dt) {
  const close = inRange(player.position, teaStand, 21);
  if (close && !teaKeeper) {
   teaKeeper = avatar(1, { c: 4, s: 0, a: 'beanie' });
   teaKeeper.root.name = 'market-tea-keeper';
   const x = teaStand.x - .65, z = market.z + 3.35;
   teaKeeper.root.position.set(x, groundHeight(x, z), z);
   teaKeeper.root.rotation.y = Math.PI;
   scene.add(teaKeeper.root);
  }
  if (!teaKeeper) return;
  teaKeeper.root.visible = close;
  if (close) animatePose(dt, false, teaKeeper, 'idle', reduced ? 0 : elapsed);
 }

 function setProp(actor, kind) {
  let prop = getAction(actor);
  if (!prop) {
   prop = new THREE.Group();prop.name = 'winter-place-prop';prop.position.set(0, -.47, .12);
   const log = mesh(geom.cyl, 0x8f624c, prop, 0, 0, 0, .086, .49, .086);
   log.rotation.z = Math.PI / 2;log.name = 'campfire-log';
   const cup = new THREE.Group();cup.name = 'market-cup';
   mesh(geom.cyl, 0xf0ca95, cup, 0, .095, 0, .095, .19, .095);
   mesh(geom.cyl, 0x8a5844, cup, 0, .192, 0, .079, .014, .079);
   const handle = new THREE.Mesh(new THREE.TorusGeometry(.051, .013, 5, 10), mat(0xf0ca95));
   handle.position.set(.106, .105, 0);cup.add(handle);prop.add(cup);actor.arms[0].add(prop);
  }
  prop.children[0].visible = kind === 'log';prop.children[1].visible = kind === 'tea';
  prop.visible = Boolean(kind);
  return prop;
 }

 function draw(actor, action, now) {
  if (!action) { const prop = getAction(actor);if (prop) prop.visible = false;return; }
  const progress = clamp((now - action.at) / PLACE_ACTIONS[action.kind].duration, 0, 1);
  const lift = Math.sin(progress * Math.PI);
  const prop = setProp(actor, action.kind);
  if (action.kind === 'log') {
   actor.body.rotation.x = .54 * lift;
   actor.arms[0].rotation.set(-.65 - .76 * lift, 0, -.19);
   prop.visible = progress < .61;
   if (progress >= .60 && !action.lit) { glow = 1;action.lit = true; }
  } else {
   actor.arms[0].rotation.set(-.85 - .59 * lift, 0, -.24);
   prop.rotation.x = .6 - actor.arms[0].rotation.x;
   actor.head.rotation.x = .11 * lift;
  }
  if (action.kind === 'log') prop.rotation.x = 0;
 }

 function stopLocal() {
  if (!local) return;
  local = null;
  character.head.rotation.x = 0;
  publishState(true);
 }

 function begin(kind) {
  if (!entered || local || !['idle', 'warm'].includes(mode) || !(kind === 'log' ? atFire(player.position) : atTea(player.position))) return;
  if (mode === 'warm') { mode = 'idle';player.position.y = groundHeight(player.position.x, player.position.z); }
  path = [];keys.clear();pendingFishing = false;
  const target = kind === 'log' ? firePos : teaStand;
  player.rotation.y = Math.atan2(target.x - player.position.x, target.z - player.position.z);
  local = { kind, at: performance.now() };
  publishState(true);
 }

 const roomTime = () => Date.now() + serverOffset;
 const readyPeers = (now) => [...remotePlayers].flatMap(([id, peer]) => {
  const at = readReadyTime(peer.data, now);
  const nearStart = atSled(peer.data) || (peer.data.m === 'sled' && peer.data.z < sledStart.z + 1.7);
  return at && nearStart ? [{ id, at, name: peer.data.n }] : [];
 });
 function cancelReady() {
  if (!readyAt) return;
  readyAt = 0;publishState(true);
 }

 function toggleReady() {
  if (readyAt) { cancelReady();return; }
  if (!networkJoined || mode !== 'idle' || ball || !atSled(player.position) || !hasSledFriend()) return;
  path = [];keys.clear();pendingFishing = false;
  readyAt = Math.floor(roomTime() / 50) * 50;publishState(true);
 }

 function updateReady() {
  const now = roomTime();
  if (!readyAt) return '';
  if (!networkJoined || mode !== 'idle' || !atSled(player.position) || path.length || keys.size) { cancelReady();return ''; }
  const pair = sledPair([{ id: sessionKey, at: readyAt }, ...readyPeers(now)]);
  if (!pair) {
   if (now - readyAt >= READY_DURATION) { cancelReady();return ''; }
   return '친구가 준비할 때까지 기다려요';
  }
  const lane = pair.participants.findIndex(({ id }) => id === sessionKey);
  if (lane < 0 || now > pair.startAt + START_GRACE) { cancelReady();return ''; }
  if (now < pair.startAt) return `함께 출발까지 ${Math.ceil((pair.startAt - now) / 1000)}초`;
  launch = { at: readyAt, startAt: pair.startAt, lane };
  readyAt = 0;
  startRide(launch);
  publishState(true);
  return '';
 }

 function showControls(countdown) {
  const log = $('add-firewood'), together = $('sled-together'), status = $('place-status');
  log.hidden = !entered || !['idle', 'warm'].includes(mode) || !atFire(player.position) || Boolean(local);
  together.hidden = !entered || mode !== 'idle' || !atSled(player.position) || !networkJoined || (!readyAt && !hasSledFriend());
  const label = readyAt ? '준비 취소' : '함께 썰매 타기';
  if (together.textContent !== label) together.textContent = label;
  status.hidden = !countdown;
  if (status.textContent !== countdown) status.textContent = countdown;
 }

 $('add-firewood').addEventListener('click', () => begin('log'));
 $('sled-together').addEventListener('click', toggleReady);
 document.addEventListener('visibilitychange', () => { if (document.hidden) cancelReady(); });
 return {
  atTea, drink: () => begin('tea'), cancelReady, stopLocal,
  get active() { return local?.kind || ''; },
  get glow() { return glow; },
  describe(data) {
   return { log: '장작 보태는 중', tea: '차 마시는 중' }[readPlaceAction(data)] || '';
  },
  wire(body) {
   if (local) return { ...body, m: 'idle', b: PLACE_ACTIONS[local.kind].wire };
   if (readyAt) return { ...body, m: 'idle', b: readyWire(readyAt) };
   if (launch && mode === 'sled') return { ...body, b: readyWire(launch.at) };
   return body;
  },
  peer(peer) {
   const kind = readPlaceAction(peer.data), valid = kind === 'log' ? atFire(peer.data) : kind === 'tea' && atTea(peer.data);
   if (!valid && peer.placeAction) { peer.placeAction = null;peer.actor.head.rotation.x = 0; }
   if (valid && peer.placeAction?.kind !== kind) peer.placeAction = { kind, at: performance.now() };
   draw(peer.actor, peer.placeAction, performance.now());
  },
  tick(dt, moving) {
   if (mode !== 'sled') launch = null;
   if (local && (moving || mode !== 'idle' || performance.now() - local.at >= PLACE_ACTIONS[local.kind].duration)) stopLocal();
   glow = Math.max(0, glow - dt * .36);
   draw(character, local, performance.now());
   tendMarket(dt);
   showControls(updateReady());
  }
 };
}
