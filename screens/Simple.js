import React from 'react';
import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

export default class Simple extends React.Component {
  render() {

    fixImage = () => {
      console.log("hi")
    }

    return (
      <View>
        <TextInput placeholder="topic"/>
        <TextInput placeholder="id"/>
        <Button onPress={this.fixImage}/>
      </View>
    );
  }
}
