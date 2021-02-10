import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import LinkSection from "./components/LinkSection";

export default class LegalScreen extends React.Component {
	render() {
		return (
			<View style={styles.container}>
				<View style={styles.subContainer}>
					<LinkSection
						onPress={() => this.props.navigation.navigate("EULA")}
						text="EULA"
						icon="format-list-numbered"
					/>
					<LinkSection
						onPress={() => this.props.navigation.navigate("Policy")}
						text="Privacy Policy"
						icon="shield"
					/>
				</View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 10,
	},
	subContainer: {
		justifyContent: "center",
		alignItems: "flex-start",
		backgroundColor: "white",
		padding: 20,
		width: "80%",
		marginTop: 10,
		borderRadius: 5,
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.5,
		shadowRadius: 2,
	},
});
