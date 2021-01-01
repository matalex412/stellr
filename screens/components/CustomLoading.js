import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {PacmanIndicator} from 'react-native-indicators';

export default class CustomLoading extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={styles.container}>
        <Text
          style={{
            textAlign: 'center',
            fontFamily: 'serif',
            color: this.props.color ? this.props.color : '#2274A5',
            fontSize: 20,
            padding: 20,
          }}>
          "{this.props.verse}"
        </Text>
        <View style={{margin: 10, width: 10, height: 10}}>
          <PacmanIndicator
            count={3}
            color={this.props.color ? this.props.color : '#2274A5'}
            animationDuration={300}
            size={80}
          />
        </View>
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
});
