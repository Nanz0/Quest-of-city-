const socket = io(); // Connect to the server
let landmarks;

let playerId = []
let JoinCode = "";
let flag = true;
let isPaused = false;
let triviaFlag = true;
let hiddenClueCard = null;
let selectedClueCard = null;
let score_p1 = 0, score_p2 = 0, score_p3 = 0; // Initial scores
let indice = 12; // Assuming this is your starting index for hidden clue cards
let hiddenClueCards = document.querySelectorAll('.clue-card'); // Your hidden clue cards collection
// let hiddenClueCard = hiddenClueCards[indice];
const arr = [];
let cluesPool = []; // Pool of clues with landmark index
let newCluesPool = [];
let coins = [];
let currentPlayerName;
let innerContainer;
let cardIndex;
let selectedLandmarkies;
let updatedLandmarks;
let cardToReplace;
let replacementIndex;
let turnTimer;
let negotiationCard;
let negotiator;

const button = document.querySelector(".shuffleBtn");
const idkButton = document.querySelector(".match-container");
const negotiateBtn = document.getElementById('negotiate-btn');
const negotiationArea = document.getElementById('negotiation-area');
const user1Cards = document.querySelectorAll(".user-1");
const clueCards = document.querySelectorAll('.clue-card');
const specialCardDiv = document.querySelector("#player-leftbar"); 
const random_event = document.getElementById("random-event");

document.getElementById('signup-user').addEventListener('click', function() {
    document.getElementById('signup-div').classList.remove('hidden');
    document.getElementById('signup-user').classList.add('hidden');
    document.getElementById('login-user').classList.add('hidden');
});

document.getElementById('login-user').addEventListener('click', function() {
    document.getElementById('signup-div').classList.add('hidden');
    document.getElementById('signup-user').classList.add('hidden');
    document.getElementById('login-user').classList.add('hidden');
    document.getElementById('authForm').classList.remove('hidden');
    
});

document.getElementById("signupForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    try {
      const response = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, username, password }),
      });
  
      const data = await response.json();
  
      const messageElement = document.getElementById("signupMessage");
      if (data.status === 'success') {
        const login_user = document.getElementById("login-user")
        login_user.classList.remove("hidden");
        document.getElementById("signup-div").appendChild(login_user)
        messageElement.textContent = data.message;
        messageElement.style.color = "green";
      } else {
        messageElement.textContent = data.message;
        messageElement.style.color = "red";
      }
    } catch (error) {
      console.error('Signup error:', error);
    }
  });

document.getElementById('createGame').addEventListener('click', function() {
    document.getElementById('createGame').classList.add('hidden');
    document.getElementById('joinGame').classList.add('hidden');
    document.getElementById("player-sidebar").style.display = "block";
    currentPlayerName = document.querySelector(".user-name").textContent;
    socket.emit("registerPlayer", { name: currentPlayerName, coins: document.querySelector("#coin-balance").textContent });
});

document.getElementById('joinGame').addEventListener('click', function() {
    document.getElementById('createGame').classList.add('hidden');
    document.getElementById('joinGame').classList.add('hidden');
    const formDiv = document.getElementById("authForm");

    formDiv.innerHTML = ""; 
    formDiv.classList.remove("hidden");
    
    const joinForm = document.getElementById("joinForm");
    joinForm.classList.remove("hidden");
    formDiv.appendChild(joinForm);
    document.getElementById("player-sidebar").style.display = "block";
});

document.getElementById("joinForm").addEventListener("submit", function(event){
    event.preventDefault();
    const codeVal = document.getElementById("code").value;
    if(JoinCode == codeVal){
        currentPlayerName = document.querySelector(".user-name").textContent;
        document
        .querySelector("#joinForm>h6")
        .classList.remove("hidden");
        socket.emit("registerPlayer", { name: currentPlayerName, coins: document.querySelector("#coin-balance").textContent})
    }else{
        document.getElementById("code").classList.add("error-input");
    }
})

socket.on('landmarksSelected', (landmarkers) => {
    if(landmarkers.player1===true){
        JoinCode = landmarkers.code;
        const formButton = document.querySelector('#landmarkForm>button');
        document.getElementById('landmarkForm').innerHTML = "";
        document.getElementById('landmarkForm').appendChild(formButton);
        document.querySelector("#landmarkSelection>h4").textContent = `Share the code ${JoinCode} players to Join`;
    }else if(landmarkers.player1==3){
        socket.emit("changeUI");
    }
    landmarks = landmarkers.landmarks;
    updateLandmarkCards(landmarkers);

    if(landmarkers.socketId==socket.id){
        document.querySelector("#player-sidebar").style.display = "none";
        document.getElementById('landmarkForm').innerHTML = "";
    }
    assignCluesToCards(landmarks, 22);
    assignCluesToUserCards(3);    
});

function updateLandmarkCards(selectedLandmarkies) {
    document.querySelector("#player-leftbar").style.display = "block";
    const container = document.querySelector('.card-container');
    // Clear existing cards
    container.innerHTML = '';
    selectedLandmarkies = [selectedLandmarkies.playerCards.c1, selectedLandmarkies.playerCards.c2, selectedLandmarkies.playerCards.c3];
    // Add new cards for each selected landmark
    selectedLandmarkies.forEach((landmarkNumber, index) => {
        if(index!=3){
            const card = document.createElement('button');
            const span = document.createElement("span");
            span.className = "landmark-name";
            card.className = 'landmark-card fade-in';
            card.id = landmarks[landmarkNumber].id;
            card.value = landmarkNumber;
            span.textContent = card.id;
            card.appendChild(span);
            container.appendChild(card);
        }
    });
}

socket.on("updatePlayerArray", (socket_Id)=>{
    playerId.push(socket_Id);
})

// Function to assign clues to cards
function assignCluesToUserCards(cardCount = 22) {
    shuffle(cluesPool); // Shuffle the pool to ensure randomness

    for(let i=0; i<3; i++){
        const card = user1Cards[i];
        const cluePair = cluesPool[i % cluesPool.length]; // Cycle through cluesPool if less than cardCount
        card.value = cluePair.clue; // Set card text to the clue
        card.id = `${cluePair.index}`; // Set card ID to the landmark index
        card.textContent = cluePair.clue;
        if(cluesPool.length==0){
            cluesPool = newCluesPool;
            shuffle(cluesPool); 
        }
        cluesPool.splice(i % cluesPool.length,1)
    }
}

// Function to assign clues to cards
function assignCluesToCards(landmarks, cardCount = 22) {
    const cards = hiddenClueCards;

    // Ensure there are enough clues to fill the cards
    landmarks.forEach((landmark, index) => {
        shuffle(landmark.clues); // Shuffle clues for randomness
        landmark.clues.forEach(clue => {
            cluesPool.push({ clue, index }); // Pair clue with its landmark index
        });
    });

    shuffle(cluesPool); // Shuffle the pool to ensure randomness

    // Assign clues to each card
    for (let i = 0; i < cardCount-9; i++) {
        const card = cards[i];
        const cluePair = cluesPool[i % cluesPool.length]; // Cycle through cluesPool if less than cardCount
        card.value = cluePair.clue; // Set card text to the clue
        card.id = `${cluePair.index}`; // Set card ID to the landmark index
        if(cluesPool.length==0){
            cluesPool = newCluesPool;
            shuffle(cluesPool); 
        }
        newCluesPool.push(cluesPool.splice(i % cluesPool.length,1))
    }
    hiddenClueCards = cards;
}

