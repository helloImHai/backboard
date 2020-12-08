import io from "socket.io";
import Client from "./Client";
import Room from "./Room";
import Chance from "chance";

let _rooms = {};

class Server {
  constructor(expressServer) {
    this.server = io(expressServer);
  }

  init() {
    this.server.on("connection", this.onConnection);
  }

  /**
   * Called when the server closes
   */
  onClose() {
    Object.values(rooms).forEach((room) => {
      // room.interrupt("Please Refresh");
      // room.close();
      console.log("Server closing");
      delete _rooms[room.shortCode];
    });
  }

  /**
   * Called when the server gets a new connection
   */
  onConnection(socket) {
    console.log("Connection established");

    const client = new Client(this.server, socket);
    socket.emit("set_player_id", socket.id);

    function addClientToRoom(room) {
      client.addRoom(room);
      socket.join(room.shortCode);
      room.addNewPlayer(socket.id, client.name);
      room.emit("joined_room", room.shortCode);
    }
    /**
     * Set Name
     */
    socket.on("set_name", (name) => {
      client.setName(name);
      client.emit("received_name", name);
    });

    /**
     * Creating Room
     */
    socket.on("create_room", () => {
      const chance = new Chance();
      let shortCode = null;
      while (!shortCode || _rooms[shortCode] != null) {
        shortCode = chance.integer({ min: 100000, max: 999999 });
      }
      const room = new Room(this.server, `${shortCode}`);
      _rooms[room.shortCode] = room;

      addClientToRoom(room);
      room.emitState();
    });

    /**
     * Joining Room
     */
    socket.on("join_room", (roomShortCode) => {
      if (_rooms[roomShortCode] == undefined) {
        client.emit("join_room_failure");
        return;
      }
      const room = _rooms[roomShortCode];
      if (room.size() == 2) {
        client.emit("join_room_failure");
        return;
      }

      addClientToRoom(room);
      room.emitState();
    });

    /**
     * On close
     */
    socket.on("disconnect", () => {
      const room = client.room;
      if (room == null) return;

      room.removePlayer(socket.id);
      if (room.size() == 0) {
        delete _rooms[room.shortCode];
      }
      console.log("disconnecting");
      room.emit("another_player_disconnected");
      room.emitState();
    });

    /**
     * Start Game
     */
    socket.on("start_game", () => {
      const room = client.room;
      room.setUpGame();
      room.emit("game_started");
      room.emitState();
    });

    /**
     * On tile click
     */
    socket.on("clickTile", ([row, col]) => {
      client.room.clickTile(row, col);
    });

    /**
     * Reset game
     */
    socket.on("reset_game", () => {
      client.room.resetGame();
    });
  }
}

export default Server;
