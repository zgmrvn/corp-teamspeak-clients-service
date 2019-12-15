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
    timeout: 1500
  }
 
  try {
    await connection.connect(params);
  } catch(error) {
    console.log(error);
  }

  let response = [];

  try {
    await connection.send('use sid=1', { waitfor: '\n' });
    await connection.send(`login ${process.env.SERVER_QUERY_USER} ${process.env.SERVER_QUERY_PASSWORD}`, { waitfor: '\n' });
    let clients = await connection.send('clientlist', { waitfor: '\n' });
    connection.end();

    // if the command was ok, format the response
    if (clients.search('error id=0 msg=ok') >= 0) {
      const reg = /^clid=(\d+)\scid=(\d+)\sclient_database_id=(\d+)\sclient_nickname=(.+)\sclient_type=(\d)$/
  
      clients = clients.split('\n')[0];
      clients = clients.split('|');
      clients = clients.map(c => reg.exec(c));
      clients = clients.filter(c => c[5] == 0);
      response = clients.map(c => sanitize(c[4]));
    }
  } catch (error) {
    await connection.destroy();
    console.log(error);
  }

  res.json(response);
});

// Listen on port 5000
app.listen(port, () => {
  console.log(`Server is running on port 5000 \n Visit http://localhost:5000`);
});
