import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  BackHandler,
  Dimensions,
  ImageBackground,
} from 'react-native';
import {connect} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {human, systemWeights} from 'react-native-typography';

import Background from './components/Background';
import LinearGradient from 'react-native-linear-gradient';
import CustomLoading from './components/CustomLoading';
import TutorialCover from './components/TutorialCover';
import {store} from './../redux/store';
import {updateTutorials} from './../redux/actions';
import {firebase} from './../src/config';

class SearchScreen extends React.Component {
  state = {
    isLoading: true,
  };

  backAction = () => {
    // go back a topic when user clicks hardware back button
    if (
      this.props.tutorials.current_topic.length > 0 &&
      !this.props.tutorials.current_key
    ) {
      this.goBack();
      return true;
    } else {
      return false;
    }
  };

  componentDidMount = () => {
    store.dispatch(updateTutorials({tutorial_topic: null}));
    this.backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      this.backAction,
    );

    this.setup();
  };

  componentWillUnmount() {
    // remove back button listener
    this.backHandler.remove();
  }

  setup = async () => {
    // page items loading
    this.setState({isLoading: true});

    // refresh items
    this.setState({errorMessage: null});

    // get current topic folder and dictionary of all existing topic folders
    const current_topic = this.props.tutorials.current_topic;
    var topics = await firebase.database().ref('categories').once('value');
    topics = topics.toJSON();

    // store the subtopics of the current topic folder
    var step;
    for (step of current_topic) {
      topics = topics[step];
    }

    // removes icon key
    if (topics['icon']) {
      delete topics.icon;
    }

    // removes color key
    if (topics['color']) {
      delete topics.color;
    }
    // removes color key
    if (topics['count']) {
      delete topics.count;
    }

    await this.setState({topics});
    await this.setState({topicnames: Object.keys(topics)});

    // create string showing route to current topic folder
    var route;
    var topic = '';
    for (route of current_topic) {
      topic = topic + '/topics/' + route;
    }
    await store.dispatch(updateTutorials({tutorial_topic: topic}));

    if (topic != '') {
      // find posts in topic folder
      var posts = await firebase
        .firestore()
        .collection(topic + '/posts')
        .get();

      var contents = {};
      var postids = [];
      if (posts.docs.length > 0) {
        posts.forEach((doc) => {
          postids.push(doc.id);
          contents[doc.id] = doc.data();
        });
        await this.setState({contents});
        await this.setState({postids});
      } else {
        this.setState({contents: {}});
        this.setState({postids: []});
      }
    } else {
      this.setState({contents: {}});
      this.setState({postids: []});
    }

    var counts = [];
    for (topic of Object.keys(topics)) {
      var doc = await firebase
        .firestore()
        .collection('topics')
        .doc(topic)
        .get();
      var data = doc.data();
      counts.push(data.tutorialCount);
    }
    this.setState({counts});

    // page finished loading
    this.setState({isLoading: false});
  };

  clickedTopic = async (topic) => {
    // update topic
    await store.dispatch(
      updateTutorials({
        current_topic: [...this.props.tutorials.current_topic, topic],
      }),
    );

    // setup page with new items
    this.setup();
  };

  handlePress = async (postid) => {
    // store clicked post and go to tutorial page
    await store.dispatch(updateTutorials({current_key: postid}));
    await store.dispatch(
      updateTutorials({current: this.state.contents[postid]}),
    );
    this.props.navigation.navigate('Tutorial');
  };

  goBack = async () => {
    // go back one topic layer
    var current_topic = this.props.tutorials.current_topic;
    current_topic.pop();
    await store.dispatch(updateTutorials({current_topic}));
    this.setup();
  };

  noPosts = async () => {
    // create new tutorial with current topic
    store.dispatch(updateTutorials({title: ''}));
    store.dispatch(updateTutorials({steps: [{step: ''}]}));
    await store.dispatch(
      updateTutorials({create_topic: this.props.tutorials.current_topic}),
    );

    var current_topic = this.props.tutorials.create_topic;
    var i;
    if (current_topic.length > 0) {
      var topic = current_topic[0];
      for (i = 1; i < current_topic.length; i++) {
        topic = topic + ' > ' + current_topic[i];
      }
    } else {
      var topic = null;
    }
    await store.dispatch(updateTutorials({create_topic_string: topic}));

    this.props.navigation.navigate('Create');
  };

  render() {
    var postids = this.state.postids;
    var topics = this.state.topicnames;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Background />
          {this.state.isLoading ? (
            <CustomLoading verse="Ask and it will be given to you; look and you will find" />
          ) : (
            <View
              style={{
                marginBottom: postids.length > 2 ? 20 : 0,
                flex: 1,
                justifyContent: 'center',
              }}>
              <View
                style={{
                  marginBottom:
                    this.props.tutorials.current_topic.length < 1 ? 0 : 45,
                }}>
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 5,
                  }}>
                  {this.props.tutorials.current_topic.length < 1 ? null : (
                    <TouchableOpacity onPress={this.goBack}>
                      <View
                        style={{
                          marginBottom: 10,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        <Ionicons
                          color="#2274A5"
                          style={{margin: 10}}
                          name="md-arrow-back"
                          size={25}
                        />
                        <Text style={{fontSize: 15, color: '#2274A5'}}>
                          Go Back
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {topics.length < 1 ? null : (
                <View>
                  {topics.map((topic, index) => {
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
                            colors={['#2274A5', 'transparent']}>
                            <Text style={styles.topicTitle}>{topic}</Text>
                            <Text style={styles.tutorialCount}>
                              {this.state.counts[index]} Tutorials
                            </Text>
                          </LinearGradient>
                        </ImageBackground>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {postids.length < 1 ? (
                this.props.tutorials.current_topic.length < 1 ? null : (
                  <View style={{padding: 20, alignItems: 'center'}}>
                    <TouchableOpacity onPress={() => this.noPosts()}>
                      <Text style={{fontSize: 18, color: '#2274A5'}}>
                        No tutorials have been made yet, be the first
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                <View style={styles.centerview}>
                  {postids.map((postid, index) => {
                    return (
                      <TutorialCover
                        key={index}
                        tutorial={this.state.contents[postid]}
                        onPress={() => this.handlePress(postid)}
                      />
                    );
                  })}
                </View>
              )}
            </View>
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
  heading: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
    padding: 2,
    alignSelf: 'center',
  },
  line: {
    borderBottomColor: 'white',
    borderBottomWidth: 1,
    alignSelf: 'center',
    width: '100%',
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(SearchScreen);
