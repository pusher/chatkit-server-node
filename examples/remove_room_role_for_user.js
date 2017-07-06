var ChatKit = require('../target/index');
var PusherPlatform = require('../node_modules/pusher-platform-node/target/index');

// Just for local testing where using self signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const baseClient = new PusherPlatform.BaseClient({
  host: 'localhost',
  port: 10443
})

const chatkit = new ChatKit.ChatKit({
  appId: 'auth-example-app',
  appKey: 'the-id-bit:the-secret-bit',
  cluster: 'localhost',
  client: baseClient
});

chatkit.removeRoomRoleForUser('ham', 123)
  .then((msg) => {
    console.log(msg);
  }).catch((err) => {
    console.log(err);
  })
