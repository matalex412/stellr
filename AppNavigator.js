import { createAppContainer, createSwitchNavigator } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import {
  createBottomTabNavigator,
  createMaterialTopTabNavigator,
} from "react-navigation-tabs";
import createAnimatedSwitchNavigator from "react-navigation-animated-switch";
import { Transition } from "react-native-reanimated";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Text, TouchableOpacity, View } from "react-native";
import React from "react";

import AppHeader from "./screens/components/AppHeader";
import HomeScreen from "./screens/HomeScreen";
import AddedScreen from "./screens/AddedScreen";
import CreateScreen from "./screens/CreateScreen";
import SearchScreen from "./screens/SearchScreen";
import LoginScreen from "./screens/LoginScreen";
import LoadingScreen from "./screens/LoadingScreen";
import SignUp from "./screens/SignUp";
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
import PeopleScreen from "./screens/PeopleScreen";
import ProfileScreen from "./screens/ProfileScreen";

const CreateStack = createSwitchNavigator(
  {
    Create: CreateScreen,
    Topic: TopicScreen,
  },
  {
    initialRouteName: "Create",
  }
);

const HomeTabs = createMaterialTopTabNavigator(
  {
    Home: HomeScreen,
    Added: AddedScreen,
  },
  {
    tabBarOptions: {
      activeTintColor: "#ffb52b",
      inactiveTintColor: "white",
      style: {
        backgroundColor: "#6da9c9",
      },
      indicatorStyle: {
        backgroundColor: "#ffb52b",
      },
    },
  }
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
      navigationOptions: { title: "Forgot Password" },
    },
  },
  {
    defaultNavigationOptions: {
      headerStyle: { backgroundColor: "#6da9c9" },
      headerTitleStyle: {
        color: "white",
      },
      headerBackImage: () => (
        <Ionicons
          color="white"
          style={{ margin: 10 }}
          name="md-arrow-back"
          size={25}
        />
      ),
    },
    initialRouteName: "Login",
  }
);

const AppTabs = createBottomTabNavigator(
  {
    Home: HomeTabs,
    Create: CreateStack,
    Search: SearchScreen,
    Ask: AskScreen,
    Users: PeopleScreen,
  },
  {
    tabBarOptions: {
      showLabel: false,
      activeTintColor: "#ffb52b",
      style: {
        backgroundColor: "#fff",
        borderTopColor: "transparent",
        elevation: 6,
      },
    },
  }
);

const AuthStack = createSwitchNavigator(
  {
    Loading: LoadingScreen,
    Login: LoginStack,
    SignUp: {
      screen: SignUp,
      navigationOptions: {
        title: "Create Your Account",
      },
    },
  },
  {
    initialRouteName: "Loading",
  }
);

const AppStack = createStackNavigator(
  {
    Tabs: {
      screen: AppTabs,
      navigationOptions: ({ navigation, goBack, tutorials }) => ({
        title: "Skoach",
        headerRight: () => <AppHeader navigation={navigation} />,
      }),
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
        ),
      },
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
        ),
      },
    },
    UserPosts: {
      screen: UserPosts,
      navigationOptions: { title: "Your Posts" },
    },
    Profile: ProfileScreen,
    Learning: LearningScreen,
    Tutorial: TutorialScreen,
    UserTopic: { screen: TopicScreen, navigationOptions: { title: "Topic" } },
    UserTutorial: { screen: UserPostScreen, navigationOptions: { title: "" } },
    History: HistoryScreen,
  },
  {
    defaultNavigationOptions: {
      headerStyle: { backgroundColor: "#6da9c9" },
      headerTitleStyle: {
        color: "white",
      },
      headerBackImage: () => (
        <Ionicons
          color="white"
          style={{ margin: 10 }}
          name="md-arrow-back"
          size={25}
        />
      ),
    },
    initialRouteName: "Tabs",
  }
);

const AppNavigator = createAnimatedSwitchNavigator(
  {
    App: AppStack,
    Auth: AuthStack,
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
    ),
  }
);

HomeTabs.navigationOptions = {
  tabBarIcon: ({ tintColor }) => (
    <MaterialCommunityIcons
      style={{ alignSelf: "center", padding: 10 }}
      name="home"
      size={35}
      color={tintColor}
    />
  ),
};

CreateStack.navigationOptions = {
  tabBarIcon: ({ tintColor }) => (
    <MaterialCommunityIcons
      style={{ alignSelf: "center", padding: 10 }}
      name="pencil"
      size={35}
      color={tintColor}
    />
  ),
};

SearchScreen.navigationOptions = {
  tabBarIcon: ({ tintColor }) => (
    <MaterialCommunityIcons
      style={{ alignSelf: "center", padding: 10 }}
      name="compass"
      size={35}
      color={tintColor}
    />
  ),
};

PeopleScreen.navigationOptions = {
  tabBarIcon: ({ tintColor }) => (
    <MaterialCommunityIcons
      style={{ alignSelf: "center", padding: 10 }}
      name="account-group"
      size={40}
      color={tintColor}
    />
  ),
};

AskScreen.navigationOptions = {
  tabBarIcon: ({ tintColor }) => (
    <MaterialCommunityIcons
      style={{ alignSelf: "center", padding: 10 }}
      name="android-messages"
      size={35}
      color={tintColor}
    />
  ),
};

const AppContainer = createAppContainer(AppNavigator);

export default AppContainer;
