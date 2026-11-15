'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = fs.readFileSync(path.join(__dirname, 'place-activities.js'), 'utf8');
const { readyWire, readReadyTime, sledPair, readPlaceAction, READY_DURATION, START_DELAY } = vm.runInNewContext(`${src}\n({readyWire,readReadyTime,sledPair,readPlaceAction,READY_DURATION,START_DELAY})`);
const now = 1794700800000;
const entry = (id, at) => ({ id, at });
const signal = (at, m = 'idle') => ({ m, b: readyWire(at) });

assert.equal(readReadyTime(signal(now - 50), now), now - 50);
assert.equal(readReadyTime(signal(now - 50, 'sled'), now), now - 50);
assert.equal(readReadyTime(signal(now - 50, 'warm'), now), 0);
assert.equal(readReadyTime(signal(now - 50, 'walk'), now), 0);
assert.equal(readReadyTime(signal(now + 1500), now), 0);
assert.equal(readReadyTime(signal(now - 30000), now), 0);
assert.equal(readReadyTime({ m: 'idle', b: .56 }, now), 0);
assert.equal(readReadyTime(signal(now - 49), now), 0);
assert.equal(readPlaceAction({ m: 'idle', b: .66 }), 'log');
assert.equal(readPlaceAction({ m: 'idle', b: .67 }), 'tea');
for (const state of [{ m: 'warm', b: .61 }, { m: 'rolling', b: .66 }, { m: 'idle', b: .45 }, signal(now)]) {
 assert.equal(readPlaceAction(state), '');
}

assert.equal(sledPair([entry('a', now)]), null);
assert.equal(sledPair([entry('a', now), entry('b', now + READY_DURATION)]), null);
const entries = [entry('b', now), entry('a', now), entry('c', now + 50)];
const pair = sledPair(entries);
assert.deepEqual(Array.from(pair.participants, ({ id }) => id), ['a', 'b']);
assert.equal(pair.startAt, now + START_DELAY);
assert.equal(sledPair([...entries].reverse()).startAt, pair.startAt);
assert.equal(sledPair([entry('a', now), entry('b', now + READY_DURATION - 50)]).startAt, now + READY_DURATION - 50 + START_DELAY);
console.log('PASS: existing activity field round-trips both new poses and a shared start clock, and two prepared seats are chosen consistently.');
