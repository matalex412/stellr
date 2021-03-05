import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ImageBackground,
} from 'react-native';
import {connect} from 'react-redux';
import {human, systemWeights} from 'react-native-typography';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';

import NoInternet from './components/NoInternet';
import CustomLoading from './components/CustomLoading';
import {store} from './../redux/store';
import {updateTutorials} from './../redux/actions';
import {firebase} from './../src/config';

class SearchScreen extends React.Component {
  state = {
    isLoading: true,
    isConnected: true,
  };

  componentDidMount = () => {
    this.setup();
  };

  checkConnectivity = () => {
    // check internet connection once
    const unsubscribe = NetInfo.addEventListener((state) => {
      this.setState({isConnected: state.isConnected});
    });
    unsubscribe();
  };

  setup = async () => {
    await this.checkConnectivity();

    if (this.state.isConnected) {
      // page items loading
      this.setState({isLoading: true});

      // get topics
      var topics = await firebase.firestore().collection('topics').get();
      var counts = [];
      var topicNames = [];
      topics.forEach((doc) => {
        if (doc.id != 'Meta') {
          var topic = doc.data();
          counts.push(topic.tutorialCount);
          topicNames.push(doc.id);
        }
      });
      this.setState({counts});
      await this.setState({topicNames});

      // page finished loading
      this.setState({isLoading: false});
    } else {
      this.setState({isLoading: false});
    }
  };

  clickedTopic = async (topic) => {
    // update topic
    await store.dispatch(
      updateTutorials({
        current_topic: topic,
      }),
    );

    this.props.navigation.navigate('Posts');
  };

  render() {
    var topics = this.state.topicNames;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {this.state.isLoading ? (
            <CustomLoading verse="Ask and it will be given to you; look and you will find" />
          ) : this.state.isConnected ? (
            topics.length < 1 ? null : (
              topics.map((topic, index) => {
                switch (topic) {
                  case 'Art':
                    var image = require('../assets/Art-cover.jpg');
                    break;
                  case 'Health & beauty':
                    var image = require('../assets/Health-cover.jpg');
                    break;
                  case 'Other':
                    var image = require('../assets/Other-cover.jpg');
                    break;
                  case 'Sport':
                    var image = require('../assets/Sport-cover.jpg');
                    break;
                  default:
                    var image = require('../assets/Cooking-cover.jpg');
                }
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => this.clickedTopic(topic)}>
                    <ImageBackground style={styles.topic} source={image}>
                      <LinearGradient
                        style={styles.topic}
                        colors={['#fff', 'transparent', 'transparent']}>
                        <Text style={styles.topicTitle}>{topic}</Text>
                        <Text style={styles.tutorialCount}>
                          {this.state.counts[index]} Tutorials
                        </Text>
                      </LinearGradient>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })
            )
          ) : (
            <NoInternet refresh={this.setup} />
          )}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderColor: '#0b5c87',
  },
  topic: {
    width: Dimensions.get('window').width,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTitle: {
    ...human.title1WhiteObject,
    ...systemWeights.semibold,
  },
  tutorialCount: {
    ...human.headlineWhiteObject,
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(SearchScreen);
