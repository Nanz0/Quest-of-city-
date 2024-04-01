const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();

const path = require("path");
const http = require('http');
const {Server} = require('socket.io');

const server = http.createServer(app);
// Parse JSON bodies (as sent by API clients)

const io = new Server(server);
app.use(express.static(path.resolve(__dirname, ''))); // Serve static files

app.use(cors());
app.use(express.json());

const landmarks = [
    {
        name: "Taj Mahal", 
        id: "Taj", 
        numberOfClues: 5, 
        clues: ["Banks of Yamuna River", "Symbol of Love", "Built by Mughal Emperor", "Seven Wonders", "UNESCO World Heritage Site"],
        trivia: {
            question: "Who commissioned the construction of the Taj Mahal?",
            options: ["Emperor Akbar", "Emperor Jahangir", "Emperor Shah Jahan", "Emperor Aurangzeb"],
            correctAnswer: "Emperor Shah Jahan"
        }
    },
    {
        name: "Eiffel Tower", 
        id: "Eiffel", 
        numberOfClues: 5, 
        clues: ["Iron lattice", "French Revolution Anniversary", "Built as Entrance Arch", "Global icon", "Engineer Gustave Eiffel"],
        trivia: {
            question: "In which year was the Eiffel Tower completed?",
            options: ["1887", "1889", "1891", "1900"],
            correctAnswer: "1889"
        }
    },
    {
        name: "Wall of China", 
        id: "Chinawall", 
        numberOfClues: 4, 
        clues: ["Constructed over several centuries", "Made of Stones", "13170 miles long", "Defense against Invasions"],
        trivia: {
            question: "Which dynasty is credited with the construction of the majority of the present-day Great Wall?",
            options: ["Qin Dynasty", "Han Dynasty", "Ming Dynasty", "Sui Dynasty"],
            correctAnswer: "Ming Dynasty"
        }
    },
    {
        name: "Statue of Liberty", 
        id: "Liberty", 
        numberOfClues: 3, 
        clues: ["Gifted to United States", "Freedom and democracy", "New York Harbor"],
        trivia: {
            question: "From which country did the United States receive the Statue of Liberty as a gift?",
            options: ["France", "United Kingdom", "Germany", "Italy"],
            correctAnswer: "France"
        }
    },
    {
        name: "Pyramids of Giza", 
        id: "Giza", 
        numberOfClues: 3, 
        clues: ["Built 2580-2560 BCE", "Massive stone blocks", "Plateau near Cairo"],
        trivia: {
            question: "Which Pharaoh was the Great Pyramid of Giza built for?",
            options: ["Khufu", "Khafre", "Menkaure", "Djoser"],
            correctAnswer: "Khufu"
        }
    },
    {
        name: "Sydney Opera House", 
        id: "Sydneyopera", 
        numberOfClues: 2, 
        clues: ["Performing arts venue", "Sydney Harbour"],
        trivia: {
            question: "Who was the architect of the Sydney Opera House?",
            options: ["Jørn Utzon", "Frank Gehry", "I.M. Pei", "Renzo Piano"],
            correctAnswer: "Jørn Utzon"
        }
    },
    {
        name: "Colosseum", 
        id: "Colosseum", 
        numberOfClues: 5, 
        clues: ["Ancient Roman gladiatorial arena", "symbol of roman empire grandeur", "located in centeral Rome", "Constructed under Flavian emperors", "Could hold 80000 spectators"],
        trivia: {
            question: "What was the primary purpose of the Colosseum?",
            options: ["Marketplace", "Gladiatorial contests and public spectacles", "Royal residence", "Legislative meetings"],
            correctAnswer: "Gladiatorial contests and public spectacles"
        }
    },
    {
        name: "Machu Picchu", 
        id: "Machupicchu", 
        numberOfClues: 5, 
        clues: ["incan citadel set high in andes mountains", "represents inca empire's architectural genius", "in Peru, above urubamba river valley", "built in 15th century under Pachacuti", "rediscovered by hiram bingham in 1911"],
        trivia: {
            question: "What was Machu Picchu believed to be?",
            options: ["A prison", "A royal estate", "A fortress", "A ceremonial site"],
            correctAnswer: "A royal estate"
        }
    },
    {
        name: "Great Sphinx of Giza", 
        id: "Sphinx", 
        numberOfClues: 5, 
        clues: ["monumental limestone statue with lion's body & humanhead", "Associated with Pharaoh Khafre", "stands on giza plateau on bank of nile", "One of world's largest & oldest statues", "symbol of mystery & wisdom of ancient egypt"],
        trivia: {
            question: "Which Pharaoh is the Great Sphinx of Giza associated with?",
            options: ["Khafre", "Menes", "Djoser", "Ramses II"],
            correctAnswer: "Khafre"
        }
    },
    {
        name: "Petra", 
        id: "Petra", 
        numberOfClues: 5, 
        clues: ["archaeological city famous for rock-cut architecture", "Capital of Nabatean Kingdom", "located in present-day Jordan", "known as 'Rose City' for pink sandstone cliffs", "featured in films like Indiana Jones"],
        trivia: {
            question: "What civilization built the city of Petra?",
            options: ["Roman", "Greek", "Nabatean", "Byzantine"],
            correctAnswer: "Nabatean"
        }
    },
    {
        name: "Angkor Wat", 
        id: "Angkor", 
        numberOfClues: 5, 
        clues: ["largest religious monument in world", "originally constructed as hindu temple", "gradually transformed into buddhist temple", "symbol of cambodia & appears on national flag", "exemplifies high classical style of khmer architecture"],
        trivia: {
            question: "Angkor Wat was originally dedicated to which Hindu god?",
            options: ["Vishnu", "Shiva", "Brahma", "Krishna"],
            correctAnswer: "Vishnu"
        }
    },
    {
        name: "Acropolis of Athens", 
        id: "Athens", 
        numberOfClues: 5, 
        clues: ["ancient citadel located above city of athens", "home to buildings of great architectural & historic significance", "The most famous being the Parthenon", "Symbol of the glory of ancient Greece", "UNESCO World Heritage Site for its cultural impact"],
        trivia: {
            question: "Which goddess is the Parthenon dedicated to?",
            options: ["Athena", "Artemis", "Aphrodite", "Hera"],
            correctAnswer: "Athena"
        }
    },
    {
        name: "Faisal Mosque", 
        id: "FaisalMosque", 
        numberOfClues: 3, 
        clues: ["mughal era architectural masterpiece", "located in lahore, pakistan", "one of the largest mosques in the world"],
        trivia: {
            question: "In which city is the Faisal Mosque located?",
            options: ["Karachi", "Lahore", "Islamabad", "Peshawar"],
            correctAnswer: "Islamabad"
        }
    }
];

