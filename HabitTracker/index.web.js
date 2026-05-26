if (typeof global === 'undefined') {
  window.global = window;
}

import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('HabitTracker', () => App);
AppRegistry.runApplication('HabitTracker', {
  initialProps: {},
  rootTag: document.getElementById('app-root'),
});