socket.on("allowLandmarkSelection", (landmarkss) => { 
    
    landmarks = landmarkss.landmarks;

    document.getElementById("authForm").classList.add("hidden");
    document.querySelector(".cont").style.paddingTop = "50px";
    // document.getElementById("errorMessage").classList.add("hidden");
    document.getElementById("username").classList.remove("error-input");
    document.getElementById("password").classList.remove("error-input");
    document.getElementById("landmarkSelection").classList.remove("hidden");
    // Show landmark selection UI to the first player
    populateLandmarkForm(landmarks);
});

function populateLandmarkForm(landmarkss) {
    const form = document.getElementById('landmarkForm');
    const div = document.createElement("div");
    div.style.display = "flex";
    landmarkss.forEach((landmark, index) => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = index
        checkbox.name = 'landmarks';
        checkbox.value = landmark.name;
        checkbox.addEventListener('change', enforceCheckboxLimit);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(landmark.name));
        form.appendChild(label);
    });
}

// Enforce the limit of 3 selections
function enforceCheckboxLimit() {
    const selectedLandmarks = document.querySelectorAll('#landmarkForm input[type="checkbox"]:checked');   

    if (selectedLandmarks.length == 3) {
        console.log(selectedLandmarks);
        document.querySelector("#landmarkSelectionBtn").addEventListener('click', function(){
            // event.preventDefault();
            socket.emit('selectLandmarks', {id: {c1_id: selectedLandmarks[0].id, c2_id: selectedLandmarks[1].id, c3_id: selectedLandmarks[2].id}});
        })
    }
    else if(selectedLandmarks.length > 3){
        this.checked = false;
    }else{
        const card = document.querySelector("#landmarkSelectionBtn");
        // Clone the button
        const clonedButton = card.cloneNode(true);
    
        // Replace the original button with its clone
        card.parentNode.replaceChild(clonedButton, card);
        
    }
}

socket.on("changingUI", ()=>{
    // Hide selection UI and update game state with selected landmarks
    document.getElementById('landmarkSelection').classList.add("hidden");
    document.querySelector(".container-fluid").classList.remove("hidden");
    document.querySelector(".cont").classList.add("hidden");
    document.querySelector(".user-coin").textContent = document.querySelector("#coin-balance").textContent;
    if(playerId[0]==socket.id){
        button.clickHandler = shuffleBtnEventHandler;
        button.addEventListener("click", shuffleBtnEventHandler);

        let coinCount = Number(document.querySelector("#special-cards").textContent)
        if(coinCount>0){
            specialCardDiv.clickHandler = specialDivEventHandler;
            specialCardDiv.addEventListener("click",specialDivEventHandler)
        }
    }
    // document.getElementById("negotiation-area").style.display = "block";
})

const specialDivEventHandler = ()=>{
    if(Number(document.getElementById('num-special-cards').textContent)<=0){
        document.querySelector("#player-leftbar").style.backgroundColor = "grey";
        console.log("NOt Enough Cards!");
        return;
    }
    document.querySelector("#name-tag-div").style.visibility = "visible";

    if(socket.id == playerId[0]){
        socket.emit("useSpecialCard", {socketId: playerId[0]});
    }else if(socket.id == playerId[1]){
        socket.emit("useSpecialCard", {socketId: playerId[1]})
    }else if(socket.id == playerId[2]){
        socket.emit("useSpecialCard", {socketId: playerId[2]})
    }
    specialCardDiv.clickHandler = null;
    specialCardDiv.removeEventListener("click", specialDivEventHandler);
    button.clickHandler = null;
    button.removeEventListener("click", shuffleBtnEventHandler)
    hiddenClueCards.forEach((card)=>{
        card.clickHandler = null;
        card.removeEventListener("click", handleClueCardClick);
    })
}

socket.on("usingSpecialCard", (socketIdentifier)=>{
    if(socketIdentifier.socketId == playerId[0]){
        updatedLandmarks = socketIdentifier.AllLandmarks;
        cardIndex = 0;
        const container = document.querySelector('.card-container');
        innerContainer = container.innerHTML;
        container.innerHTML = "";
        selectedLandmarkies = [socketIdentifier.AllLandmarks[1].c1, socketIdentifier.AllLandmarks[1].c2, socketIdentifier.AllLandmarks[1].c3];
        // Add new cards for each selected landmark
        selectedLandmarkies.forEach((landmarkNumber, index) => {
            if(index!=3){
                const card = document.createElement('button');
                const span = document.createElement("span");
                span.className = "landmark-name";
                card.className = 'landmark-card fade-in';
                card.id = landmarks[landmarkNumber].id;
                card.value = landmarkNumber;
                span.textContent = card.id;
                card.clickHandler = addReplacementListener;
                card.addEventListener("click", addReplacementListener);
                card.appendChild(span);
                container.appendChild(card);
            }
        });
        selectedLandmarkies = [socketIdentifier.AllLandmarks[2].c1, socketIdentifier.AllLandmarks[2].c2, socketIdentifier.AllLandmarks[2].c3];
        // Add new cards for each selected landmark
        selectedLandmarkies.forEach((landmarkNumber, index) => {
            if(index!=3){
                const card = document.createElement('button');
                const span = document.createElement("span");
                span.className = "landmark-name";
                card.className = 'landmark-card fade-in';
                card.id = landmarks[landmarkNumber].id;
                card.value = landmarkNumber;
                span.textContent = card.id;
                card.clickHandler = addReplacementListener;
                card.addEventListener("click", addReplacementListener);
                card.appendChild(span);
                container.appendChild(card);
            }
        });
    }else if(socketIdentifier.socketId == playerId[1]){
        updatedLandmarks = socketIdentifier.AllLandmarks;
        cardIndex = 1;
        const container = document.querySelector('.card-container');
        innerContainer = container.innerHTML;
        container.innerHTML = "";
        selectedLandmarkies = [socketIdentifier.AllLandmarks[0].c1, socketIdentifier.AllLandmarks[0].c2, socketIdentifier.AllLandmarks[0].c3];
        // Add new cards for each selected landmark
        selectedLandmarkies.forEach((landmarkNumber, index) => {
            if(index!=3){
                const card = document.createElement('button');
                const span = document.createElement("span");
                span.className = "landmark-name";
                card.className = 'landmark-card fade-in';
                card.id = landmarks[landmarkNumber].id;
                card.value = landmarkNumber;
                span.textContent = card.id;
                card.clickHandler = addReplacementListener;
                card.addEventListener("click", addReplacementListener);
                card.appendChild(span);
                container.appendChild(card);
            }
        });
        selectedLandmarkies = [socketIdentifier.AllLandmarks[2].c1, socketIdentifier.AllLandmarks[2].c2, socketIdentifier.AllLandmarks[2].c3];
        // Add new cards for each selected landmark
        selectedLandmarkies.forEach((landmarkNumber, index) => {
            if(index!=3){
                const card = document.createElement('button');
                const span = document.createElement("span");
                span.className = "landmark-name";
                card.className = 'landmark-card fade-in';
                card.id = landmarks[landmarkNumber].id;
                card.value = landmarkNumber;
                span.textContent = card.id;
                card.clickHandler = addReplacementListener;
                card.addEventListener("click", addReplacementListener);
                card.appendChild(span);
                container.appendChild(card);
            }
        });
    } else if(socketIdentifier.socketId == playerId[2]){
        updatedLandmarks = socketIdentifier.AllLandmarks;
        cardIndex = 2;
        const container = document.querySelector('.card-container');
        innerContainer = container.innerHTML;
        container.innerHTML = "";
        selectedLandmarkies = [socketIdentifier.AllLandmarks[0].c1, socketIdentifier.AllLandmarks[0].c2, socketIdentifier.AllLandmarks[0].c3];
        // Add new cards for each selected landmark
        selectedLandmarkies.forEach((landmarkNumber, index) => {
            if(index!=3){
                const card = document.createElement('button');
                const span = document.createElement("span");
                span.className = "landmark-name";
                card.className = 'landmark-card fade-in';
                card.id = landmarks[landmarkNumber].id;
                card.value = landmarkNumber;
                span.textContent = card.id;
                card.clickHandler = addReplacementListener;
                card.addEventListener("click", addReplacementListener);
                card.appendChild(span);
                container.appendChild(card);
            }
        });
        selectedLandmarkies = [socketIdentifier.AllLandmarks[1].c1, socketIdentifier.AllLandmarks[1].c2, socketIdentifier.AllLandmarks[1].c3];
        // Add new cards for each selected landmark
        selectedLandmarkies.forEach((landmarkNumber, index) => {
            if(index!=3){
                const card = document.createElement('button');
                const span = document.createElement("span");
                span.className = "landmark-name";
                card.className = 'landmark-card fade-in';
                card.id = landmarks[landmarkNumber].id;
                card.value = landmarkNumber;
                span.textContent = card.id;
                card.clickHandler = addReplacementListener;
                card.addEventListener("click", addReplacementListener);
                card.appendChild(span);
                container.appendChild(card);
            }
        });
    }
    specialCardDiv.style.display = "none";
})

