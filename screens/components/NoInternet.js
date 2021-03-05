import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default class NoInternet extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="sleep" size={75} color="#2274A5" />
        <Text
          style={{
            textAlign: 'center',
            color: this.props.color ? this.props.color : '#2274A5',
            fontSize: 23,
            padding: 10,
          }}>
          No Internet Connection
        </Text>
        <Text style={styles.retryText}>
          Please check your internet settings and try again
        </Text>
        <TouchableOpacity onPress={this.props.refresh}>
          <Text>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    textAlign: 'center',
    color: 'grey',
    fontSize: 18,
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
});
