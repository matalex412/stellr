import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  BackHandler,
  ScrollView,
  Dimensions,
} from 'react-native';
import {connect} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {store} from './../redux/store';
import {updateTutorials} from './../redux/actions';
import {firebase} from './../src/config';

class SearchScreen extends React.Component {
  state = {
    keys: [],
    topics: [],
    isLoading: true,
    new: '',
    current_topic: [],
  };

  componentDidMount = () => {
    this.backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      this.backAction,
    );

    this.setup();
  };

  backAction = () => {
    this.goBack();
    return true;
  };

  componentWillUnmount() {
    this.backHandler.remove();
  }

  setup = async () => {
    // page items loading
    this.setState({isLoading: true});

    // get topics
    const current_topic = this.state.current_topic;
    var topics = await firebase.database().ref('categories').once('value');
    topics = topics.toJSON();
    var step;
    for (step of current_topic) {
      topics = topics[step];
    }

    // prevent users from creating "Meta" tutorials
    if (topics['Meta'] != null) {
      delete topics.Meta;
    }

    if (topics.icon) {
      delete topics.icon;
    }

    await this.setState({topics: topics});
    await this.setState({keys: Object.keys(this.state.topics)});
    this.setState({isLoading: false});
  };

  handlePress = async (topic) => {
    var old_topics = this.state.topics;
    var new_topics = old_topics[topic];

    // removes icon key
    delete new_topics.icon;
    delete new_topics.count;
    delete new_topics.color;

    if (Object.keys(new_topics).length == 0) {
      var post = this.props.tutorials.userpost;
      if (post) {
        topic = [...this.state.current_topic, topic];
        var route;
        var topicstring = '';
        for (route of topic) {
          topicstring = topicstring + '/topics/' + route;
        }
        post.topic = topicstring;
        await store.dispatch(updateTutorials({userpost: post}));

        var subtopics = post.topic.split('/topics/');
        var topic_string = subtopics[1];
        var i;
        for (i = 2; i < subtopics.length; i++) {
          topic_string = topic_string + ' > ' + subtopics[i];
        }
        await store.dispatch(updateTutorials({usertopic_string: topic_string}));

        this.props.navigation.navigate('UserTutorial');
      } else {
        await store.dispatch(
          updateTutorials({
            create_topic: [...this.state.current_topic, topic],
          }),
        );
        this.props.navigation.navigate('Create');
      }
    } else {
      await this.setState({
        current_topic: [...this.state.current_topic, topic],
      });
      this.setup();
    }
  };

  // CHECK FOR WHEN EDITING USERS POSTS
  pickTopic = async () => {
    await store.dispatch(
      updateTutorials({create_topic: [...this.state.current_topic]}),
    );
    this.props.navigation.navigate('Create');
  };

  goBack = async () => {
    var current_topic = this.state.current_topic;

    // go back one topic layer
    if (current_topic.length < 1) {
      this.props.navigation.navigate('Create');
    } else {
      current_topic.pop();
      this.setState({current_topic});
      this.setup();
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.heading}>Topics</Text>
          {this.state.isLoading ? (
            <ActivityIndicator color="#2274A5" size="large" />
          ) : (
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <View
                style={{
                  justifyContent: 'center',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                }}>
                {this.state.keys.map((topic, index) => {
                  return (
                    <TouchableOpacity
                      style={styles.square}
                      key={index}
                      onPress={() => this.handlePress(topic)}>
                      <MaterialCommunityIcons
                        name={this.state.topics[topic].icon}
                        size={40}
                        color="#2274A5"
                      />
                      <View>
                        <Text style={styles.text}>{topic}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <View style={{justifyContent: 'center', alignItems: 'center'}}>
                  {this.state.current_topic.length < 1 ? null : (
                    <TouchableOpacity onPress={() => this.pickTopic()}>
                      <View>
                        <Text style={{color: '#2274A5', fontSize: 16}}>
                          Select Current Topic
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
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
  text: {
    textAlign: 'center',
    color: '#2274A5',
    fontSize: 16,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  square: {
    margin: 10,
    width: Dimensions.get('window').width / 3 - 30,
    height: Dimensions.get('window').width / 3 - 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 18,
    color: '#2274A5',
    fontWeight: 'bold',
  },
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(SearchScreen);