let players=[];
let specialCards = []
let playingArray=[]

let landmarksSelected = false;
let selectedLandmarks;
let totalTurns = 0;
let socketIDea = [];
let landmarkerCarders = [];

let normalTurn = 300000; // Turn duration set to 5 minutes
let turnDuration = normalTurn;

let turnLimiter = [false, false, false];
let currentTurn = 0; // Keep track of the current turn
let turnTimeout; // Variable to store the timeout function

let playerScore = {
  player1_score:0,
  player2_score:0,
  player3_score:0
}

// HOME PAGE
app.get("/", (req, res)=>{
  // Send 'index.html' for requests to the root URL "/"
  res.sendFile(path.join(__dirname, 'index.html'));
})

// SIGN UP
app.post('/signup', async (req, res) => {
  const { name, username, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [
          { name: name },
          { username: username },
        ],
      },
    });

    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Store new user
    const newUser = await prisma.user.create({
      data: {
        name: name,
        username: username,
        password: hashedPassword,
      },
    });

    res.json({ status: 'success', message: 'User created successfully', user: { username: newUser.username, email: newUser.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'An error occurred during signup' });
  }
});

// LOG IN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: email,
      },
    });

    if (user && await bcrypt.compare(password, user.password)) {
      // Passwords match
      res.json({ status: 'success', message: 'Authentication successful', name: user.username, coins: user.coins });
    } else {
      // Authentication failed
      res.json({ status: 'error', message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'An error occurred during login' });
  }
});

// LEADERBOARD ROUTE
app.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await prisma.user.findMany({
      orderBy: {
        coins: 'desc'
      },
      take: 10 // Adjust based on how many top players you want to fetch
    });
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SAVE USER
app.post('/user', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
  
  try {
    // Add password hashing here in a real app
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    res.json(newUser);
  } catch (error) {
    console.error("Failed to create user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Test route to fetch all users
app.get('/users', async (req, res) => {
  try {
      const users = await prisma.user.findMany();
      res.json(users);
  } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: "Internal server error" });
  }
});

