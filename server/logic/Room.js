const HEIGHT = 22;
const WIDTH = 22;
const NEXT_COL = [-1, -1, 0, 1, 1, 1, 0, -1];
const NEXT_ROW = [0, -1, -1, -1, 0, 1, 1, 1];

class Room {
  constructor(server, shortCode) {
    this.server = server;
    this.shortCode = shortCode;
    this.players = {};
    this.gameState = {
      currentPlayer: 0,
      isGameOver: false,
      lastMove: null,
      count: 0,
      isDraw: false,
      players: this.players,
    };
  }

  setUpGame() {
    const gameGrid = [];
    for (let i = 0; i < HEIGHT; i++) {
      const row = [];
      for (let j = 0; j < WIDTH; j++) {
        row.push(this.box(i, j));
      }
      gameGrid.push(row);
    }
    this.gameState = {
      ...this.gameState,
      currentPlayer: 0,
      isGameOver: false,
      lastMove: null,
      count: 0,
      isDraw: false,
      gameGrid,
    };
  }

  addNewPlayer(clientId, clientName) {
    console.log("Added new player", clientId);
    this.players[clientId] = clientName;
  }

  removePlayer(id) {
    delete this.players[id];
  }

  size() {
    return Object.keys(this.players).length;
  }

  resetGame() {
    this.setUpGame();
    this.emitState();
  }

  box(row, col) {
    return {
      row,
      col,
      player: -1,
      isWinningCell: false,
      isLastMove: false,
    };
  }

  clickTile(row, col) {
    const { gameGrid, currentPlayer, lastMove, count } = this.gameState;
    let nextGameGrid = [...gameGrid];
    let nextPlayer = (currentPlayer + 1) % 2;
    nextGameGrid[row][col] = {
      ...gameGrid[row][col],
      player: currentPlayer,
      isLastMove: true,
    };

    if (lastMove != null) {
      nextGameGrid[lastMove[0]][lastMove[1]].isLastMove = false;
    }

    let newState = {
      ...this.gameState,
      gameGrid: nextGameGrid,
      currentPlayer: nextPlayer,
      lastMove: [row, col],
      count: count + 1,
    };
    this.gameState = newState;
    this.checkWin(row, col, currentPlayer);
    this.checkDraw(this.gameState.count);
    if (this.gameState.isGameOver) {
      this.gameState.currentPlayer = currentPlayer;
    }
    this.emitState();
  }

  checkDraw(count) {
    if (!this.gameState.isGameOver && count === HEIGHT * WIDTH) {
      this.gameState.isDraw = true;
    }
  }

  colorWinningCell(row, col) {
    this.gameState.gameGrid[row][col].isWinningCell = true;
  }

  checkWin(row, col, player) {
    for (let dir = 0; dir < 4; dir++) {
      const [firstDir, secondDir] = [dir, dir + 4];
      const len =
        this.explore(this.next(row, col, firstDir), player, firstDir) +
        this.explore(this.next(row, col, secondDir), player, secondDir) +
        1;
      if (len >= 5) {
        this.gameState.isGameOver = true;
        this.explore(this.next(row, col, firstDir), player, firstDir, true);
        this.explore([row, col], player, secondDir, true);
      }
    }
  }

  next(row, col, dirIndex) {
    return [row + NEXT_ROW[dirIndex], col + NEXT_COL[dirIndex]];
  }

  explore(pos, player, dirIndex, isWinning) {
    const [row, col] = pos;
    if (row < 0 || row >= HEIGHT || col < 0 || col >= WIDTH) {
      return 0;
    } else if (this.gameState.gameGrid[row][col].player === -1) {
      return 0.5;
    } else if (this.gameState.gameGrid[row][col].player !== player) {
      return 0;
    }
    if (isWinning) this.colorWinningCell(row, col);
    return (
      1 +
      this.explore(this.next(row, col, dirIndex), player, dirIndex, isWinning)
    );
  }

  emitState() {
    this.emit("game_state", this.gameState);
  }

  emit(name, object) {
    this.server.to(this.shortCode).emit(name, object);
  }
}

export default Room;
