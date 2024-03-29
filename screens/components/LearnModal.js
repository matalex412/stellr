import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
  Switch,
} from 'react-native';
import PropTypes from 'prop-types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from 'react-native-modal';
import {AirbnbRating} from 'react-native-ratings';

export default class LearnModal extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    rating: 3,
    learnt: false,
    isModalVisible: false,
    dontClick: false,
  };

  render() {
    return (
      <View>
        <TouchableOpacity onPress={() => this.setState({isModalVisible: true})}>
          <View style={styles.button}>
            <Ionicons name="md-school" size={25} color="#2274A5" />
            <Text style={{color: '#2274A5', marginLeft: 5}}>Learnt</Text>
          </View>
        </TouchableOpacity>
        <Modal isVisible={this.state.isModalVisible}>
          <TouchableOpacity
            onPress={() => this.setState({isModalVisible: false})}>
            <Ionicons name="md-close" size={30} color="white" />
          </TouchableOpacity>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1,
            }}>
            <View style={{alignItems: 'center', flexDirection: 'row'}}>
              <Text
                style={{
                  paddingTop: 5,
                  color: 'white',
                  paddingBottom: 5,
                }}>
                Rating:{' '}
              </Text>
              <AirbnbRating
                onFinishRating={(rating) => this.setState({rating})}
                selectedColor="#ffb52b"
                showRating={false}
                type="custom"
                size={20}
              />
            </View>
            <View style={{alignItems: 'center', flexDirection: 'row'}}>
              <Text style={{color: 'white'}}>
                Were you able to learn the skill?
              </Text>
              <Switch
                trackColor={{false: '#767577', true: '#ffb52b'}}
                thumbColor="#ffb52b"
                onValueChange={(status) => {
                  this.setState({learnt: status});
                }}
                value={this.state.learnt}
              />
            </View>
            <TouchableOpacity
              style={{marginTop: 19}}
              onPress={async () => {
                if (!this.state.dontClick) {
                  this.setState({dontClick: true});
                  this.setState({isModalVisible: false});
                  await this.props.learnt(this.state.rating, this.state.learnt);
                  this.setState({dontClick: false});
                }
              }}>
              <View style={styles.button}>
                <Ionicons name="md-checkmark" size={25} color="#2274A5" />
                <Text style={{marginLeft: 5, color: '#2274A5'}}>Finish</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 2,
  },
});
