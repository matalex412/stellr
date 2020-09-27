import React from 'react';
import {View, Text} from 'react-native';
import {connect} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {human} from 'react-native-typography';

class MessageBox extends React.Component {
  render() {
    return (
      <View>
        {this.props.tutorials.unread ? (
          <Ionicons
            style={{color: '#ffb52b'}}
            name="md-mail-unread"
            size={25}
          />
        ) : (
          <Ionicons style={{color: 'white'}} name="md-mail" size={25} />
        )}
      </View>
    );
  }
}

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(MessageBox);
