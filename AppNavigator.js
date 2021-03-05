import {createAppContainer, createSwitchNavigator} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import {
  createBottomTabNavigator,
  createMaterialTopTabNavigator,
} from 'react-navigation-tabs';
import createAnimatedSwitchNavigator from 'react-navigation-animated-switch';
import {Transition} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {human} from 'react-native-typography';
import LinearGradient from 'react-native-linear-gradient';

import PostList from './screens/PostList';
import ProfileHome from './screens/ProfileHome';
import ProfileMade from './screens/ProfileMade';
import LoginScreen from './screens/LoginScreen';
import LoadingScreen from './screens/LoadingScreen';
import SignUp from './screens/SignUp';
import StarCount from './screens/components/StarCount';
import AppHeader from './screens/components/AppHeader';
import HomeScreen from './screens/HomeScreen';
import CreateScreen from './screens/CreateScreen';
import SearchScreen from './screens/SearchScreen';
import TutorialScreen from './screens/TutorialScreen';
import AccountScreen from './screens/AccountScreen';
import TopicScreen from './screens/TopicScreen';
import UserPosts from './screens/UserPosts';
import UserPostScreen from './screens/UserPostScreen';
import HistoryScreen from './screens/HistoryScreen';
import AskScreen from './screens/AskScreen';
import ForgotScreen from './screens/ForgotScreen';
import MessageScreen from './screens/MessageScreen';
import PeopleScreen from './screens/PeopleScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';

const CreateStack = createSwitchNavigator(
  {
    Create: CreateScreen,
    Topic: TopicScreen,
  },
  {
    initialRouteName: 'Create',
  },
);

const LoginStack = createStackNavigator(
  {
    Login: {
      screen: LoginScreen,
      navigationOptions: {
        headerShown: false,
      },
    },
    Forgot: {
      screen: ForgotScreen,
      navigationOptions: {title: 'Forgot Password'},
    },
  },
  {
    defaultNavigationOptions: {
      headerStyle: {backgroundColor: '#2274A5'},
      headerTitleStyle: {
        color: 'white',
      },
      headerBackImage: () => (
        <Ionicons
          color="white"
          style={{margin: 10}}
          name="md-arrow-back"
          size={25}
        />
      ),
    },
    initialRouteName: 'Login',
  },
);

const AppTabs = createBottomTabNavigator(
  {
    Home: HomeScreen,
    Search: SearchScreen,
    Create: CreateStack,
    Users: PeopleScreen,
    Leaderboard: LeaderboardScreen,
  },
  {
    tabBarOptions: {
      showLabel: false,
      activeTintColor: '#2274A5',
      inactiveTintColor: 'grey',
      style: {
        backgroundColor: '#fff',
        borderTopColor: 'transparent',
        elevation: 5,
      },
    },
  },
);

const ProfileTabs = createMaterialTopTabNavigator(
  {
    Home: ProfileHome,
    Tutorials: ProfileMade,
  },
  {
    tabBarOptions: {
      activeTintColor: '#2274A5',
      inactiveTintColor: 'gray',
      style: {
        backgroundColor: '#fff',
      },
      indicatorStyle: {
        backgroundColor: '#2274A5',
      },
    },
  },
);

const AuthStack = createSwitchNavigator(
  {
    Loading: LoadingScreen,
    Login: LoginStack,
    SignUp: {
      screen: SignUp,
      navigationOptions: {
        title: 'Create Your Account',
      },
    },
  },
  {
    initialRouteName: 'Loading',
  },
);

