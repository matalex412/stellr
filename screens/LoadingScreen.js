import React from 'react';
import {firebase} from './../src/config';
import {ActivityIndicator} from 'react-native';
import SplashScreen from 'react-native-splash-screen';

//import { AppLoading } from "expo";

export default class LoadingScreen extends React.Component {
	componentDidMount() {
		// redirect user to appropriate screens
		firebase.auth().onAuthStateChanged((user) => {
			this.props.navigation.navigate(user ? 'App' : 'SignUp');
			SplashScreen.hide();
		});
	}

	render() {
		return <ActivityIndicator color="#fff" />;
	}
}
