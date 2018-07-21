const fs=require('fs');
const torrent=fs.readFileSync('1torr.torrent');
console.log(torrent.toString('utf8'));