/**
 * A ping pong bot, whenever you send "ping", it replies "pong".
 */

// Import the discord.js module
const Discord = require('discord.js');
const db = require('./db');

// Create an instance of a Discord client
const client = new Discord.Client();

const prefix = "!";

let todoList = [
    "example item 1",
    "example item 2"
]

const createTable = async () =>{
    await db.run(`CREATE TABLE IF NOT EXISTS todo (
        id INTEGER PRIMARY KEY,
        content TEXT NOT NULL
    )`)
}

const save = async () => {
    console.log("saving...");
    await createTable();
    let list = "";
    for(let item in todoList){
        list += todoList[item]+",";
    }
    list = list.substring(0, list.length - 1);
    //await db.run("INSERT INTO todo(id,content) VALUES('1','"+list+"');");
    await db.run("UPDATE todo SET content= '"+list+"' WHERE id=1");
    
}

const load = async() => {
    console.log("loading...");
    await createTable();
    const data = await db.each("SELECT * FROM todo");
    if(data.length === 0){
        console.log("No Data To Load... Loading Example Data...");
        return;
    }
    todoList = [];
    const dataSplit = data[0].content.split(',');
    for(let item in dataSplit){
        //console.log(data[item]);
        todoList.push(dataSplit[item]);
    }
    console.log("Loaded data!");
}

const help = (args, message)=>{
    let results = "\r\n**///////** **ToDo Help** **///////**\r\n";
    for(let command in commandMap){
        results += "**"+commandMap[command].name + "**\r\n";
        results += "```";
        results += "Description: "+commandMap[command].description + "\r\n";
        results += "Aliases: \r\n";
        for(let alias in commandMap[command].aliases){
            results += ">> "+commandMap[command].aliases[alias] + "\r\n";
        }
        results += "Example: "+commandMap[command].example + "\r\n";
        results += "```\r\n";
    }
    //console.log("results:",results)
    message.channel.send(results);
}

const newItem = (args, message)=>{
    // we dont care about the first arg anymore
    args.shift();
    if(args[0] === undefined){
        message.channel.send('Looks like you want me to save a todo item but didn\'t give me anything to save...');
        return;
    }
    message.channel.send('Saving your todo item...');
    todoList.push(args.join(' '))
    showList(args,message);
    save();
}

const editItem = (args, message)=>{
    // we dont care about the first arg anymore
    args.shift();
    args[0] = Number(args[0]);
    if(args[1] === undefined || typeof args[0] !== 'number'){
        message.channel.send('Looks like you want me to edit a todo item but didn\'t give me anything to edit...');
        return;
    }
    message.channel.send('Editing the todo item...');
    const realIndex = args[0] - 1;
    if(realIndex < 0 || realIndex >= todoList.length){
        message.channel.send('That\'s an invalid index number!');
    }
    // drop the second arg
    args.shift();
    todoList.splice(realIndex, 1, args.join(' '));
    showList(args,message);
    save();
}

const deleteItem = (args, message)=>{
    // we dont care about the first arg anymore
    args.shift();
    args[0] = Number(args[0]);
    if(args[0] === undefined || typeof args[0] !== 'number'){
        message.channel.send('Looks like you want me to delete a todo item but didn\'t give me anything to delete...'+ typeof args[1]);
        return;
    }
    message.channel.send('Closing the todo item...');
    const realIndex = args[0] - 1;
    if(realIndex < 0 || realIndex >= todoList.length){
        message.channel.send('That\'s an invalid index number!');
    }
    todoList.splice(realIndex, 1);
    showList(args,message);
    save();
}

const showList = (args,message)=>{
    let results = "\r\n**///////** **ToDo** **///////**\r\n";
    for(let item in todoList){
        results += "**";
        results += Number(item) + 1 + ") ";
        results += todoList[item] + "**\r\n";
    }
    //console.log("results:",results)
    message.channel.send(results)
}

let commandMap = {
    help: {
        name: 'help',
        aliases: [
            '?'
        ],
        description: 'Shows Help.',
        example: prefix+'todo help',
        command: help
    },
    show: {
        name: 'show',
        aliases: [
            'list'
        ],
        description: 'Shows the todo list.',
        example: prefix+'todo show',
        command: showList
    },
    new: {
        name: 'new',
        aliases: [
            'create'
        ],
        description: 'Creates a new todo item.',
        example: prefix+'todo new This is what needs to be done!',
        command: newItem
    },
    edit: {
        name: 'edit',
        aliases: [
            'change',
            'update'
        ],
        description: 'Edits a todo item.',
        example: prefix+'todo edit This is the change that needs to be made!',
        command: editItem
    },
    delete: {
        name: 'delete',
        aliases: [
            'finish',
            'remove'
        ],
        description: 'Removes an item from the list.',
        example: prefix+'todo delete 2',
        command: deleteItem
    }
}

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on('ready', () => {
    console.log('I am ready!');
  });
  
  // Create an event listener for messages
  client.on('message', message => {
    processMessage(message);
  });
  
  function processMessage(message){
      if(message.author.bot){
          console.log("Heard a bot message, ignoring...");
          return;
      }
      console.log("///////")
      console.log("New Message");
      console.log("User: ", message.author.username)
      console.log("Channel: ",message.channel.name);
      console.log("Message: ",message.content);
      let query = message.content.split(" ");
      const command = query[0].toLowerCase();
      let args = [...query];
      // we dont care about the fist arg anymore
      args.shift();
      if (command === prefix+'test') {
          message.channel.send('Args: '+args);
      }
      if (command === prefix+'todo') {
          if(args[0] === undefined){
              message.channel.send('Hi I\'m ToDo Bot!');
              showList(args,message);
              return;
          }
          // look for aliases
          for(let command in commandMap){
              for(let alias in commandMap[command].aliases){
                  //console.log("alias",commandMap[command].aliases[alias])
                  if(args[0].toLowerCase() === commandMap[command].aliases[alias]){
                    args[0] = command;
                    console.log("Alias:",commandMap[command].aliases[alias],"found for",command)
                  }
              }
          }
          try{
              commandMap[args[0].toLowerCase()].command(args,message);
          }
          catch(err){
              console.log(err);
              message.channel.send("Unknown Command: "+args[0].toLowerCase());
          }
      }
  }


load();
// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login('NjY0MjgxODM3NTgxMTA3MjIw.XhUzcw.mIT8oeA0u2eAfGzTRxOoTgrZe10');