async function awardCoin(winnerUserId) {
  try {
    const user = await prisma.user.update({
      where: { username: winnerUserId },
      data: { coins: { increment: 10 } }
    });
    return user;
  } catch (error) {
    console.error('Error creating game record:', error);
    throw error; // Or handle the error as appropriate for your application
  }
}

let playerCoins = [];

// Socket Connection
io.on("connection", (socket)=>{

  socket.on("registerPlayer", async (e)=>{
    if(e.name!=null){
      players.push(e.name);
      playerCoins.push(e.coins);
      specialCards.push(e.specialCards);
        landmarksSelected = true;
        io.to(socket.id).emit("allowLandmarkSelection", {landmarks});
      if(players.length===3){

        let p1obj={
          p1_name: players[0],
          p1_score: 0,
          numOfSpecialCards:0,
        }
        let p2obj={
          p2_name: players[1],
          p2_score: 0,
          numOfSpecialCards: 0,
        }
        let p3obj={
          p3_name: players[2],
          p3_score: 0,
          numOfSpecialCards: 0,
        }
        let obj = {
          p1: p1obj,
          p2: p2obj,
          p3: p3obj
        }
        playingArray.push(obj);
        // players.splice(0,3);
        io.emit("registerPlayer", {allPlayers: playingArray})
        // Call this function to start the first turn

        // Notify the current player that their turn has started
        io.to(socketIDea[currentTurn]).emit('yourTurn', { message: 'It\'s your turn!', turnEndsIn: turnDuration });
        turnDuration = normalTurn;
        // io.to(socketIDea[0]).emit('yourTurn', { message: 'It\'s your turn!' });
      }
    }
  });
  // Listen for the first player's landmark selection
  socket.on('selectLandmarks', (landmarkss) => {
    if (landmarksSelected) {
        // Update server state
        landmarksSelected = true;
        let p1_id = landmarkss.id.c1_id
        let p2_id = landmarkss.id.c2_id
        let p3_id = landmarkss.id.c3_id
        let obj = {
          c1: p1_id,
          c2: p2_id,
          c3: p3_id
        }
        selectedLandmarks = obj;
        landmarkerCarders.push(selectedLandmarks);
        const joinCode = Math.floor(1000 + Math.random() * 9000).toString();
        socketIDea.push(socket.id);
        // Broadcast the selected landmarks to all clients
        if(players.length==1){
          io.emit('landmarksSelected', {playerCards: selectedLandmarks, player1: true, code: joinCode, socketId: socketIDea[0], landmarks});
          io.emit("updatePlayerArray", socketIDea[0]);
        }
        else if(players.length==2){
          io.to(socketIDea[1]).emit('landmarksSelected', {playerCards: landmarkerCarders[1], player1: players.length, code: joinCode, socketId: socketIDea[1], landmarks})
          io.emit("updatePlayerArray", socketIDea[1]);
        }
        else if(players.length==3){
          io.to(socketIDea[2]).emit('landmarksSelected', {playerCards: landmarkerCarders[2], player1: players.length, code: joinCode, socketId: socketIDea[2], landmarks})
          io.emit("updatePlayerArray", socketIDea[2]);
        }
    }
  });

  socket.on("changeUI", ()=>{
    io.to(socketIDea[0]).emit("changingUI");
    io.to(socketIDea[1]).emit("changingUI");
    io.to(socketIDea[2]).emit("changingUI");
  })

  socket.on("updateScore", (scores)=>{
    playerScore.player1_score+=scores.p1_score
    playerScore.player2_score+=scores.p2_score
    playerScore.player3_score+=scores.p3_score
    totalTurns++;
    if(scores.turn==1){
      io.to(socketIDea[0]).emit("updatingScore", {turn: scores.turn, p1_score: scores.p1_score, p2_score: 0, p3_score: 0, socketId: socket.id,playerScore: playerScore})
      io.to(socketIDea[1]).emit("updatingScore", {turn: true, p1_score: 0, p2_score:  scores.p1_score, p3_score: 0, socketId: socket.id,playerScore: playerScore})
      io.to(socketIDea[2]).emit("updatingScore", {turn: scores.turn, p1_score: 0, p2_score: scores.p1_score, p3_score: 0, socketId: socket.id,playerScore: playerScore})
      
      io.to(socketIDea[currentTurn]).emit('turnEnded', { message: 'Your turn has ended.' });
      // Move to the next player
      currentTurn = (currentTurn + 1) % socketIDea.length;
      
      if(turnLimiter[currentTurn]==true){
        turnDuration = turnDuration-timeReducedTo;
        turnLimiter[currentTurn] = false;
      }
      // Notify the current player that their turn has started
      io.to(socketIDea[currentTurn]).emit('yourTurn', { message: 'It\'s your turn!', turnEndsIn: turnDuration });
      turnDuration = normalTurn;
    }
    if(scores.turn==2){
      io.to(socketIDea[0]).emit("updatingScore", {turn: scores.turn, p1_score: 0, p2_score: scores.p2_score, p3_score: 0, socketId: socket.id,playerScore: playerScore})
      io.to(socketIDea[1]).emit("updatingScore", {turn: scores.turn, p1_score: scores.p2_score, p2_score: 0, p3_score: 0, socketId: socket.id,playerScore: playerScore})
      io.to(socketIDea[2]).emit("updatingScore", {turn: true, p1_score: 0, p2_score: 0, p3_score: scores.p2_score, socketId: socket.id,playerScore: playerScore})
      
      io.to(socketIDea[currentTurn]).emit('turnEnded', { message: 'Your turn has ended.' });
      // Move to the next player
      currentTurn = (currentTurn + 1) % socketIDea.length;
      
      if(turnLimiter[currentTurn]==true){
        turnDuration = turnDuration-timeReducedTo;
        turnLimiter[currentTurn] = false;
      }

      // Notify the current player that their turn has started
      io.to(socketIDea[currentTurn]).emit('yourTurn', { message: 'It\'s your turn!', turnEndsIn: turnDuration });
      turnDuration = normalTurn;
    }
    if(scores.turn==3){
      io.to(socketIDea[0]).emit("updatingScore", {turn: true, p1_score: 0, p2_score: 0, p3_score: scores.p3_score, socketId: socket.id,playerScore: playerScore})
      io.to(socketIDea[1]).emit("updatingScore", {turn: scores.turn, p1_score: 0, p2_score: 0, p3_score: scores.p3_score, socketId: socket.id, playerScore: playerScore})
      io.to(socketIDea[2]).emit("updatingScore", {turn: scores.turn, p1_score: scores.p3_score, p2_score: 0, p3_score: 0, socketId: socket.id, playerScore: playerScore})
      
      io.to(socketIDea[currentTurn]).emit('turnEnded', { message: 'Your turn has ended.' });
      // Move to the next player
      currentTurn = (currentTurn + 1) % socketIDea.length;
      
      if(turnLimiter[currentTurn]==true){
        turnDuration = turnDuration-timeReducedTo;
        turnLimiter[currentTurn] = false;
      }
      
      // Notify the current player that their turn has started
      io.to(socketIDea[currentTurn]).emit('yourTurn', { message: 'It\'s your turn!', turnEndsIn: turnDuration });
      turnDuration = normalTurn;
    }
    if(totalTurns==15){
      let winner;
      if(playerScore.player1_score>playerScore.player2_score && playerScore.player1_score>playerScore.player3_score){
        winner = players[0];
        io.to(socketIDea[currentTurn]).emit('turnEnded', { message: 'Your turn has ended.', endGame: "true" });
      }else if(playerScore.player2_score>playerScore.player1_score && playerScore.player2_score>playerScore.player3_score){
        winner = players[1]
        io.to(socketIDea[currentTurn]).emit('turnEnded', { message: 'Your turn has ended.' });
      }else if(playerScore.player3_score>playerScore.player1_score && playerScore.player3_score>playerScore.player2_score){
        winner = players[2]
        io.to(socketIDea[currentTurn]).emit('turnEnded', { message: 'Your turn has ended.' });
      }else{
        console.log("Match Tied");
        io.emit("matchTied");
        return;
      }
      awardCoin(winner)
        .then(user => {
          console.log(user, " updated");
        })
        .catch(error => {
          console.log(error, " couldnot!");
        });
      updateWinningScore(winner)
      .then(gameRecord => {
        console.log(gameRecord, " added");
      })
      .catch(error => {
        console.log(error, " couldnot!");
        });
      io.emit("announceScores", winner);
    }
  })

  socket.on("triviaQuestion", (trivia)=>{
    io.to(trivia.playersID).emit("triviaQuestion", (trivia));
  })

  socket.on('answerTrivia', ({ playerId, answer, correctAnswer}) => {
    // Validate the player's answer
    if (answer === correctAnswer) {
        // Answer is correct, update player's score
        if(playerId==socketIDea[0]){
          io.to(socketIDea[0]).emit("appearRandomCard");
        }
        else if(playerId==socketIDea[1]){
          io.to(socketIDea[1]).emit("appearRandomCard");
        }
        else if(playerId==socketIDea[2]){
          io.to(socketIDea[2]).emit("appearRandomCard");
        }
    } else {
        console.log("Wrong Answer!");
    }
  });

  // Listen for an event when a player uses a coin to pass their turn
  socket.on('useCoin', async (userId) => {
    try {
      // Check the user's current coin count to ensure they have at least one coin
      const user = await prisma.user.findFirst({ where: { username: userId.name } });
      if (user && user.coins > 0) {
        // Use Prisma to decrement the user's coin count
        const updatedUser = await prisma.user.update({
          where: { username: userId.name },
          data: { coins: { decrement: 1 } },
        });
        // Emit an event to update the client-side UI
        io.emit('updateCoins', { userId: userId, coins: updatedUser.coins });
      } else {
        // Optionally, notify the user they don't have enough coins
        socket.emit('notEnoughCoins', { userId: userId });
      }
    } catch (error) {
      console.error('Error using coin:', error);
    }
  });

  socket.on("useSpecialCard", (socketIdentifier)=>{
    io.to(socketIdentifier.socketId).emit("usingSpecialCard", {socketId: socketIdentifier.socketId, AllLandmarks: landmarkerCarders})
  })

  socket.on("replaceCard", (cardToReplace)=>{
    let {cardIndex, id, value, text, cardToReplaceId} = cardToReplace;
  
    let newCardNumberToReplace;
    
    if(cardIndex<3){
      if(cardIndex==0){
        newCardNumberToReplace = landmarkerCarders[0].c1;
        for(let i=0; i<3; i++){
          let newsArray = landmarkerCarders[i];
          if(newsArray.c1 == value){
            newsArray.c1 = newCardNumberToReplace;
            landmarkerCarders[0].c1 = value;
            break;
          }else if(newsArray.c2 == value){
            newsArray.c2 = newCardNumberToReplace;
            landmarkerCarders[0].c1 = value;
            break;
          }else if(newsArray.c3 == value){
            newsArray.c3 = newCardNumberToReplace;
            landmarkerCarders[0].c1 = value;
            break;
          }
        }
      }else if(cardIndex==1){
        newCardNumberToReplace = landmarkerCarders[0].c2;
        for(let i=0; i<3; i++){
          let newsArray = landmarkerCarders[i];
          if(newsArray.c1 == value){
            newsArray.c1 = newCardNumberToReplace;
            landmarkerCarders[0].c2 = value;
            break;
          }else if(newsArray.c2 == value){
            newsArray.c2 = newCardNumberToReplace;
            landmarkerCarders[0].c2 = value;
            break;
          }else if(newsArray.c3 == value){
            newsArray.c3 = newCardNumberToReplace;
            landmarkerCarders[0].c2 = value;
            break;
          }
        }
      }else if(cardIndex==2){
        newCardNumberToReplace = landmarkerCarders[0].c3;
        for(let i=0; i<3; i++){
          let newsArray = landmarkerCarders[i];
          if(newsArray.c1 == value){
            newsArray.c1 = newCardNumberToReplace;
            landmarkerCarders[0].c3 = value;
            break;
          }else if(newsArray.c2 == value){
            newsArray.c2 = newCardNumberToReplace;
            landmarkerCarders[0].c3 = value;
            break;
          }else if(newsArray.c3 == value){
            newsArray.c3 = newCardNumberToReplace;
            landmarkerCarders[0].c3 = value;
            break;
          }
        }
      }
    }else if(cardIndex>2 && cardIndex<6){
      if(cardIndex==3){
        newCardNumberToReplace = landmarkerCarders[1].c1;
        for(let i=0; i<3; i++){
          let newsArray = landmarkerCarders[i];
          if(newsArray.c1 == value){
            newsArray.c1 = newCardNumberToReplace;
            landmarkerCarders[1].c1 = value;
            break;
          }else if(newsArray.c2 == value){
            newsArray.c2 = newCardNumberToReplace;
            landmarkerCarders[1].c1 = value;
            break;
          }else if(newsArray.c3 == value){
            newsArray.c3 = newCardNumberToReplace;
            landmarkerCarders[1].c1 = value;
            break;
          }
        }
      }else if(cardIndex==4){
        newCardNumberToReplace = landmarkerCarders[1].c2;
        for(let i=0; i<3; i++){
          let newsArray = landmarkerCarders[i];
          if(newsArray.c1 == value){
            newsArray.c1 = newCardNumberToReplace;
            landmarkerCarders[1].c2 = value;
            break;
          }else if(newsArray.c2 == value){
            newsArray.c2 = newCardNumberToReplace;
            landmarkerCarders[1].c2 = value;
            break;
          }else if(newsArray.c3 == value){
            newsArray.c3 = newCardNumberToReplace;
            landmarkerCarders[1].c2 = value;
            break;
          }
        }
      }else if(cardIndex==5){
        newCardNumberToReplace = landmarkerCarders[1].c3;
        for(let i=0; i<3; i++){
          let newsArray = landmarkerCarders[i];
          if(newsArray.c1 == value){
            newsArray.c1 = newCardNumberToReplace;
            landmarkerCarders[1].c3 = value;
            break;
          }else if(newsArray.c2 == value){
            newsArray.c2 = newCardNumberToReplace;
            landmarkerCarders[1].c3 = value;
            break;
          }else if(newsArray.c3 == value){
            newsArray.c3 = newCardNumberToReplace;
            landmarkerCarders[1].c3 = value;
            break;
          }
        }
      }
    }else{
      if(cardIndex==6){
        newCardNumberToReplace = landmarkerCarders[2].c1;
        for(let i=0; i<3; i++){
          let newsArray = landmarkerCarders[i];
          if(newsArray.c1 == value){
            newsArray.c1 = newCardNumberToReplace;
            landmarkerCarders[2].c1 = value;
            break;
          }else if(newsArray.c2 == value){
            newsArray.c2 = newCardNumberToReplace;
            landmarkerCarders[2].c1 = value;
            break;
          }else if(newsArray.c3 == value){
            newsArray.c3 = newCardNumberToReplace;
            landmarkerCarders[2].c1 = value;
            break;
          }
        }
      }else if(cardIndex==7){
        newCardNumberToReplace = landmarkerCarders[2].c2;
        for(let i=0; i<3; i++){
          let newsArray = landmarkerCarders[i];
          if(newsArray.c1 == value){
            newsArray.c1 = newCardNumberToReplace;
            landmarkerCarders[2].c2 = value;
            break;
          }else if(newsArray.c2 == value){
            newsArray.c2 = newCardNumberToReplace;
            landmarkerCarders[2].c2 = value;
            break;
          }else if(newsArray.c3 == value){
            newsArray.c3 = newCardNumberToReplace;
            landmarkerCarders[2].c2 = value;
            break;
          }
        }
      }else if(cardIndex==8){
        newCardNumberToReplace = landmarkerCarders[2].c3;
        for(let i=0; i<3; i++){
          let newsArray = landmarkerCarders[i];
          if(newsArray.c1 == value){
            newsArray.c1 = newCardNumberToReplace;
            landmarkerCarders[2].c3 = value;
            break;
          }else if(newsArray.c2 == value){
            newsArray.c2 = newCardNumberToReplace;
            landmarkerCarders[2].c3 = value;
            break;
          }else if(newsArray.c3 == value){
            newsArray.c3 = newCardNumberToReplace;
            landmarkerCarders[2].c3 = value;
            break;
          }
        }
      }
    }
    if(cardIndex<3){
      io.to(socketIDea[0]).emit("replacingCard", {cardIndex, id, value, text, cardToReplaceId});
    }
    else if(cardIndex<6){
      io.to(socketIDea[1]).emit("replacingCard", {cardIndex, id, value, text, cardToReplaceId});
    }else{
      io.to(socketIDea[2]).emit("replacingCard", {cardIndex, id, value, text, cardToReplaceId});    
    }
  })

  socket.on("choosePlayerNegotiation", (playerObject)=>{
    let {socket_Id, sendToName,senderName, negotiationCard } = playerObject;

    let socketToSendTo;
    if(sendToName==players[0])
      socketToSendTo = socketIDea[0];
    else if(sendToName==players[1])
      socketToSendTo = socketIDea[1];
    else if(sendToName==players[2])
      socketToSendTo = socketIDea[2];

    io.to(socketToSendTo).emit("updatingNegotiation", {negotiationCard: negotiationCard, sendToName, senderName, offerSender: socket_Id});
  })

  socket.on("negotiationResponse", (flag)=>{
    let {response, negotiator, offerReceiver, cardInResponse,recieverName, negotiationCard} = flag;

    if(response){
      io.to(negotiator).emit("acceptanceOffer", {offerReceiver, cardInResponse, recieverName,negotiationCardy: negotiationCard});
      changeValue(cardInResponse.value, negotiationCard.value);
    }else
    io.to(negotiator).emit("rejectionOffer");
  })
  socket.on("cardReplacer", (replacerCardData)=>{
    let {offerReceiver,cardInResponse, negotiationCard} = replacerCardData;
    io.to(offerReceiver).emit("cardReplacing", {cardInResponse, negotiationCard})
  })

  socket.on("nextTurn", ()=>{
    io.to(socketIDea[currentTurn]).emit('turnEnded', { message: 'Your turn has ended.' });
    
    // Move to the next player
    currentTurn = (currentTurn + 1) % socketIDea.length;
  
    if(turnLimiter[currentTurn]==true){
      turnDuration = turnDuration-timeReducedTo;
      turnLimiter[currentTurn] = false;
    }

    // Notify the current player that their turn has started
    io.to(socketIDea[currentTurn]).emit('yourTurn', { message: 'It\'s your turn!', turnEndsIn: turnDuration });    
    turnDuration = normalTurn;
  })

  socket.on("timeReducer", ({reduceTimeFor, timeReduceTo})=>{
    timeReducedTo = timeReduceTo;
    if(reduceTimeFor == socketIDea[0]){
      turnLimiter[0] = true;
    }else if(reduceTimeFor == socketIDea[1]){
      turnLimiter[1] = true;
    }else{
      turnLimiter[2] = true;
    }
  })
})

