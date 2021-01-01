import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import {connect} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {human} from 'react-native-typography';

import {firebase} from './../../src/config';

class StarCount extends React.Component {
  state = {
    stars: 0,
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    var {currentUser} = firebase.auth();
    if (currentUser != null) {
      var {isAnonymous} = currentUser;
    } else {
      var isAnonymous = true;
    }

    if (!isAnonymous) {
      var starRef = await firebase
        .firestore()
        .collection('users')
        .doc(currentUser.uid)
        .onSnapshot((doc) => {
          var data = doc.data();
          if (data) {
            if (data.stars) {
              this.setState({stars: data.stars});
            }
          }
        });

      this.setState({starRef});
    }
  };

  componentWillUnmount = () => {
    var {starRef} = this.state;
    if (starRef) {
      starRef();
    }
  };

  render() {
    // check if currentUser is anonymous
    var {currentUser} = firebase.auth();
    if (currentUser != null) {
      var {isAnonymous} = currentUser;
    } else {
      var isAnonymous = true;
    }

    return (
      <View>
        {isAnonymous ? null : (
          <View
            style={{
              justifyContent: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 15,
            }}>
            <MaterialCommunityIcons name="star" size={30} color="#ffb52b" />
            <Text style={{fontSize: 20, color: '#fff'}}>
              {this.state.stars}
            </Text>
          </View>
        )}
      </View>
    );
  }
}

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(StarCount);
