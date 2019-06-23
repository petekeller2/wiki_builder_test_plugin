const shell = require('shelljs');
const fs = require('fs');

fs.readFile('package.json', function (err, data) {
  if (err) throw err;
  if (data.includes('"preinstall":')) {
    console.log('It appears to be already setup for local testing.');
  } else {
    console.log('Setting up for local testing... Please wait...');
    shell.sed('-i', '"scripts": {', '"scripts": {\n\t"preinstall": "npm install ../wiki_builder/ && npm install ../wiki_builder_plugin_test/",', 'package.json');
  }
});