const AppStack = createStackNavigator(
  {
    Tabs: {
      screen: AppTabs,
      navigationOptions: ({navigation, goBack, tutorials}) => ({
        title: 'Stellr',
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontFamily: 'Roboto',
          fontSize: 23,
          color: 'white',
        },
        headerLeft: () => <StarCount />,
        headerRight: () => <AppHeader navigation={navigation} />,
      }),
    },
    Account: {
      screen: AccountScreen,
      navigationOptions: {
        headerBackImage: () => (
          <Ionicons
            color="white"
            style={{margin: 10}}
            name="md-close"
            size={25}
          />
        ),
      },
    },
    Messages: {
      screen: MessageScreen,
      navigationOptions: {
        headerBackImage: () => (
          <Ionicons
            color="white"
            style={{margin: 10}}
            name="md-close"
            size={25}
          />
        ),
      },
    },
    UserPosts: {
      screen: UserPosts,
      navigationOptions: {title: 'Your Posts'},
    },
    Profile: {screen: ProfileTabs, navigationOptions: {title: ''}},
    Posts: {screen: PostList, navigationOptions: {title: ''}},
    Tutorial: {screen: TutorialScreen, navigationOptions: {title: ''}},
    UserTopic: {screen: TopicScreen, navigationOptions: {title: 'Topic'}},
    UserTutorial: {screen: UserPostScreen, navigationOptions: {title: ''}},
    History: HistoryScreen,
  },
  {
    defaultNavigationOptions: {
      headerBackground: () => (
        <LinearGradient
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          colors={['#2274A5', '#10356c']}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '100%',
          }}
        />
      ),
      headerStyle: {
        height: 50,
      },
      headerTitleStyle: {
        color: 'white',
      },
      headerBackImage: () => (
        <Ionicons
          color="white"
          style={{margin: 10}}
          name="md-arrow-back"
          size={25}
        />
      ),
    },
    initialRouteName: 'Tabs',
  },
);

const AppNavigator = createAnimatedSwitchNavigator(
  {
    App: AppStack,
    Auth: AuthStack,
  },
  {
    initialRouteName: 'Auth',
    transition: (
      <Transition.Together>
        <Transition.Out
          type="slide-bottom"
          durationMs={400}
          interpolation="easeIn"
        />
        <Transition.In type="fade" durationMs={500} />
      </Transition.Together>
    ),
  },
);

HomeScreen.navigationOptions = {
  tabBarIcon: ({tintColor}) => (
    <MaterialCommunityIcons
      style={{alignSelf: 'center', padding: 10}}
      name="home-variant-outline"
      size={35}
      color={tintColor}
    />
  ),
};

CreateStack.navigationOptions = {
  tabBarIcon: ({tintColor}) => (
    <LinearGradient
      colors={['#2274A5', '#10356c']}
      style={{
        position: 'absolute',
        bottom: 10,
        height: 58,
        elevation: 7,
        width: 58,
        borderRadius: 58,
        backgroundColor: '#2274A5',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}>
      <MaterialCommunityIcons
        style={{alignSelf: 'center', padding: 10}}
        name="pencil"
        size={35}
        color={tintColor == '#2274A5' ? '#ffb52b' : 'white'}
      />
    </LinearGradient>
  ),
};

SearchScreen.navigationOptions = {
  tabBarIcon: ({tintColor}) => (
    <MaterialCommunityIcons
      style={{alignSelf: 'center', padding: 10}}
      name="telescope"
      size={35}
      color={tintColor}
    />
  ),
};

LeaderboardScreen.navigationOptions = {
  tabBarIcon: ({tintColor}) => (
    <MaterialCommunityIcons
      style={{alignSelf: 'center', padding: 10}}
      name="podium-gold"
      size={35}
      color={tintColor}
    />
  ),
};

PeopleScreen.navigationOptions = {
  tabBarIcon: ({tintColor}) => (
    <MaterialCommunityIcons
      style={{alignSelf: 'center', padding: 10}}
      name="account-group"
      size={40}
      color={tintColor}
    />
  ),
};

AskScreen.navigationOptions = {
  tabBarIcon: ({tintColor}) => (
    <MaterialCommunityIcons
      style={{alignSelf: 'center', padding: 10}}
      name="android-messages"
      size={35}
      color={tintColor}
    />
  ),
};

const AppContainer = createAppContainer(AppNavigator);

export default AppContainer;
