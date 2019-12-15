const express = require('express');
const Telnet = require('telnet-client');

function sanitize(string) {
  const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return string.replace(reg, (match)=>(map[match]));
}

const app = express();
const port = 5000;

// Body parser
app.use(express.urlencoded({ extended: false }));

// endpoint
app.get('/', async (req, res) => {
  const connection = new Telnet();
 
  const params = {
    host: 'ts.corp-arma.fr',
    port: 10011,
    shellPrompt: 'Welcome to the TeamSpeak 3 ServerQuery interface, type "help" for a list of commands and "help <command>" for information on a specific command.',
    timeout: 1500,
    ors: '\r\n',
    waitfor: '\n'
  }
 
  try {
    await connection.connect(params);
  } catch(error) {
    console.log(error);
  }

  let response = [];

  try {
    await connection.send('use sid=1');
    await connection.send(`login ${process.env.SERVER_QUERY_USER} ${process.env.SERVER_QUERY_PASSWORD}`);
    let clients = await connection.send('clientlist');

    connection.end();

    // if the command was ok, format the response
    if (clients.search('error id=0 msg=ok') >= 0) {
      const reg = /^clid=(?<clid>\d+)\scid=(?<cid>\d+)\sclient_database_id=(?<clientDatabaseId>\d+)\sclient_nickname=(?<clientNickname>.+)\sclient_type=(?<clientType>\d)$/
  
      clients = clients.split('\n')[0];
      clients = clients.split('|');
      clients = clients.map(c => reg.exec(c).groups);
      clients = clients.filter(c => c.clientType == 0);
      response = clients.map(c => sanitize(c.clientNickname));
    }
  } catch (error) {
    console.log(error);
  }

  res.json(response);
});

// Listen on port 5000
app.listen(port, () => {
  console.log(`Server is running on port 5000 \n Visit http://localhost:5000`);
});