const addReplacementListener = (event)=>{
    const container = document.querySelector('.card-container');
    const cards = Array.from(container.children); // Convert the NodeList to an Array
    const targetCard = event.target;

    const cardIndexx = cards.indexOf(targetCard);
    if(cardIndex==0){
        cardIndex = cardIndexx+3;
    }else if(cardIndex==1 && cardIndexx<3){
        cardIndex = cardIndexx+0;
    }else if(cardIndex==1 && cardIndexx>2){
        cardIndex = cardIndexx+3;
    }else if(cardIndex==2){
        cardIndex = cardIndexx;
    }

    cardToReplace = event.target;
    container.innerHTML = innerContainer;

    const tempLandmarks = container.querySelectorAll(".landmark-card");
    tempLandmarks.forEach((card)=>{
        if(card){
            // Clone the button
            const clonedButton = card.cloneNode(true);
    
            // Replace the original button with its clone
            card.parentNode.replaceChild(clonedButton, card);
        }
    })

    container.querySelectorAll(".landmark-card")
    .forEach((card, index)=>{
        replacementIndex = index;
        card.clickHandler = replacementHandler
        card.addEventListener("click", replacementHandler)
    })
    document.querySelector("#name-tag-div").style.visibility = "hidden";
}

const replacementHandler = (event)=>{
    let event_id = event.target.id;
    let event_value = event.target.value;
    let event_text = event.target.querySelector("span").textContent
    event.target.id = cardToReplace.id;
    event.target.value = cardToReplace.value;
    event.target.querySelector("span").textContent = cardToReplace.id;
    socket.emit("replaceCard", {cardIndex: cardIndex, id: event_id, value: event_value, text: event_text, cardToReplaceId: cardToReplace.id, eventTarget: event.target, replacementIndex})

    button.clickHandler = shuffleBtnEventHandler;
    button.addEventListener("click", shuffleBtnEventHandler)

    if(selectedClueCard!=null || hiddenClueCard!=null){
        matchCard();
    }
    
    removeChooseCardEventHandlers(document.querySelectorAll(".landmark-card"));
    document.querySelectorAll(".landmark-card").forEach((card, index)=>{
        if(card){
            // Clone the button
            const clonedButton = card.cloneNode(true);
    
            // Replace the original button with its clone
            card.parentNode.replaceChild(clonedButton, card);
            card.clickHandler = onLandmarkClick;
            card.addEventListener("click", onLandmarkClick);
        }
    })
    if(hiddenClueCard){
        hiddenClueCard.clickHandler = handleClueCardClick;
        hiddenClueCard.addEventListener("click", handleClueCardClick);
    }
    hiddenClueCards.forEach((card)=>{
        card.clickHandler = handleClueCardClick;
        card.addEventListener("click", handleClueCardClick);
    })
}

socket.on("replacingCard", (cardInfo)=>{
    let {cardIndex, id, value, text, cardToReplaceId} = cardInfo;
    cardToReplace = document.querySelector("#"+cardToReplaceId);
    cardToReplace.id = id;
    cardToReplace.value = value;
    cardToReplace.querySelector("span").textContent = text;
})

socket.on("updatingScore", (scores)=>{
    let num1 = Number(document.querySelector(".p1_badge").textContent)
    let num2 = Number(document.querySelector(".p2_badge").textContent)
    let num3 = Number(document.querySelector(".p3_badge").textContent)
    num1+= scores.p1_score;
    num2+= scores.p2_score;
    num3+= scores.p3_score;
    score_p1 = scores.playerScore.player1_score
    score_p2 = scores.playerScore.player2_score
    score_p3 = scores.playerScore.player3_score
    
    document.querySelector(".p1_badge").textContent = num1;
    document.querySelector(".p2_badge").textContent = num2;
    document.querySelector(".p3_badge").textContent = num3;
    
    if(triviaFlag){
        if(score_p1%2==0 && score_p1>0 && score_p1!=0 && playerId[0]==socket.id){
            socket.emit('triviaQuestion', { playersID: playerId[0], question: landmarks[Math.floor(Math.random()*13)].trivia}); // Simplified for one question
            
            isPaused = !isPaused;
            hiddenClueCard.style.zIndex = "-1"
            triviaFlag = false;
        }
        else if(score_p2%2==0 && score_p2>0 && score_p2!=0 && playerId[1]==socket.id){
            socket.emit('triviaQuestion', { playersID: playerId[1], question: landmarks[Math.floor(Math.random()*13)].trivia}); // Simplified for one question
            
            isPaused = !isPaused;
            hiddenClueCard.style.zIndex = "-1";
            triviaFlag = false;
        }
        else if(score_p3%2==0 && score_p3>0 && score_p3!=0 && playerId[2]==socket.id){
            socket.emit('triviaQuestion', { playersID: playerId[2], question: landmarks[Math.floor(Math.random()*13)].trivia}); // Simplified for one question
            
            isPaused = !isPaused;
            hiddenClueCard.style.zIndex = "-1";
            triviaFlag = false;
        }
    }
    if(scores.turn === true){
        document.querySelector(".user-name").style.backgroundColor = "gold";
        button.clickHandler = shuffleBtnEventHandler;
        button.addEventListener("click", shuffleBtnEventHandler);
        idkButton.clickHandler = dontKnowCard;
        idkButton.addEventListener("click", dontKnowCard);
        specialCardDiv.clickHandler = specialDivEventHandler;
        specialCardDiv.addEventListener("click",specialDivEventHandler);
    } 
})

