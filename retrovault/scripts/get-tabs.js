const https = require('https');

https.get("https://docs.google.com/spreadsheets/d/1As-D5Vm5Wse8J2y8xTAVvffLiJ7eKlgMytltqBmY62w/htmlview", (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /<li id="sheet-button-(.*?)".*?>(.*?)<\/li>/g;
    let match;
    while ((match = regex.exec(data)) !== null) {
      console.log(`GID: ${match[1]}, HTML: ${match[2]}`);
    }
    
    // Alternative approach if that doesn't match
    const regex2 = /gid=(\d+)&amp;[^\>]+>([^<]+)<\/a>/g;
    let match2;
    while ((match2 = regex2.exec(data)) !== null) {
      console.log(`Fallback -> GID: ${match2[1]}, Name: ${match2[2]}`);
    }
  });
});
