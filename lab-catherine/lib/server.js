'use strict';

const net = require('net');
const winston = require('winston');
const faker = require('faker');

let logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ filename: 'log.json' }),
  ],
});

logger.log('info','Hello world!');

class Client {
  constructor(socket) {
    this.id = faker.random.uuid();
    this.name = faker.internet.userName();
    this.socket = socket;
    clients.push(this);
  }
}

const app = net.createServer();
let clients = [];


let parseCommand = (message,socket) => {
  let name;
  clients.forEach(client => {
    if(client.socket === socket) {
      name = client.name;
    }
  });
  console.log(socket);
  if(message.startsWith('@')) {
    let parsedCommand = message.split(' ');
    let commandWord = parsedCommand[0];
    let clientnames = clients.map(client => {
      return client.name;
    });

    switch(commandWord){
    case '@list':
      socket.write(clients.map(client => client.name).join('\n') + '\n');
      break;
    case '@quit':
      socket.end(`See you next time ${name}!\n`);
      break;
    case '@name':
      clients.forEach(client => {
        if(client.socket === socket) {
          client.name = parsedCommand[1];
        }
      });
      break;
    case '@dm':
      if(!(clientnames.includes(parsedCommand[1]))) {
        for(let client of clients) {
          if(client === socket) {
            client.write(`${parsedCommand[1]} is not a valid user.\n`);
          }
        }
        break;
      }
      clients.forEach(client => {
        if(client.name === parsedCommand[1]) {
          let directMessage = parsedCommand.slice(2).join(' ');
          client.write(`DM from ${name}: ${directMessage}\n`);
        }
      });
      break;
    default:
      socket.write(`Valid commands: @list, @quit, @name <new-username>, @dm <to user-name> <message>\n`);
      break;
    }
    return true;
  }
  return false;
};

app.on('connection', (socket) => {
  new Client(socket);
  // socket.name = faker.internet.userName();
  // clients.push(socket);
  logger.log('info', `Net socket`);
  socket.write('Welcome to 401d19 chatroom\n'); 
  socket.write(`Your name is ${socket.name}\n`);


  socket.on('data',(data) => {
    logger.log('info', `Processing data: ${data}`);
    let message = data.toString().trim();

    if(parseCommand(message,socket))
      return;

    for(let client of clients){
      if(client.socket !== socket)
        client.socket.write(`${client.name}: ${message}\n`);
    }
  });

  let removeClient = (socket) => () => {
    clients = clients.filter((client) => {
      return client.socket !== socket;
    }); 
    logger.log('info',`Removing ${socket.name}`);
  };
  socket.on('error', removeClient(socket));
  socket.on('close', removeClient(socket));
});

const server = module.exports = {};

server.start = (port, callback) => {
  logger.log('info',`Server is up on port ${port}`);
  console.log('info',`Server is up on port ${port}`);
  return app.listen(port,callback);
};

server.stop = (callback) => {
  logger.log('info',`Server is off`);
  return app.close(callback);
};