socket.on('triviaQuestion', (triviaQ) => {
    document.getElementById("triviaQuestion").innerText = triviaQ.question.question;
    const options = triviaQ.question.options;
    const form = document.getElementById("triviaForm");
    form.innerHTML = ''; // Clear previous options

    // Dynamically create radio buttons for each option
    options.forEach((option, index) => {
        const label = document.createElement("label");
        const radioButton = document.createElement("input");
        radioButton.type = "radio";
        radioButton.name = "triviaOption";
        radioButton.value = option;
        label.appendChild(radioButton);
        label.appendChild(document.createTextNode(option));
        form.appendChild(label);
        form.appendChild(document.createElement("br")); // Line break for spacing
        form.style.zIndex = "5000";
    });

    document.getElementById("submitAnswer").onclick = function() {
        const selectedOption = document.querySelector('input[name="triviaOption"]:checked').value;
        // Emit the selected answer back to the server
        socket.emit('answerTrivia', { playerId: triviaQ.playersID, answer: selectedOption, correctAnswer: triviaQ.question.correctAnswer});
        // Show the modal
        document.getElementById("triviaModal").style.display = "none";
    };

    // Show the modal
    document.getElementById("triviaModal").style.display = "block";
});

while(arr.length < 22){
    let r = Math.floor(Math.random() * 22);
    if(arr.indexOf(r) === -1) arr.push(r);
}

// Shuffle function to randomize array elements
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

function shuffleBtnEventHandler() {
    document.querySelector(".deck-container").style.visibility = "visible";
    const all_cards = document.querySelectorAll(".clue-card");
    removeAllUserCardListeners(user1Cards);
    hiddenClueCard = null;
    selectedClueCard = null;
    
    if(flag){
        button.clickHandler = null;
        button.removeEventListener("click", shuffleBtnEventHandler);
        shuffleCards();
        let userContainer = document.querySelector(".user-cards");    
        userContainer.style.visibility = "visible";
        
        all_cards.forEach((card, index) => {
            card.style.visibility = "visible";

            // Calculate the center of the parent grid
            const gridCenterX = card.parentElement.offsetWidth / 2;

            const topPosition = 20; // You can adjust this value to change the top margin
            // Get the card's current position
            const rect = card.getBoundingClientRect();
            const cardX = rect.left - card.parentElement.getBoundingClientRect().left;
            // Calculate the translation needed to move the card to the top center of the grid
            const translateX = gridCenterX - cardX - card.offsetWidth / 2;
            const translateY = topPosition - rect.top + card.parentElement.getBoundingClientRect().top;
            // Apply the translation and rotation
            card.style.transform = `translate(${translateX}px, ${translateY}px)`;
            card.style.zIndex = 13; // Increase zIndex to ensure visibility during movement
            
            // After a delay, move the card sideways without flipping
            setTimeout(() => {
                const directionMultiplier = Math.pow(-1, index); // Will alternate between -1 and 1
                const moveSideways = 20 * directionMultiplier; // Adjust to move more or less to the side
                // Move the card to the right or left without flipping
                card.style.transform = `translate(${
                    translateX + moveSideways
                }px, ${translateY - 10}px)`;
                card.style.zIndex = 13+index; // Reset zIndex after movement
            }, 200 * index); // Stagger the start of the movement
            setTimeout(() => {
                // Move the card to the right or left without flipping
                card.style.transform = `translate(${translateX}px, ${translateY}px)`;
                card.style.zIndex = 7; // Reset zIndex after movement
                
                button.clickHandler = shuffleBtnEventHandler;
                button.addEventListener("click", shuffleBtnEventHandler);

                card.clickHandler = handleClueCardClick;
                card.addEventListener('click', handleClueCardClick);
                
                idkButton.clickHandler = dontKnowCard;
                idkButton.addEventListener("click", dontKnowCard);
            
            }, 2600);
        });
        flag = !flag;
    }
    else {
            let userContainer = document.querySelector(".user-cards");
            userContainer.style.visibility = "hidden";    
            all_cards.forEach((card, index) => {
            card.textContent = "";
            card.style.backgroundImage = 'url("./images/clueBack.png")'
            // Finally, move the card back to the original position without flipping
            setTimeout(() => {
                card.style.transform = "translate(0, 0)";
                card.style.zIndex = 1; // Ensure zIndex is reset
                
                // Remove the event listener after it has been handled
                card.clickHandler = null;
                card.removeEventListener('click', handleClueCardClick);
            }, 100); // Adjust timing as needed
        });
        idkButton.clickHandler = null;
        idkButton.removeEventListener("click", dontKnowCard);
        flag = !flag;
    }
}

function handleClueCardClick(event) {
        const cardIndex = parseInt(event.target.getAttribute('data-index'), 10); // Assuming you've added a 'data-index' attribute to each card
        if (cardIndex <= clueCards.length - 1) {
            applyListener(user1Cards);
            event.target.textContent = event.target.value;
            event.target.style.color = "white";
            event.target.style.backgroundImage = "url('./images/clueBack2.png')";
            event.target.style.zIndex = "23" + cardIndex;
            // To ensure the matchBtn visibility and card selection logic is handled only once, consider moving it outside or ensuring idempotence
            document.querySelector(".matchBtn").style.visibility = "visible";
            
            // isPaused = !isPaused;
            hiddenClueCard = null;
            hiddenClueCard = event.target;
            matchCard();

            // Remove the event listener after it has been handled
            event.target.removeEventListener('click', handleClueCardClick);
        }
}

const shuffleCards = ()=>{
    assignCluesToCards(landmarks, 22);
    // Apply the named function as the event listener to each clue card
    clueCards.forEach((card, index) => {
        // You might need to add a 'data-index' attribute to each card if not already present
        card.setAttribute('data-index', index.toString());
        card.clickHandler = handleClueCardClick;
        card.addEventListener('click', handleClueCardClick);
    });
}

const onLandmarkClick1 = (event)=>{
    // isPaused = !isPaused;
    selectedClueCard = null;
    hiddenClueCard = event.target;
    matchCard();
}

const applyListener = (cards)=>{   
    cards.forEach((card)=>{
        card.clickHandler = onLandmarkClick1;
        card.addEventListener("click", onLandmarkClick1)
    })

}

function removeAllClueCardListeners(Cards){
    Cards.forEach((card)=>{
        card.clickHandler = null;
        card.removeEventListener("click", handleClueCardClick);
    })
}

let onLandmarkClick;

