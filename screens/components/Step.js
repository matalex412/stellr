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
      <View style={{paddingVertical: 10}}>
        {this.props.item.Images && (
          <View>
            <Image
              source={{uri: this.props.item.Images}}
              style={{
                marginBottom: 10,
                width: this.props.width,
                height: 300,
              }}
              onLoadEnd={this.imageLoaded}
            />
            {this.state.loading && (
              <ActivityIndicator
                size="large"
                style={{
                  position: 'absolute',
                  left: this.props.width / 2 - 10,
                  top: 140,
                }}
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
            margin: 10,
          }}>
          {this.props.item.step}
        </Text>
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
