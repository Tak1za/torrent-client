const fs = require("fs");
const bencode = require("bencode");
const tracker = require("./tracker");
const torrentParser = require("./torrent-parser");

const torrent = torrentParser.open("1torr.torrent");

tracker.getPeers(torrent, peers => {
  console.log("List of peers: ", peers);
});
