import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

import { offer } from "./offer.js";

import { answer } from "./answer.js";
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export const collection_calls = collection(firestore, 'calls')

const vdo_local = document.getElementById('vdo_local')
const vdo_remote = document.getElementById('vdo_remote')

const btn_webcam = document.getElementById('btn_webcam')
const btn_offer = document.getElementById('btn_offer')
const btn_answer = document.getElementById('btn_answer')

const servers = {
  iceServers: [
    {
      urls: [
        'stun:stun1.1.google.com:19302',
        'stun:stun2.1.google.com:19302',
      ]
    }
  ],
  iceCandidatePoolSize: 10
}

export const pc = new RTCPeerConnection(servers);

let localStream = null;
let remoteStream = null;

async function setStream() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  })

  remoteStream = new MediaStream()

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  })

  pc.ontrack = event => {
    event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track))
  }

  vdo_local.srcObject = localStream;
  vdo_remote.srcObject = remoteStream;

  btn_offer.disabled = false;
  btn_answer.disabled = false;
  btn_webcam.disabled = true;
}

export async function createSDP(description) {

  await pc.setLocalDescription(description);

  const sdp = {
    sdp: description.sdp,
    type: description.type
  }

  return sdp;
}

export function listenLocalCandidate(collection) {
  pc.onicecandidate =event => {

    event.candidate && addDoc(collection, event.candidate.toJSON());

  }
}

export function listenRemoteCandidate(collection) {
  
  onSnapshot(collection, snapshot => {

    snapshot.docChanges().forEach(change => {

      if (change.type === 'added') {

        const data = change.doc.data();

        const candidate = new RTCIceCandidate(data);

        pc.addIceCandidate(candidate)
      }
    })
  })
}

btn_webcam.onclick = setStream
btn_offer.onclick = offer
btn_answer.onclick = answer