const matchCard = () => {
    const landmarkCards = document.querySelectorAll(".landmark-card");
    // Loop through each landmark card
    landmarkCards.forEach((landmarkCard) => {
        // Check if the event listener has already been attached to the landmark card
        if (!landmarkCard.hasEventListener) {
            // Attach the event listener only if it hasn't been attached before
            landmarkCard.hasEventListener = true;
            onLandmarkClick = (event) => {
                if (!hiddenClueCard) {
                    hiddenClueCard = selectedClueCard;
                }
                if(hiddenClueCard.id != event.target.value){
                    alert("Did not match! Turn wasted.");
                    if(socket.id == playerId[0]){
                        removeAllUserCardListeners(user1Cards);
                        removeAllUserCardListeners(landmarkCards);
                        removeAllClueCardListeners(hiddenClueCards);
                        
                        socket.emit("updateScore", {playId: playerId, turn: 1, p1_score: -1, p2_score: 0, p3_score: 0})
                    }else if(socket.id==playerId[1]){
                        removeAllUserCardListeners(user1Cards);
                        removeAllUserCardListeners(landmarkCards);
                        removeAllClueCardListeners(hiddenClueCards);
                        socket.emit("updateScore", {playId: playerId, turn: 2, p1_score: 0, p2_score: -1, p3_score: 0})
                    }
                    else{
                        removeAllUserCardListeners(user1Cards);
                        removeAllUserCardListeners(landmarkCards);
                        removeAllClueCardListeners(hiddenClueCards);
                        socket.emit("updateScore", {playId: playerId, turn: 3, p1_score: 0, p2_score: 0, p3_score: -1})
                    }

                    button.clickHandler = null;
                    button.removeEventListener("click", shuffleBtnEventHandler);
                    
                    removeAllLandmarkListeners(document.querySelectorAll(".landmark-card"));
                    removeAllUserCardListeners(user1Cards);
    
                    idkButton.clickHandler = null;
                    idkButton.removeEventListener("click", dontKnowCard);
                    
                    random_event.clickHandler = null;
                    random_event.removeEventListener("click", timeLimitHandler)
    
                    specialCardDiv.clickHandler = null;
                    specialCardDiv.removeEventListener("click", specialDivEventHandler);

                    negotiateBtn.clickHandler = null;
                    negotiateBtn.removeEventListener("click", negotiateButtonHandler);

                    return;
                }
                // hiddenClueCard.style.zIndex = "-10";
                const landmarkRect = event.target.getBoundingClientRect();
                let landmarkTop = landmarkRect.top;
                const landmarkLeft = landmarkRect.left;
                // Adjust offset for positioning subsequent clue cards
                landmarkTop -= event.target.value*10;
                // Find the first hidden clue card
                if(hiddenClueCard.className == "user-clue user-1 fade-in"){
                    const someCardValue = hiddenClueCard.value;
                    const someCardText = hiddenClueCard.textContent;
                    hiddenClueCard.value = hiddenClueCards[indice].value
                    hiddenClueCard.textContent = hiddenClueCards[indice].textContent;
                    hiddenClueCard.id = hiddenClueCards[indice].id;
                    // hiddenClueCard.style.zIndex = "1";
                    hiddenClueCard = hiddenClueCards[indice];
                    hiddenClueCard.value = someCardValue;
                    hiddenClueCard.textContent = someCardText;
                    document.querySelector(".matchBtn").style.visibility = "hidden";
                    // user-clue user-1 fade-in/
                    hiddenClueCard.classList.add("fade-in")
                    hiddenClueCard.classList.add("user-1")
                    hiddenClueCard.classList.add("user-clue")
                }
                // Set the position of the clue card relative to the landmark card
                // hiddenClueCard.style.zIndex = "-1"
                hiddenClueCard.style.transform = "rotate(0deg)"
                hiddenClueCard.style.position = "absolute";
                hiddenClueCard.style.top = landmarkTop + "px";
                hiddenClueCard.style.left = landmarkLeft + "px";
                hiddenClueCard.style.borderColor = "white";
                indice--; // Decrease the indice once after adding the clue card
                if(indice==-1){
                    announceScores();
                }
                // Adding Score
                if(socket.id == playerId[0]){
                    socket.emit("updateScore", {playId: playerId, turn: 1, p1_score: 1, p2_score: 0, p3_score: 0})
                    user1Cards.forEach(card => {
                        // Assuming we've stored the listener reference in a property of each card
                        if (card.clickHandler) {
                            card.removeEventListener("click", card.clickHandler);
                            card.clickHandler = null; // Clear the stored reference
                            card.hasEventListener =false;
                        }
                    });
                    removeAllClueCardListeners(hiddenClueCards);
                    // Send trivia question to the player who selected the landmark

                }else if(socket.id==playerId[1]){
                    socket.emit("updateScore", {playId: playerId, turn: 2, p1_score: 0, p2_score: 1, p3_score: 0})
                    user1Cards.forEach(card => {
                        // Assuming we've stored the listener reference in a property of each card
                        if (card.clickHandler) {
                            card.removeEventListener("click", card.clickHandler);
                            card.clickHandler = null; // Clear the stored reference
                            card.hasEventListener =false;
                        }
                    });
                    removeAllClueCardListeners(hiddenClueCards);
                }
                else if(socket.id== playerId[2]){
                    socket.emit("updateScore", {playId: playerId, turn: 3, p1_score: 0, p2_score: 0, p3_score: 1})
                    user1Cards.forEach(card => {
                        // Assuming we've stored the listener reference in a property of each card
                        if (card.clickHandler) {
                            card.removeEventListener("click", card.clickHandler);
                            card.clickHandler = null; // Clear the stored reference
                            card.hasEventListener =false;
                        }
                    });
                    removeAllClueCardListeners(hiddenClueCards);
                }
                button.clickHandler = null;  
                button.removeEventListener("click", shuffleBtnEventHandler);
                removeAllLandmarkListeners(landmarkCards);

                idkButton.clickHandler = null;
                idkButton.removeEventListener("click", dontKnowCard);
                
                random_event.clickHandler = null;
                random_event.removeEventListener("click", timeLimitHandler)

                specialCardDiv.clickHandler = null;
                specialCardDiv.removeEventListener("click", specialDivEventHandler);

                negotiateBtn.clickHandler = null;
                negotiateBtn.removeEventListener("click", negotiateButtonHandler);
                
                setTimeout(()=>{
                    hiddenClueCard.parentNode.removeChild(hiddenClueCard);
                    removeAllClueCardListeners(hiddenClueCards);
                }, 500)   
            }  
            landmarkCard.clickHandler = onLandmarkClick;
            landmarkCard.addEventListener("click", onLandmarkClick);
        }
    });
}

function removeAllUserCardListeners(cards) {
    const cardss = document.querySelectorAll(".user-1"); 
    cardss.forEach(card => {
        // Assuming we've stored the listener reference in a property of each card
        
            card.clickHandler = null; // Clear the stored reference
            card.removeEventListener("click", onLandmarkClick1);
        
    });
}

function dontKnowCard(){
    let coins = Number(document.querySelector(".user-coin").textContent);
    if(coins>0){
        
        socket.emit("useCoin", {name: currentPlayerName})
        const landmarkCards = document.querySelectorAll(".landmark-card");
        
        if(socket.id == playerId[0]){
            removeAllUserCardListeners(user1Cards);
            removeAllUserCardListeners(landmarkCards);
            removeAllClueCardListeners(hiddenClueCards);
            socket.emit("updateScore", {playId: playerId, turn: 1, p1_score: 0, p2_score: 0, p3_score: 0})
        }else if(socket.id==playerId[1]){
            removeAllUserCardListeners(user1Cards);
            removeAllUserCardListeners(landmarkCards);
            removeAllClueCardListeners(hiddenClueCards);
            socket.emit("updateScore", {playId: playerId, turn: 2, p1_score: 0, p2_score: 0, p3_score: 0})
        }else{
            removeAllUserCardListeners(user1Cards);
            removeAllUserCardListeners(landmarkCards);
            removeAllClueCardListeners(hiddenClueCards);
            socket.emit("updateScore", {playId: playerId, turn: 3, p1_score: 0, p2_score: 0, p3_score: 0})
        }

        specialCardDiv.clickHandler = null;
        specialCardDiv.removeEventListener("click", specialDivEventHandler);

        random_event.clickHandler = null;
        random_event.removeEventListener("click", timeLimitHandler)

        removeAllLandmarkListeners(landmarkCards);

        button.clickHandler = null;
        button.removeEventListener("click", shuffleBtnEventHandler);
        
        idkButton.clickHandler = null;
        idkButton.removeEventListener("click", dontKnowCard);
        
        negotiateBtn.clickHandler = null;
        negotiateBtn.removeEventListener("click", negotiateButtonHandler);

        document.querySelector(".user-coin").textContent = `${coins-1}`;
    }else{
        alert("Not Enough Coins");
    }
    return;
}