const changeValue = (cardInResponseValue, negotiationCardValue)=>{
  
  let arrayToCheckFor1;
  let arrayToCheckFor2; 
  
  for(let i=0; i<3; i++){
    let newsArray = landmarkerCarders[i];
    if(newsArray.c1==cardInResponseValue || newsArray.c2==cardInResponseValue || newsArray.c3==cardInResponseValue){
      arrayToCheckFor1 = i;
    }
    if(newsArray.c1==negotiationCardValue || newsArray.c2==negotiationCardValue || newsArray.c3==negotiationCardValue){
      arrayToCheckFor2 = i;
    }
  }

  let newArray1 = landmarkerCarders[arrayToCheckFor1];
  let newArray2 = landmarkerCarders[arrayToCheckFor2];

  if(newArray1.c1==cardInResponseValue){
    landmarkerCarders[arrayToCheckFor1].c1 = negotiationCardValue;
  }else if(newArray1.c2==cardInResponseValue){
    landmarkerCarders[arrayToCheckFor1].c2 = negotiationCardValue;
  }else if(newArray1.c3==cardInResponseValue){
    landmarkerCarders[arrayToCheckFor1].c3 = negotiationCardValue;
  }

  if(newArray2.c1==negotiationCardValue){
    landmarkerCarders[arrayToCheckFor2].c1 = cardInResponseValue;
  }else if(newArray2.c2==negotiationCardValue){
    landmarkerCarders[arrayToCheckFor2].c2 = cardInResponseValue;
  }else if(newArray2.c3==negotiationCardValue){
    landmarkerCarders[arrayToCheckFor2].c3 = cardInResponseValue;
  }
}

let timeReducedTo;

async function  updateWinningScore(userId) {
  try {
    // Upsert a game record: create if it doesn't exist, or increment the score if it does
    const gameRecord = await prisma.game.upsert({
      where: {
        userId: userId, // Assuming `userId` is unique for the game record
      },
      update: {
        score: {
          increment: 1, // Increment the score by the points earned
        },
      },
      create: {
        userId: userId,
        score: 1, // Start with the points earned if the record doesn't exist
      },
    });

    console.log('Game record upserted:', gameRecord);
    return gameRecord;
  } catch (error) {
    console.error('Error upserting game record:', error);
    throw error;
  }
}

const port = process.env.PORT || 3000
server.listen(port, () => console.log(`Server listening`));