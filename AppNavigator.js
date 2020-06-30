import { createAppContainer, createSwitchNavigator } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import {
  createBottomTabNavigator,
  createMaterialTopTabNavigator
} from "react-navigation-tabs";
import createAnimatedSwitchNavigator from "react-navigation-animated-switch";
import { Transition } from "react-native-reanimated";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { connect } from "react-redux";

import AppHeader from "./screens/components/AppHeader";
import HomeScreen from "./screens/HomeScreen";
import CreateScreen from "./screens/CreateScreen";
import SearchScreen from "./screens/SearchScreen";
import LoginScreen from "./screens/LoginScreen";
import LoadingScreen from "./screens/LoadingScreen";
import Signup from "./screens/SignUp";
import TutorialScreen from "./screens/TutorialScreen";
import LearningScreen from "./screens/LearningScreen";
import AccountScreen from "./screens/AccountScreen";
import TopicScreen from "./screens/TopicScreen";
import UserPosts from "./screens/UserPosts";
import UserPostScreen from "./screens/UserPostScreen";
import HistoryScreen from "./screens/HistoryScreen";
import AskScreen from "./screens/AskScreen";
import ForgotScreen from "./screens/ForgotScreen";
import MessageScreen from "./screens/MessageScreen";

const SearchStack = createStackNavigator(
  {
    Search: SearchScreen,
    Tutorial: TutorialScreen
  },
  {
    headerMode: "none",
    navigationOptions: {
      headerShown: false
    }
  }
);

const CreateStack = createSwitchNavigator(
  {
    Create: CreateScreen,
    Topic: TopicScreen
  },
  {
    initialRouteName: "Create"
  }
);

const HomeStack = createStackNavigator(
  {
    Home: HomeScreen,
    Added: LearningScreen
  },
  {
    headerMode: "none",
    navigationOptions: {
      headerShown: false
    },
    initialRouteName: "Home"
  }
);

const LoginStack = createStackNavigator(
  {
    Login: LoginScreen,
    Forgot: ForgotScreen
  },
  {
    initialRouteName: "Login",
    headerMode: "none"
  }
);

const AppTabs = createBottomTabNavigator(
  {
    Home: HomeStack,
    Create: CreateStack,
    Search: SearchStack,
    Ask: AskScreen
  },
  {
    tabBarOptions: {
      activeTintColor: "#0b5c87",
      inactiveTintColor: "white",
      style: {
        backgroundColor: "#6da9c9",
        borderTopColor: "transparent"
      }
    }
  }
);

const AuthStack = createAnimatedSwitchNavigator(
  {
    Loading: LoadingScreen,
    Login: LoginStack,
    SignUp: {
      screen: Signup,
      navigationOptions: {
        title: "Create Your Account"
      }
    }
  },
  {
    initialRouteName: "Loading",
    defaultNavigationOptions: {
      headerLeft: () => null,
      headerStyle: {
        backgroundColor: "cornflowerblue"
      },
      headerTitleStyle: {
        color: "white"
      }
    }
  }
);

const AppStack = createStackNavigator(
  {
    Tabs: {
      screen: AppTabs,
      navigationOptions: ({ navigation, goBack }) => ({
        title: "Skoach",
        headerRight: () => (
          <AppHeader navigation={navigation} />
        )
      })
    },
    Account: {
      screen: AccountScreen,
      navigationOptions: {
        headerBackImage: () => (
          <Ionicons
            color="white"
            style={{ margin: 10 }}
            name="md-close"
            size={25}
          />
        )
      }
    },
    Messages: {
      screen: MessageScreen,
      navigationOptions: {
        headerBackImage: () => (
          <Ionicons
            color="white"
            style={{ margin: 10 }}
            name="md-close"
            size={25}
          />
        )
      }
    },
    UserPosts: {
      screen: UserPosts,
      navigationOptions: { title: "Your Posts" }
    },
    UserTopic: { screen: TopicScreen, navigationOptions: { title: "Topic" } },
    UserTutorial: { screen: UserPostScreen, navigationOptions: { title: "" } },
    History: HistoryScreen
  },
  {
    defaultNavigationOptions: {
      headerStyle: { backgroundColor: "#0b5c87" },
      headerTitleStyle: {
        color: "white"
      },
      headerBackImage: () => (
        <Ionicons
          color="white"
          style={{ margin: 10 }}
          name="md-arrow-back"
          size={25}
        />
      )
    },
    initialRouteName: "Tabs"
  }
);

const AppNavigator = createAnimatedSwitchNavigator(
  {
    App: AppStack,
    Auth: AuthStack
  },
  {
    initialRouteName: "Auth",
    transition: (
      <Transition.Together>
        <Transition.Out
          type="slide-bottom"
          durationMs={400}
          interpolation="easeIn"
        />
        <Transition.In type="fade" durationMs={500} />
      </Transition.Together>
    )
  }
);

AskScreen.navigationOptions = {
  tabBarIcon: ({ tintColor }) => (
    <Ionicons
      style={{ alignSelf: "center" }}
      name="ios-list-box"
      size={25}
      color={tintColor}
    />
  )
};

HomeStack.navigationOptions = {
  tabBarIcon: ({ tintColor }) => (
    <Ionicons
      style={{ alignSelf: "center" }}
      name="md-home"
      size={25}
      color={tintColor}
    />
  )
};

CreateStack.navigationOptions = {
  tabBarIcon: ({ tintColor }) => (
    <Ionicons
      style={{ alignSelf: "center" }}
      name="md-create"
      size={25}
      color={tintColor}
    />
  )
};

SearchStack.navigationOptions = {
  tabBarIcon: ({ tintColor }) => (
    <Ionicons
      style={{ alignSelf: "center" }}
      name="ios-search"
      size={25}
      color={tintColor}
    />
  )
};

const AppContainer = createAppContainer(AppNavigator);

const mapStateToProps = state => ({
  tutorials: state.tutorials
});

export default connect(mapStateToProps)(AppContainer);