socket.on("announceScores", (winner) =>{
    alert(`${winner} Won! awarded 10 coins!`);

    specialCardDiv.clickHandler = null;
    specialCardDiv.removeEventListener("click",specialDivEventHandler);

    random_event.clickHandler = null;
    random_event.removeEventListener("click", timeLimitHandler);

    button.clickHandler = null;  
    button.removeEventListener("click", shuffleBtnEventHandler);
    
    idkButton.clickHandler = null;
    idkButton.removeEventListener("click", dontKnowCard);

    removeAllClueCardListeners(hiddenClueCards);
    removeAllLandmarkListeners(document.querySelectorAll(".landmark-card"));

    negotiateBtn.clickHandler = null;
    negotiateBtn.removeEventListener("click", negotiateButtonHandler);

    isPaused = !isPaused;
})

const showUserCard = (turn)=>{
    let preUserCards;
    let nextUserCards;
    if(turn == 2){
        nextUserCards = document.querySelectorAll(".user-2");
        preUserCards = document.querySelectorAll(".user-1");
    }else if(turn == 3){
        nextUserCards = document.querySelectorAll(".user-3");
        preUserCards = document.querySelectorAll(".user-2");
    }else{
        nextUserCards = document.querySelectorAll(".user-1");
        preUserCards = document.querySelectorAll(".user-3");
    }

    nextUserCards.forEach((card, index)=>{
        if(card!=hiddenClueCard)
            card.textContent = card.value;
        else{
            card = hiddenClueCards[indice];
        }
        card.style.backgroundColor = "gold";
        card.style.backgroundImage = "url('./images/clueBack2.png')";
        card.addEventListener("click", (event)=>{
                hiddenClueCard = event.target;
                matchCard()
        })
    })
    
    preUserCards.forEach((card, index)=>{
        card.textContent = "";
        card.style.backgroundImage = "url('./images/clueBack.png')";
        
    })
}

function removeAllLandmarkListeners(landmarkCards) {
    landmarkCards.forEach(card => {
        // Assuming we've stored the listener reference in a property of each card
        if (card.clickHandler) {
            card.removeEventListener("click", card.clickHandler);
            card.clickHandler = null; // Clear the stored reference
            card.hasEventListener =false;
        }
    });
}

function changeCoinCount(change) {
    let currentBalance = parseInt(document.getElementById('coin-balance').textContent);
    let currentCards = parseInt(document.getElementById('special-cards').textContent);
    if((currentBalance<2 && change==2) || (currentCards==0 && change==-2)){
        return;
    }
    
    let newBalance = currentBalance - change;
    
    // Ensure the balance never goes below 0
    newBalance = Math.max(0, newBalance);
    
    // Update the displayed balance
    document.getElementById('coin-balance').textContent = newBalance;
    if(change>0){
        document.getElementById('special-cards').textContent = currentCards+1;
        document.getElementById('num-special-cards').textContent = currentCards+1;
    }else{
        document.getElementById('special-cards').textContent = currentCards-1;
        document.getElementById('num-special-cards').textContent = currentCards-1;
    }
    

    // Here you would also add the logic to update the server about the coin balance change
    // and manage the acquisition or usage of special cards
}

const negotiateButtonHandler = ()=> {
    document.querySelector(".negotiate-close").style.visibility = "visible";
    // Assume playerNames is an array of other player names
    const playerNames = [document.querySelector(".player_2").textContent, document.querySelector(".player_3").textContent];
    isPaused = true;
    let newHeading = document.createElement("h6");
    newHeading.textContent = "Select the landmark to offer!";
    newHeading.style.color = "white";
    negotiationArea.appendChild(newHeading);
    
    const landmarksToShow = document.querySelectorAll(".landmark-card");
    landmarksToShow.forEach((card)=>{
        const button = document.createElement('button');
        button.style.backgroundColor = "goldenrod";
        button.style.borderRadius = "10px";
        button.style.color = "white";
        button.style.border = "none";
        button.style.height = "25px";
        button.textContent = card.id;
        button.value = card.value;
        // let id = card.id;
        // let value = card.value;
        button.addEventListener('click', (event)=>{
            event.target.style.backgroundColor = "lightgreen";
            selectingNegotiationCard(event.target.textContent, event.target.value)
        });
        negotiationArea.appendChild(document.createElement("br"));
        negotiationArea.appendChild(button);
    })

    newHeading = document.createElement("h6");
    newHeading.textContent = "Select the Player to send Offer!";
    newHeading.style.color = "white";
    negotiationArea.appendChild(newHeading);

    // Create buttons for other players
    playerNames.forEach((name, index) => {
        const button = document.createElement('button');
        button.style.backgroundColor = "gold";
        button.style.borderRadius = "10px";
        button.style.color = "white"
        button.style.border = "none";
        button.style.height = "50px";
        button.textContent = name;
        button.id = `negotiate-with-${index + 1}`;
        button.addEventListener('click', (event) => {
            event.target.style.backgroundColor = "lightgreen";
            initiateNegotiation(name);
                    // Clear previous buttons
            while (negotiationArea.children.length > 2) {
                negotiationArea.removeChild(negotiationArea.lastChild);
            }
        });
        negotiationArea.appendChild(document.createElement("br"));
        negotiationArea.appendChild(button);
    });
}

const selectingNegotiationCard =(id, value)=>{
    negotiationCard = {textContent: id, id: id, value: value};
}

function initiateNegotiation(playerName) {
    if(socket.id == playerId[0]){
        socket.emit("choosePlayerNegotiation",{socket_Id: playerId[0], sendToName: playerName, senderName: currentPlayerName, negotiationCard: negotiationCard})
    }else if(socket.id == playerId[1])
        socket.emit("choosePlayerNegotiation",{socket_Id: playerId[1], sendToName: playerName, senderName: currentPlayerName, negotiationCard})
    else if(socket.id == playerId[2])
        socket.emit("choosePlayerNegotiation",{socket_Id: playerId[2], sendToName: playerName, senderName: currentPlayerName, negotiationCard})
    // Additional logic to handle negotiation
    isPaused = !isPaused;
}

const removeChooseCardEventHandlers = (marks)=>{
    marks.forEach((card)=>{
        card.clickHandler = null;
        card.removeEventListener("click", replacementHandler);
    })
    specialCardDiv.style.display = "block";
    let cardCount = Number(document.getElementById("num-special-cards").textContent);
    cardCount = cardCount-1;

    const div = document.getElementById("num-special-cards");
    div.textContent = cardCount;
    // specialCardDiv.innerHTML = div.innerHTML+"Card(s)";
}

