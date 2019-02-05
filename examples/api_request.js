var Chatkit = require('../target/src/index');

// var PusherPlatform = require('../node_modules/pusher-platform-node/target/index');

// Just for local testing where using self signed certs
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// const baseClient = new PusherPlatform.BaseClient({
//   host: 'localhost',
//   port: 10443
// })

const chatkit = new Chatkit.default({
  instanceLocator: 'v1:us1:example',
  key: 'your:key'
});

chatkit.apiRequest({
  method: 'POST',
  path: '/rooms',
  body: {
    name: 'Hello from ham'
  },
  qs: {
    test: 'hamagain'
  },
  jwt: chatkit.generateAccessToken({ userId: 'example' }).token
}).then(() => {
    console.log('Success');
  }).catch((err) => {
    console.log(err);
  });
