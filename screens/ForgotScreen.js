import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {human, systemWeights} from 'react-native-typography';

import Background from './components/Background';
import {firebase} from './../src/config';

export default class ForgotScreen extends React.Component {
  state = {
    email: '',
  };

  forgot = async () => {
    try {
      await firebase.auth().sendPasswordResetEmail(this.state.email);
      Alert.alert(
        'Reset Password',
        `A password reset email has been sent to ${this.state.email}`,
      );
      this.props.navigation.navigate('Login');
    } catch (error) {
      // display errors
      this.setState({errorMessage: error.message});
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <Background />
        <Text
          style={{
            textAlign: 'center',
            fontSize: 15,
            margin: 20,
            color: '#2274A5',
          }}>
          Enter your email address below and we'll send you a link to reset your
          password
        </Text>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: 'white',
            padding: 20,
            margin: 40,
            marginTop: 5,
            marginBottom: 10,
            borderRadius: 5,
            elevation: 1,
          }}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}>
            <Ionicons name="md-mail" size={25} color="#2274A5" />
            <TextInput
              style={styles.textInput}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Email"
              onChangeText={(email) => this.setState({email})}
              value={this.state.email}
            />
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={this.forgot}>
            <Text style={{color: 'white', fontSize: 18}}>Change Password</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={{
            marginHorizontal: 5,
            padding: 4,
            backgroundColor: 'white',
            borderRadius: 4,
            elevation: 1,
          }}
          onPress={() => this.props.navigation.navigate('Login')}>
          <Text style={{color: '#2274A5'}}>Back to Login</Text>
        </TouchableOpacity>
        {this.state.errorMessage && (
          <Text style={{margin: 10, color: '#e3242b', ...systemWeights.bold}}>
            {this.state.errorMessage}
          </Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  submitButton: {
    marginTop: 10,
    paddingTop: 2,
    paddingBottom: 3,
    paddingLeft: 30,
    paddingRight: 30,
    backgroundColor: '#ffb52b',
    borderRadius: 2,
  },
  textInput: {
    padding: 2,
    fontSize: 18,
    width: '60%',
    marginLeft: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#2274A5',
    color: '#2274A5',
  },
});