socket.on("updatingNegotiation", (offerSenderData) => {
    let {offerSender, senderName} = offerSenderData;
    negotiationCard = offerSenderData.negotiationCard;
    negotiator = offerSender;

    document.getElementById("negotiateYes").addEventListener("click", negotiateYes);
    // Set the message in the modal
    document.getElementById("negotiationMessage").textContent = `${senderName} wants to negotiate for ${negotiationCard.textContent}. Do you accept?`;
    
    document.getElementById("negotiateNo").style.display = "block";
    // Show the modal
    document.getElementById("negotiationModal").style.display = "block";
});

// When the user clicks on Yes, close the modal and emit an acceptance event
const negotiateYes = ()=> {
    // document.getElementById("negotiationModal").style.display = "none";
    document.getElementById("negotiateNo").style.display = "none";
    const negotationModal = document.querySelector(".modal-content");
    
    const landmarksToShow = document.querySelectorAll(".landmark-card");
    landmarksToShow.forEach((card)=>{
        const button = document.createElement('button');
        button.style.marginTop = "10px"
        button.style.backgroundColor = "goldenrod";
        button.style.borderRadius = "10px";
        button.style.color = "white";
        button.style.border = "none";
        button.style.height = "25px";
        button.style.width = "content-fit";
        button.textContent = card.id;
        button.addEventListener('click', (event)=>{
            event.target.style.backgroundColor = "lightgreen";
            responseNegotiationCard(card.id, card.value)
        });
        negotationModal.appendChild(button);
    })
    // Additional logic to proceed with the negotiation
};

const responseNegotiationCard= (id, value)=>{
    // Emit an event back to the server to indicate acceptance
    socket.emit("negotiationResponse", { response: true, negotiator, offerReceiver: socket.id, cardInResponse: {textContent: id, id: id, value: value},recieverName: currentPlayerName, negotiationCard: negotiationCard});
    // Select the parent element
    var parentElement = document.querySelector(".modal-content");

    // Ensure the parent element exists and has at least three children
    if (parentElement && parentElement.children.length >= 3) {
        // Remove the last three children
        for (let i = 0; i < 3; i++) {
            parentElement.removeChild(parentElement.lastElementChild);
        }
    }

    document.getElementById("negotiationModal").style.display = "none";
}

// When the user clicks on No, close the modal and optionally emit a rejection event
document.getElementById("negotiateNo").addEventListener("click", function() {
    document.getElementById("negotiationModal").style.display = "none";
    
    // Optionally emit an event back to the server to indicate rejection
    socket.emit("negotiationResponse", { response: false, negotiator });
});

// When the user clicks on the <span> (x), close the modal
document.querySelector(".close").addEventListener("click", function() {
    document.getElementById("negotiationModal").style.display = "none";
    
    // Optionally emit an event back to the server to indicate rejection
    socket.emit("negotiationResponse", { response: false, negotiator });

});

// When the user clicks on the <span> (x), close the modal
document.querySelector(".negotiate-close").addEventListener("click", function() {

    document.querySelector(".negotiate-close").style.visibility = "hidden";
    
    isPaused = !isPaused;

    // Clear previous buttons
    while (negotiationArea.children.length > 2) {
        negotiationArea.removeChild(negotiationArea.lastChild);
    }

});

socket.on("acceptanceOffer", (flagResponse)=>{
    let {offerReceiver, cardInResponse, recieverName, negotiationCardy} = flagResponse;

    document.getElementById("negotiationMessage").textContent = `${recieverName} wants to give ${cardInResponse.textContent} in return! Do you accept?`;
    // When the user clicks on Yes, close the modal and emit an acceptance event
    document.getElementById("negotiateNo").style.display = "block";
    
    // Original button
    const originalButton = document.getElementById('negotiateYes');

    if(originalButton){
        // Clone the button
        const clonedButton = originalButton.cloneNode(true);

        // Replace the original button with its clone
        originalButton.parentNode.replaceChild(clonedButton, originalButton);

        document.getElementById("negotiateYes").addEventListener("click", function() {
            
            let cardToChange = document.getElementById(`${negotiationCardy.id}`);
            const cardSpan = cardToChange.querySelector(`span`);
    
            cardToChange.value = cardInResponse.value;
            cardToChange.id = cardInResponse.id;
            cardSpan.textContent = cardInResponse.textContent;
    
            document.getElementById("negotiationModal").style.display = "none";
            socket.emit("cardReplacer", {offerReceiver,cardInResponse: negotiationCardy, negotiationCard: cardInResponse})
            const negotiateClose = document.querySelector(".negotiate-close");
            negotiationArea.innerHTML = "" 
            negotiationArea.appendChild(negotiateClose);
            negotiationArea.appendChild(negotiateBtn);
            negotiationArea.querySelector(".negotiate-close").style.visibility = "hidden";
            negotiateBtn.addEventListener("click",negotiateButtonHandler);
    
            var parentElement = document.querySelector(".modal-content"); 
    
            // Original button
            const originalButton = document.getElementById('negotiateYes');
    
            if(originalButton){
                // Clone the button
                const clonedButton = originalButton.cloneNode(true);
    
                // Replace the original button with its clone
                originalButton.parentNode.replaceChild(clonedButton, originalButton);
    
                document.getElementById("negotiateYes").clickHandler = negotiateYes;
                document.getElementById("negotiateYes").addEventListener("click",negotiateYes);
            }
            
        
        });
        
    }

    

    document.getElementById("negotiateNo").addEventListener("click", function() {
        
        document.querySelector(".negotiate-close").style.visibility = "hidden";
        // Clear previous buttons
        while (negotiationArea.children.length > 2) {
            negotiationArea.removeChild(negotiationArea.lastChild);
        }
    });

    // When the user clicks on the <span> (x), close the modal
    document.querySelector(".close").addEventListener("click", function() {
        document.getElementById("negotiationModal").style.display = "none";
        document.querySelector(".negotiate-close").style.visibility = "hidden";
        // Clear previous buttons
        while (negotiationArea.children.length > 2) {
            negotiationArea.removeChild(negotiationArea.lastChild);
        }
    });

    // Show the modal
    document.getElementById("negotiationModal").style.display = "block";
})

socket.on("rejectionOffer", ()=>{
    document.querySelector(".negotiate-close").style.visibility = "hidden"
    // Clear previous buttons
    while (negotiationArea.children.length > 2) {
        negotiationArea.removeChild(negotiationArea.lastChild);
    }
})

socket.on("cardReplacing", (card)=>{
    let cardToChange = document.querySelector(`#${card.negotiationCard.id}`);
    cardToChange.value = card.cardInResponse.value;
    cardToChange.id = card.cardInResponse.id;
    const cardSpan = cardToChange.querySelector(`span`);
    cardSpan.textContent = card.cardInResponse.textContent;
    document.getElementById("negotiationModal").style.display = "none";
})

