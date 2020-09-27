import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default class LinkSection extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <TouchableOpacity onPress={this.props.onPress}>
        <View style={{alignItems: 'center', flexDirection: 'row'}}>
          <MaterialCommunityIcons
            name={this.props.icon}
            size={30}
            style={{margin: 10, marginLeft: 0}}
            color={this.props.color ? this.props.color : '#2274A5'}
          />
          <Text
            style={{
              fontSize: 15,
              color: this.props.color ? this.props.color : '#2274A5',
            }}>
            {this.props.text}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}
