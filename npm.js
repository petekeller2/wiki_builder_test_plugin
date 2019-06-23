const shell = require('shelljs');

shell.sed('-i', '"preinstall": "npm install ../wiki_builder/ && npm install ../wiki_builder_plugin_test/",', '', 'package.json');
