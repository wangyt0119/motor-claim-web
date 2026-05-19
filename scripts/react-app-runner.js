const path = require('path');

const command = process.argv[2];
const targetApp = process.argv[3] || 'main';
const defaultPorts = {
  main: '3000',
  customer: '3001',
  admin: '3002',
  officer: '3003',
  'panel-workshop': '3004',
};

if (!command) {
  throw new Error('Missing react-scripts command. Expected start, build, or test.');
}

process.env.REACT_APP_TARGET_APP = targetApp;

if (command === 'start' && !process.env.PORT) {
  process.env.PORT = defaultPorts[targetApp] || defaultPorts.main;
}

if (command === 'build') {
  process.env.BUILD_PATH =
    targetApp === 'main' ? 'build/main' : path.join('build', targetApp);
}

require(`react-scripts/scripts/${command}`);
