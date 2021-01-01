import React from 'react';
import AppContainer from './AppNavigator';
import {Provider} from 'react-redux';
import {StatusBar, LogBox} from 'react-native';
import _ from 'lodash';
import {decode, encode} from 'base-64';

import {store} from './redux/store';

LogBox.ignoreLogs(['Setting a timer']);
const _console = _.clone(console);
console.warn = (message) => {
  if (message.indexOf('Setting a timer') <= -1) {
    _console.warn(message);
  }
};

if (!global.btoa) {
  global.btoa = encode;
}
if (!global.atob) {
  global.atob = decode;
}

export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <AppContainer />
      </Provider>
    );
  }
}
