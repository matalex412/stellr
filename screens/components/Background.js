import React from 'react';
import {View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default class Background extends React.Component {
	render() {
		return (
			<LinearGradient
				colors={['#fff', '#fff', '#fff']}
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 0,
					height: '100%',
				}}
			/>
		);
	}
}
