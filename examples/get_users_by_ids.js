var ChatKit = require('../target/index');

// var PusherPlatform = require('../node_modules/pusher-platform-node/target/index');

// Just for local testing where using self signed certs
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// const baseClient = new PusherPlatform.BaseClient({
//   host: 'localhost',
//   port: 10443
// })

const chatkit = new ChatKit.default({
  instanceId: 'v1:api-deneb:e8f29828-3a12-4a3e-ac7d-a1c79caee867',
  key: 'a620ded4-45f5-464d-901c-4f9c1b961a36:bB+hJBEkxwoGkm+kwGs1OwBCW+9l7E/fKYHNQig9744='
});

chatkit.getUsersByIds(['harrypotter'])
  .then((res) => {
    console.log(res);
  }).catch((err) => {
    console.log(err);
  })
