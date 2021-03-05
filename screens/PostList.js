import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import {connect} from 'react-redux';
import {human, systemWeights} from 'react-native-typography';
import NetInfo from '@react-native-community/netinfo';

import NoInternet from './components/NoInternet';
import CustomLoading from './components/CustomLoading';
import TutorialCover from './components/TutorialCover';
import {store} from './../redux/store';
import {updateTutorials} from './../redux/actions';
import {firebase} from './../src/config';

class PostList extends React.Component {
  state = {
    isLoading: true,
    isConnected: true,
    postIDs: [],
    posts: [],
  };

  checkConnectivity = () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      this.setState({isConnected: state.isConnected});
    });
    unsubscribe();
  };

  componentDidMount = () => {
    this.setup();
  };

  setup = async () => {
    await this.checkConnectivity();

    if (this.state.isConnected) {
      // page items loading
      this.setState({isLoading: true});

      // find posts in topic folder
      var postsData = await firebase
        .firestore()
        .collection(`topics/${this.props.tutorials.current_topic}/posts`)
        .get();

      // get array of blocked users
      var {currentUser} = await firebase.auth();

      if (!currentUser.isAnonymous) {
        var doc = await firebase
          .firestore()
          .collection('users')
          .doc(currentUser.uid)
          .get();
        var userData = doc.data();
        if (!userData.blocked) {
          userData.blocked = [];
        }

        // filter posts
        var posts = {};
        var postIDs = [];
        if (postsData.docs.length > 0) {
          postsData.forEach((doc) => {
            var post = doc.data();
            if (
              !(
                (userData.blocked.includes(post.uid) && userData.blocked) ||
                post.reports > 3
              )
            ) {
              postIDs.push(doc.id);
              posts[doc.id] = post;
            }
          });

          await this.setState({posts});
          await this.setState({postIDs});
        }
      } else {
        // filter posts
        var posts = {};
        var postIDs = [];
        if (postsData.docs.length > 0) {
          postsData.forEach((doc) => {
            var post = doc.data();
            postIDs.push(doc.id);
            posts[doc.id] = post;
          });

          await this.setState({posts});
          await this.setState({postIDs});
        }
      }

      // page finished loading
      this.setState({isLoading: false});
    } else {
      this.setState({isLoading: false});
    }
  };

  handlePress = async (postid) => {
    // store clicked post and go to tutorial page
    await store.dispatch(updateTutorials({current_key: postid}));
    await store.dispatch(updateTutorials({current: this.state.posts[postid]}));
    this.props.navigation.navigate('Tutorial');
  };

  noPosts = async () => {
    // create new tutorial with current topic
    store.dispatch(updateTutorials({title: ''}));
    store.dispatch(updateTutorials({steps: [{step: ''}]}));
    await store.dispatch(
      updateTutorials({create_topic: [this.props.tutorials.current_topic]}),
    );

    await store.dispatch(
      updateTutorials({
        create_topic_string: this.props.tutorials.current_topic,
      }),
    );
    this.props.navigation.navigate('Create');
  };

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {this.state.isLoading ? (
            <CustomLoading verse="Ask and it will be given to you; look and you will find" />
          ) : this.state.isConnected ? (
            <View>
              {this.state.postIDs.length == 0 ? (
                <View style={styles.textContainer}>
                  <TouchableOpacity onPress={this.noPosts}>
                    <Text style={styles.text}>
                      No tutorials have been made yet, be the first
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {this.state.postIDs.map((id, index) => {
                    return (
                      <TutorialCover
                        key={index}
                        tutorial={this.state.posts[id]}
                        onPress={() => this.handlePress(id)}
                      />
                    );
                  })}
                </View>
              )}
            </View>
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
  text: {fontSize: 18, color: '#2274A5'},
  textContainer: {padding: 20, alignItems: 'center'},
});

const mapStateToProps = (state) => ({
  tutorials: state.tutorials,
});

export default connect(mapStateToProps)(PostList);
