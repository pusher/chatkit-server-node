const express = require('express')
const bodyParser = require('body-parser')
var chatkitServer = require('../target/src/index');
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))

const chatkit = new chatkitServer.default({
  instanceLocator: 'your:instance:locator',
  key: 'your:key'
});

app.post('/auth', (req, res) => {
  const authData = chatkit.authenticate({
    userId: 'your-user-id'
  });

  res.status(authData.status)
     .set(authData.headers)
     .send(authData.body);
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
