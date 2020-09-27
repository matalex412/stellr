import Firebase from 'firebase';
import 'firebase/firestore';
import 'firebase/functions';

const firebaseConfig = {
	apiKey: 'AIzaSyDByJx5FDYBG-CMud--OReadJCgj7Ar4hc',
	authDomain: 'skoach-7d39b.firebaseapp.com',
	databaseURL: 'https://skoach-7d39b.firebaseio.com',
	projectId: 'skoach-7d39b',
	storageBucket: 'skoach-7d39b.appspot.com',
	messagingSenderId: '736658869849',
	appId: '1:736658869849:web:560f175f1089edd991ab48',
	measurementId: 'G-DNFQMK742B',
};

export const firebase = Firebase.initializeApp(firebaseConfig);
firebase.firestore().settings({experimentalForceLongPolling: true});
