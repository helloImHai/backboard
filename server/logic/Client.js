class Client {
  constructor(server, socket) {
    this.server = server;
    this.socket = socket;
    this.room = null;
    this.name = "";
  }

  setName(name) {
    this.name = name;
  }

  addRoom(room) {
    this.room = room;
  }

  emit(name, object) {
    this.server.to(this.socket.id).emit(name, object);
  }
}

export default Client;
