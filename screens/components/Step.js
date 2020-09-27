import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import VideoPlayer from 'react-native-video-controls';
import {human, systemWeights} from 'react-native-typography';

export default class Step extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    loading: true,
    paused: true,
  };

  imageLoaded = () => {
    this.setState({loading: false});
  };

  render() {
    return (
      <View style={{alignItems: 'center'}}>
        <View
          style={{
            borderRadius: 5,
            backgroundColor: '#fff',
            elevation: 3,
            width: this.props.width - 100,
            marginBottom: 25,
            alignItems: 'center',
            padding: 20,
          }}>
          <Text style={styles.heading}>Step {this.props.index + 1}</Text>
          {this.props.item.Images && (
            <View>
              <Image
                source={{uri: this.props.item.Images}}
                style={{margin: 10, width: 200, height: 200, borderRadius: 1}}
                onLoadEnd={this.imageLoaded}
              />
              {this.state.loading && (
                <ActivityIndicator
                  size="large"
                  style={{position: 'absolute', left: 90, top: 90}}
                  color="#2274A5"
                />
              )}
            </View>
          )}
          {this.props.item.Videos && (
            <VideoPlayer
              source={{uri: this.props.item.Videos}}
              rate={1.0}
              volume={1.0}
              paused={this.state.paused}
              resizeMode="cover"
              disableVolume
              disableBack
              style={{margin: 10}}
            />
          )}
          <Text
            style={{
              color: '#2274A5',
              fontSize: 16,
              textAlign: 'center',
            }}>
            {this.props.item.step}
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    ...human.headlineObject,
    ...systemWeights.semibold,
    color: '#2274A5',
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 10,
  },
  title: {
    ...human.title2WhiteObject,
    ...systemWeights.light,
    fontStyle: 'italic',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#2274A5',
    elevation: 1,
    padding: 7,
    borderRadius: 2,
  },
});
