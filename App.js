import React from "react";
import AppContainer from "./AppNavigator";
import { Provider } from "react-redux";
import { StatusBar } from "react-native";
import { YellowBox } from "react-native";
import _ from "lodash";

import { store } from "./redux/store";

YellowBox.ignoreWarnings(["Setting a timer"]);
const _console = _.clone(console);
console.warn = message => {
  if (message.indexOf("Setting a timer") <= -1) {
    _console.warn(message);
  }
};

export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <AppContainer />
      </Provider>
    );
  }
}
