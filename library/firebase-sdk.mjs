import { initializeApp } from '@firebase/app';
import { getAuth, setPersistence, browserSessionPersistence, signInAnonymously } from '@firebase/auth';
import { getDatabase, ref, set, get, remove, onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, serverTimestamp } from '@firebase/database';
window.WinterFirebase = { initializeApp, getAuth, setPersistence, browserSessionPersistence, signInAnonymously, getDatabase, ref, set, get, remove, onValue, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, serverTimestamp };
