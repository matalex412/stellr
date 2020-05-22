import { createAppContainer, createSwitchNavigator } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { createBottomTabNavigator } from "react-navigation-tabs";
import createAnimatedSwitchNavigator from "react-navigation-animated-switch";
import { Transition } from "react-native-reanimated";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Text, TouchableOpacity } from "react-native";
import React from "react";

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

const AppTabs = createBottomTabNavigator(
  {
    Home: HomeStack,
    Create: CreateStack,
    Search: SearchStack
  },
  {
    tabBarOptions: {
      activeTintColor: "coral",
      inactiveTintColor: "white",
      style: {
        backgroundColor: "cornflowerblue"
      }
    }
  }
);

const AuthStack = createAnimatedSwitchNavigator(
  {
    Loading: LoadingScreen,
    Login: LoginScreen,
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
        headerStyle: {
          backgroundColor: "cornflowerblue"
        },
        headerTitleStyle: {
          color: "white"
        },
        headerRight: () => (
          <TouchableOpacity
            style={{ paddingRight: 10 }}
            onPress={() => {
              navigation.navigate("Account");
            }}
          >
            <Text style={{ color: "white" }}>Account</Text>
          </TouchableOpacity>
        )
      })
    },
    Account: {
      screen: AccountScreen,
      navigationOptions: {
        headerBackImage: () => (
          <Ionicons style={{ margin: 10 }} name="md-close" size={25} />
        )
      }
    },
    UserPosts: {
      screen: UserPosts,
      navigationOptions: { title: "Your Posts" }
    },
    UserTutorial: { screen: UserPostScreen, navigationOptions: { title: "" } },
    History: HistoryScreen
  },
  {
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

HomeStack.navigationOptions = {
  tabBarIcon: ({ tintColor }) => (
    <Ionicons name="md-home" size={25} color={tintColor} />
  )
};

CreateStack.navigationOptions = {
  tabBarIcon: ({ tintColor }) => (
    <Ionicons name="md-create" size={25} color={tintColor} />
  )
};

SearchStack.navigationOptions = {
  tabBarIcon: ({ tintColor }) => (
    <Ionicons name="ios-search" size={25} color={tintColor} />
  )
};

const AppContainer = createAppContainer(AppNavigator);

export default AppContainer;
