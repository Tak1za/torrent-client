const dgram = require("dgram");
const Buffer = require("buffer").Buffer;
const urlParse = require("url").parse;
const crypto = require("crypto");
const torrentParser = require("./torrent-parser");
const util = require("./util");

module.exports.getPeers = (torrent, callback) => {
  const socket = dgram.createSocket("udp4");
  const url = torrent.announce / toString("utf8");
  const announceReq = buildAnnounceReq(connResp.connectionId, torrent);

  udpSend(socket, buildConnReq(), url);

  socket.on("message", response => {
    if (respType(response) === "connect") {
      const connResp = parseConnResp(response);
      const announceReq = buildAnnounceReq(connResp.connectionId);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === "announce") {
      const announceResp = parseAnnounceResp(response);
      callback(announceResp.peers);
    }
  });
};

function udpSend(socket, message, rawUrl, callback = () => {}) {
  const url = urlParse(rawUrl);
  socket.send(message, 0, message.length, url.port, url.host, callback);
}

function buildConnReq() {
  const buf = Buffer.alloc(16);

  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);
  buf.writeUInt32BE(0, 8);
  crypto.randomBytes(4).copy(buf, 12);

  return buf;
}

function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.slice(8)
  };
}

function buildAnnounceReq(connId, torrent, port = 6881) {
  const buf = Buffer.allocUnsafe(98);

  connId.copy(buf, 0); //connection id
  buf.writeUInt32BE(1, 8); //action
  crypto.randomBytes(4).copy(buf, 12); //transaction id
  torrentParser.infoHash(torrent).copy(buf, 16); //info hash
  util.genId().copy(buf, 36); //peer id
  Buffer.alloc(8).copy(buf, 56); //donwloaded
  torrentParser.size(torrent).copy(buf, 64); //left
  Buffer.alloc(8).copy(buf, 72); //uploaded
  buf.writeUInt32BE(0, 80); //event
  buf.writeUInt32BE(0, 80); //ip address
  crypto.randomBytes(4).copy(buf, 88); //key
  buf.writeInt32BE(-1, 92); //num want
  buf.writeUInt16BE(port, 96); //port

  return buf;
}

function parseAnnounceResp(resp) {
  function group(iterable, groupSize) {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map(address => {
      return {
        ip: address.slice(0, 4).join("."),
        port: address.readUInt16BE(4)
      };
    })
  };
}

function respType(resp) {
  const action = resp.readUInt32BE(0);
  if (action === 0) return "connect";
  if (action === 1) return "announce";
}
