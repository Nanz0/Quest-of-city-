async function fetchLeaderboard() {
    const response = await fetch('http://localhost:3000/leaderboard');
    const leaderboard = await response.json();
    console.log(leaderboard);
    const leaderboardDiv = document.getElementById('leaderboard');
    leaderboard.forEach((user, index) => {
      const entryDiv = document.createElement('div');
      entryDiv.className = 'leaderboard-entry';
      entryDiv.textContent = `${index}. ${user.username} - ${index}`;
      entryDiv.innerHTML = `<span class="rank"><i class="fas fa-trophy"></i> ${index}</span> ${user.username} - <span class="score">${user.coins}</span>`;
      leaderboardDiv.appendChild(entryDiv);
    });
  }
  
  fetchLeaderboard();
  