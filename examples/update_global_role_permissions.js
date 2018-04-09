var Chatkit = require('../target/index');

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

chatkit.updatePermissionsForGlobalRole({
  roleName: 'default',
  permissionsToAdd: [
    'message:create',
    'room:join',
    'room:leave',
    'room:members:add',
    'room:members:remove',
    'room:get',
    'room:create',
    'room:messages:get',
    'room:typing_indicator:create',
    'presence:subscribe',
    'user:get',
    'user:rooms:get',
    'cursors:read:get',
    'cursors:read:set',
    'file:create',
    'file:get',
    'room:delete',
    'room:update'
  ]
})
  .then(() => {
    console.log('Success');
  }).catch((err) => {
    console.log(err);
  });
