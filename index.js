const fs = require("fs");
const bencode = require("bencode");
const tracker = require("./tracker");

const torrent = bencode.decode(fs.readFileSync("1torr.torrent"));

tracker.getPeers(torrent, peers => {
  console.log("List of peers: ", peers);
});
