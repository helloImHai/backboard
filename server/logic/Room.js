const HEIGHT = 22;
const WIDTH = 22;
const NEXT_COL = [-1, -1, 0, 1, 1, 1, 0, -1];
const NEXT_ROW = [0, -1, -1, -1, 0, 1, 1, 1];
const EMPTY_CELL = -1;
const OPEN_CELL_VALUE = 0.5;
const BLOCKED_CELL_VALUE = 0;
const CONSECUTIVE_CELL_VALUE = 1;

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
    for (let orientation = 0; orientation < 4; orientation++) {
      const [dir1, dir2] = [orientation, orientation + 4];
      const numberOfConsecutiveCells =
        this.countConsecutive(this.nextCell(row, col, dir1), player, dir1) +
        this.countConsecutive(this.nextCell(row, col, dir2), player, dir2) +
        1;
      // Win condition
      if (numberOfConsecutiveCells >= 5) {
        this.gameState.isGameOver = true;
        this.colorOrientation(row, col, orientation, player);
      }
    }
  }

  nextCell(row, col, direction) {
    return [row + NEXT_ROW[direction], col + NEXT_COL[direction]];
  }

  isEmptyCell(row, col) {
    return this.gameState.gameGrid[row][col].player === EMPTY_CELL;
  }

  isInvalidPosition(row, col) {
    return row < 0 || row >= HEIGHT || col < 0 || col >= WIDTH;
  }

  isBlocked(row, col, player) {
    return (
      this.gameState.gameGrid[row][col].player !== EMPTY_CELL &&
      this.gameState.gameGrid[row][col].player !== player
    );
  }

  countConsecutive(position, player, direction) {
    const [row, col] = position;
    if (this.isInvalidPosition(row, col) || this.isBlocked(row, col, player)) {
      return BLOCKED_CELL_VALUE; // 0
    } else if (this.isEmptyCell(row, col)) {
      return OPEN_CELL_VALUE; // 0.5
    }
    // Happy path, consecutive cell, add 1 and continue counting
    return (
      CONSECUTIVE_CELL_VALUE + // 1
      this.countConsecutive(
        this.nextCell(row, col, direction),
        player,
        direction
      )
    );
  }

  colorOrientation(row, col, orientation, player) {
    const position = [row, col];
    const [dir1, dir2] = [orientation, orientation + 4];
    this.colorDirection(position, dir1, player);
    this.colorDirection(position, dir2, player);
  }

  colorDirection(position, direction, player) {
    const [row, col] = position;
    if (
      this.isInvalidPosition(row, col) ||
      this.isEmptyCell(row, col) ||
      this.isBlocked(row, col, player)
    ) {
      return;
    }
    this.colorWinningCell(row, col);
    this.colorDirection(this.nextCell(row, col, direction), direction, player);
  }

  emitState() {
    this.emit("game_state", this.gameState);
  }

  emit(name, object) {
    this.server.to(this.shortCode).emit(name, object);
  }
}

export default Room;