// Listen for your turn and start a countdown
socket.on('yourTurn', function(data) {
    
    document.querySelector(".user-name").style.backgroundColor = "gold";
    isPaused = false;
    
    // Start the turn countdown
    const snackBar = document.getElementById('snackbar');
    snackBar.style.visibility = "visible";


    negotiateBtn.clickHandler = negotiateButtonHandler;
    negotiateBtn.addEventListener("click", negotiateButtonHandler);

    random_event.clickHandler = timeLimitHandler;
    random_event.addEventListener("click", timeLimitHandler);

    let timeRemaining = data.turnEndsIn / 1000;
    turnTimer = setInterval(() => {
        // Update the UI with the remaining time
        snackBar.textContent = `Time remaining: ${timeRemaining}`;
        if(timeRemaining <= 0) {
            const landmarkCards = document.querySelectorAll(".landmark-card");
            removeAllLandmarkListeners(landmarkCards);
            snackBar.style.visibility = "hidden";
            clearInterval(turnTimer);


            specialCardDiv.clickHandler = null;
            specialCardDiv.removeEventListener("click",specialDivEventHandler);

            random_event.clickHandler = null;
            random_event.removeEventListener("click", timeLimitHandler);

            button.clickHandler = null;  
            button.removeEventListener("click", shuffleBtnEventHandler);
            
            idkButton.clickHandler = null;
            idkButton.removeEventListener("click", dontKnowCard);

            removeAllClueCardListeners(hiddenClueCards);
            removeAllLandmarkListeners(document.querySelectorAll(".landmark-card"));

            negotiateBtn.clickHandler = null;
            negotiateBtn.removeEventListener("click", negotiateButtonHandler);
            
            socket.emit("nextTurn");

        }else if(!isPaused){
            timeRemaining--;
        }
    }, 1000);
  
    // Show the snackbar notification for the start of the turn
    showSnackbar(data.message);
});

// Listen for turn ended notification
socket.on('turnEnded', function(data) {
    document.querySelector(".user-name").style.backgroundColor = "maroon";
    
    button.clickHandler = null;
    button.removeEventListener("click", shuffleBtnEventHandler);
    
    idkButton.clickHandler = null;
    idkButton.removeEventListener("click", dontKnowCard);
    
    removeAllClueCardListeners(hiddenClueCards);
    
    clearInterval(turnTimer);
    // Show the snackbar notification for the end of the turn
    showSnackbar(data.message);
});

// Function to show snackbar messages
function showSnackbar(message) {
  const snackbar = document.getElementById("snackbar");
  snackbar.textContent = message;
  snackbar.className = "show";
  setTimeout(function() { 
    snackbar.className = snackbar.className.replace("show", "");
  }, 3000);
}

const timeLimitHandler = ()=>{
    document.querySelector(".div-to-appear").style.visibility = "visible";
    const innerButtons = document.querySelectorAll(".div-to-appear>button");
    const player2 = document.querySelector(".player_2").textContent;
    const player3 = document.querySelector(".player_3").textContent;

    innerButtons[0].textContent = player2;
    innerButtons[1].textContent = player3;

    innerButtons[0].addEventListener("click", ()=>{
        document.querySelector(".div-to-appear-2").style.visibility = "visible";

        const inner2Buttons = document.querySelectorAll(".div-to-appear-2>button");

        inner2Buttons[0].addEventListener("click", ()=>{
            if(socket.id==playerId[0]){
                socket.emit("timeReducer", {reduceTimeFor: playerId[1], timeReduceTo: 60000})
            }else if(socket.id==playerId[1]){
                socket.emit("timeReducer", {reduceTimeFor: playerId[0], timeReduceTo: 60000})
            }else{
                socket.emit("timeReducer", {reduceTimeFor: playerId[0], timeReduceTo: 60000})
            }
            inner2Buttons[0].style.visibility = "hidden";
            inner2Buttons[1].style.visibility = "hidden";
            document.querySelector(".div-to-appear-2").style.vqqqqqqqqqqisibility = "hidden";
        })
        inner2Buttons[1].addEventListener("click", ()=>{
            if(socket.id==playerId[0]){
                socket.emit("timeReducer", {reduceTimeFor: playerId[1], timeReduceTo: 30000})
            }else if(socket.id==playerId[1]){
                socket.emit("timeReducer", {reduceTimeFor: playerId[0], timeReduceTo: 30000})
            }else{
                socket.emit("timeReducer", {reduceTimeFor: playerId[0], timeReduceTo: 30000})
            }
            inner2Buttons[0].style.visibility = "hidden";
            inner2Buttons[1].style.visibility = "hidden";
            document.querySelector(".div-to-appear-2").style.visibility = "hidden";
        })
        innerButtons[0].style.visibility = "hidden";
        innerButtons[1].style.visibility = "hidden";
    })
    innerButtons[1].addEventListener("click", ()=>{
        document.querySelector(".div-to-appear").style.visibility = "hidden";
        document.querySelector(".div-to-appear-2").style.visibility = "visible";

        const inner2Buttons = document.querySelectorAll(".div-to-appear-2>button");
        inner2Buttons[0].addEventListener("click", ()=>{
            if(socket.id==playerId[0]){
                socket.emit("timeReducer", {reduceTimeFor: playerId[2], timeReduceTo: 60000})
            }else if(socket.id==playerId[1]){
                socket.emit("timeReducer", {reduceTimeFor: playerId[2], timeReduceTo: 60000})
            }else{
                socket.emit("timeReducer", {reduceTimeFor: playerId[1], timeReduceTo: 60000})
            }

            inner2Buttons[0].style.visibility = "hidden";
            inner2Buttons[1].style.visibility = "hidden";
            
            document.querySelector(".div-to-appear-2").style.visibility = "hidden";

        })
        inner2Buttons[1].addEventListener("click", ()=>{
            if(socket.id==playerId[0]){
                socket.emit("timeReducer", {reduceTimeFor: playerId[2], timeReduceTo: 30000})
            }else if(socket.id==playerId[1]){
                socket.emit("timeReducer", {reduceTimeFor: playerId[2], timeReduceTo: 30000})
            }else{
                socket.emit("timeReducer", {reduceTimeFor: playerId[1], timeReduceTo: 30000})
            }
            inner2Buttons[0].style.visibility = "hidden";
            inner2Buttons[1].style.visibility = "hidden";
            
            document.querySelector(".div-to-appear-2").style.visibility = "hidden";
        })
        innerButtons[0].style.visibility = "hidden";
        innerButtons[1].style.visibility = "hidden";
    })
    random_event.style.visibility = "hidden";
}
random_event.clickHandler = timeLimitHandler;
random_event.addEventListener("click", timeLimitHandler);

socket.on("appearRandomCard", ()=>{
    random_event.style.visibility = "visible";
})

socket.on("matchTied", ()=>{
    alert("Match Tied!");

    specialCardDiv.clickHandler = null;
    specialCardDiv.removeEventListener("click",specialDivEventHandler);

    random_event.clickHandler = null;
    random_event.removeEventListener("click", timeLimitHandler);

    button.clickHandler = null;  
    button.removeEventListener("click", shuffleBtnEventHandler);
    
    idkButton.clickHandler = null;
    idkButton.removeEventListener("click", dontKnowCard);

    removeAllClueCardListeners(hiddenClueCards);
    removeAllLandmarkListeners(document.querySelectorAll(".landmark-card"));

    negotiateBtn.clickHandler = null;
    negotiateBtn.removeEventListener("click", negotiateButtonHandler);

    isPaused = !isPaused;
})