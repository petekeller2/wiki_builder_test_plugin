"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _glob = _interopRequireDefault(require("glob"));

var _shelljs = _interopRequireDefault(require("shelljs"));

var _tracer = _interopRequireDefault(require("tracer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _default = {
  tempWikiDir: 'tempMdFiles',
  wikiConfigFileName: 'wikiConfig.json',
  safetyCounterLimit: 100,
  logger: _tracer["default"].colorConsole({
    transport: function () {
      function transport(data) {
        console.log(data.output);

        _fsExtra["default"].appendFile('./wiki-build.log', "".concat(data.rawoutput, "\n"), function (err) {
          if (err) throw err;
        });
      }

      return transport;
    }()
  }),
  buildWiki: function () {
    async function buildWiki() {
      var wikiConfig = await this.getWikiConfigData((await this.findWikiConfigPath()["catch"](this.logger.error)))["catch"](this.logger.error);
      var wikiDirPath = wikiConfig.wikiDirPath,
          ignoreMdTitles = wikiConfig.ignoreMdTitles,
          statsEnabled = wikiConfig.statsEnabled,
          plugins = wikiConfig.plugins;
      await _fsExtra["default"].ensureDir(wikiDirPath)["catch"](this.logger.error);
      await this.removeMdFilesInWikiDir(wikiDirPath)["catch"](this.logger.error);
      await this.emptyTempWikiDir(wikiDirPath)["catch"](this.logger.error);
      await this.copyFilesToTempDir(wikiConfig)["catch"](this.logger.error);
      await this.createStatsIfEnabled(statsEnabled, wikiDirPath)["catch"](this.logger.error);
      var wikiBuilderModule = [this, 'wiki-builder'];
      var reduceActionSteps = new Map();
      reduceActionSteps.set([this.configIgnoreByTitle, [ignoreMdTitles]], [[this.removeFiles, []], wikiBuilderModule]);
      reduceActionSteps = this.addPluginReduceActionSteps(reduceActionSteps, plugins);
      reduceActionSteps.set([this.wikiFileNameByTitle, []], [[this.moveFilesToWiki, [this]], wikiBuilderModule]);
      await this.readReduceAction(reduceActionSteps, wikiDirPath)["catch"](this.logger.error);
      await this.removeTempDir(wikiDirPath)["catch"](this.logger.error);
    }

    return buildWiki;
  }(),
  addPluginReduceActionSteps: function () {
    function addPluginReduceActionSteps(reduceActionSteps, plugins) {
      var _this = this;

      plugins.forEach(function (plugin) {
        var pluginPath = _this.getPluginPath(plugin); // eslint-disable-next-line


        var pluginModule = require(pluginPath);

        var raStepArray = pluginModule.getStep();
        raStepArray[1].push([pluginModule, plugin]);
        reduceActionSteps.set(raStepArray[0], raStepArray[1]);
      });
      return reduceActionSteps;
    }

    return addPluginReduceActionSteps;
  }(),
  cleanPlugins: function () {
    function cleanPlugins(plugins) {
      var _this2 = this;

      if (!Array.isArray(plugins) || plugins.length <= 0) {
        return [];
      }

      return plugins.map(function (plugin) {
        return _this2.getPluginPath(plugin);
      });
    }

    return cleanPlugins;
  }(),
  getPluginPath: function () {
    function getPluginPath(pluginPath) {
      if (pluginPath.includes('/') || pluginPath.includes('.js')) {
        return pluginPath;
      }

      var returnPluginPath = "".concat(process.cwd(), "/node_modules/").concat(pluginPath);

      if (pluginPath.endsWith('/')) {
        return returnPluginPath;
      }

      return "".concat(returnPluginPath, "/");
    }

    return getPluginPath;
  }(),
  findWikiConfigPath: function () {
    async function findWikiConfigPath() {
      if (await _fsExtra["default"].pathExists("./".concat(this.wikiConfigFileName))["catch"](this.logger.error)) {
        return this.wikiConfigFileName;
      }

      var regex = new RegExp("".concat(this.wikiConfigFileName, "$"), 'g');
      return _shelljs["default"].find('.').filter(function (file) {
        return file.match(regex);
      }).pop();
    }

    return findWikiConfigPath;
  }(),
  getWikiConfigData: function () {
    function getWikiConfigData(wikiStringPath) {
      var _this3 = this;

      return _fsExtra["default"].readJson(wikiStringPath).then(function (wikiConfig) {
        return _this3.useGitignoredIfEnabled(_this3.cleanWikiConfigData(wikiConfig));
      })["catch"](function (err) {
        _this3.logger.error(err);

        return {};
      });
    }

    return getWikiConfigData;
  }(),
  cleanWikiConfigData: function () {
    function cleanWikiConfigData(wikiConfig) {
      var cleanedWikiConfig = wikiConfig;
      cleanedWikiConfig.wikiDirPath = this.cleanWikiConfigPath(wikiConfig.wikiDirPath, './wiki/');
      cleanedWikiConfig.projectDirPath = this.cleanWikiConfigPath(wikiConfig.projectDirPath, './');
      cleanedWikiConfig.ignoreMdFiles = this.cleanWikiConfigArray(wikiConfig.ignoreMdFiles, 'lower');
      cleanedWikiConfig.ignoreDirs = this.cleanWikiConfigArray(wikiConfig.ignoreDirs, 'lower');
      cleanedWikiConfig.ignoreDirs.push('node_modules');
      cleanedWikiConfig.ignoreMdTitles = this.cleanWikiConfigArray(wikiConfig.ignoreMdTitles, 'lower');
      cleanedWikiConfig.statsEnabled = this.cleanWikiConfigBool(wikiConfig.statsEnabled);
      cleanedWikiConfig.useGitignore = this.cleanWikiConfigBool(wikiConfig.useGitignore, true);
      cleanedWikiConfig.plugins = this.cleanPlugins(wikiConfig.plugins);
      return cleanedWikiConfig;
    }

    return cleanWikiConfigData;
  }(),
  cleanWikiConfigPath: function () {
    function cleanWikiConfigPath(configPath, defaultPath) {
      var configPathReturn = configPath.trim();

      if (configPathReturn.length === 0) {
        configPathReturn = defaultPath;
      } else if (configPathReturn.slice(-1) !== '/') {
        configPathReturn += '/';
      }

      return configPathReturn;
    }

    return cleanWikiConfigPath;
  }(),
  cleanWikiConfigArray: function () {
    function cleanWikiConfigArray(configArray, caseFunc) {
      var configArrayReturn = configArray;

      if (!Array.isArray(configArray) && configArray) {
        if (_typeof(configArray) !== _typeof(true)) {
          configArrayReturn = [];
          configArrayReturn.push(String(configArray));
        }
      }

      return configArrayReturn.map(function (file) {
        var fileReturn = String(file).trim();

        if (caseFunc.toLowerCase() === 'lower') {
          fileReturn = fileReturn.toLowerCase();
        } else if (caseFunc.toLowerCase() === 'upper') {
          fileReturn = fileReturn.toUpperCase();
        }

        return fileReturn;
      }).filter(function (file) {
        return file.length > 0;
      });
    }

    return cleanWikiConfigArray;
  }(),
  cleanWikiConfigBool: function () {
    function cleanWikiConfigBool(configBool, defaultValue) {
      if (typeof configBool === 'string') {
        var firstChar = configBool.toLowerCase().trim().charAt(0);
        return Boolean(firstChar === 't' || firstChar === 'y');
      }

      if (defaultValue && configBool === undefined) {
        return defaultValue;
      }

      return Boolean(configBool);
    }

    return cleanWikiConfigBool;
  }(),
  emptyTempWikiDir: function () {
    async function emptyTempWikiDir(wikiDirPath) {
      var wikiTempDir = "".concat(wikiDirPath).concat(this.tempWikiDir);
      var pathExists = await _fsExtra["default"].pathExists(wikiTempDir)["catch"](this.logger.error);

      if (pathExists) {
        return _fsExtra["default"].emptyDir(wikiTempDir);
      }

      return _fsExtra["default"].ensureDir(wikiTempDir);
    }

    return emptyTempWikiDir;
  }(),
  getMdFilesInDir: function () {
    function getMdFilesInDir(dirPath, dirType) {
      return new Promise(function (resolve, reject) {
        (0, _glob["default"])("".concat(dirPath).concat(dirType.toLowerCase() === 'project' ? '{/**/,/}' : '/', "*.md"), function (er, files) {
          if (er) {
            reject(er);
          } else {
            resolve(files);
          }
        });
      });
    }

    return getMdFilesInDir;
  }(),
  removeMdFilesInWikiDir: function () {
    async function removeMdFilesInWikiDir(wikiDirPath) {
      var mdFiles = await this.getMdFilesInDir(wikiDirPath, 'wiki')["catch"](this.logger.error);
      var removeMdFilePromises = mdFiles.map(function (file) {
        return _fsExtra["default"].remove(file);
      });
      return Promise.all(removeMdFilePromises);
    }

    return removeMdFilesInWikiDir;
  }(),
  copyFilesToTempDir: function () {
    async function copyFilesToTempDir(wikiConfig) {
      var _this4 = this;

      var wikiDirPath = wikiConfig.wikiDirPath,
          projectDirPath = wikiConfig.projectDirPath,
          ignoreMdFiles = wikiConfig.ignoreMdFiles;
      var mdFiles = await this.getMdFilesInDir(projectDirPath, 'project')["catch"](this.logger.error);
      mdFiles = mdFiles.filter(this.ignoreDirsFilterCallback(wikiConfig.ignoreDirs));
      var i = 0;
      var copyMdFilePromises = mdFiles.map(function (file) {
        var splitFile = file.split('/');
        var fileName = splitFile.pop();
        var fileNameNoFileType = fileName.split('.').shift();
        var fileNamesToIgnore = [file, fileName, fileNameNoFileType];
        i += 1;
        var ignoreMdSpecificFiles = ignoreMdFiles.filter(function (f) {
          return f.includes('/');
        });
        var ignoreMdFileNames = ignoreMdFiles.filter(function (f) {
          return !f.includes('/');
        });

        if (!ignoreMdSpecificFiles.some(function (ignore) {
          return file === ignore;
        }) && !ignoreMdFileNames.some(function (ignore) {
          return fileNamesToIgnore.includes(ignore);
        })) {
          return _fsExtra["default"].copy(file, "".concat(wikiDirPath).concat(_this4.tempWikiDir, "/").concat(i, ".md"));
        }

        return '';
      });
      return Promise.all(copyMdFilePromises);
    }

    return copyFilesToTempDir;
  }(),
  // A stats file will only be created for git repos with commits. Disabled by default
  createStatsIfEnabled: function () {
    async function createStatsIfEnabled(statsEnabled, wikiDirPath) {
      if (!statsEnabled) {
        return 'Stats not enabled';
      }

      var statsFile = "".concat(wikiDirPath, "/").concat(this.tempWikiDir, "/Stats.md");
      var command = 'git diff --stat `git hash-object -t tree /dev/null`';
      command = "".concat(command, " > ").concat(statsFile);
      await new Promise(function (resolve, reject) {
        _shelljs["default"].exec(command, function (code, stdout, stderr) {
          if (stderr) {
            reject(stderr);
          }

          resolve(stdout);
        });
      })["catch"](this.logger.error);
      var writeFileData = await new Promise(function (resolve, reject) {
        _fsExtra["default"].readFile(statsFile, 'utf8', function (err, data) {
          if (err) reject(err);
          var newFileData = data.toString().split('\n');

          if (data.toString().length > 0) {
            newFileData.pop();
            var fileCountLineCount = newFileData.pop();
            var numberMatches = fileCountLineCount.match(/\d+/g);

            if (numberMatches[1].length > 0) {
              newFileData.push("### Total Lines of Code: ".concat(numberMatches[1]));
            }

            if (numberMatches[0].length > 0) {
              newFileData.splice(0, 0, "### Number of Files: ".concat(numberMatches[0]));
            }

            newFileData.splice(0, 0, '# Stats');
          }

          resolve(newFileData.join('\n\n'));
        });
      })["catch"](this.logger.error);

      if (writeFileData.length > 0) {
        return new Promise(function (resolve, reject) {
          _fsExtra["default"].writeFile(statsFile, writeFileData, 'utf8', function (err) {
            if (err) reject(err);
            resolve('Stats file cleaned');
          });
        })["catch"](this.logger.error);
      }

      await _fsExtra["default"].remove(statsFile)["catch"](this.logger.error);
      return 'Stats file removed because it was empty';
    }

    return createStatsIfEnabled;
  }(),
  // Updates the wikiConfig object. Enabled by default
  useGitignoredIfEnabled: function () {
    async function useGitignoredIfEnabled(wikiConfig) {
      var gitIgnoreFound = await _fsExtra["default"].pathExists("".concat(wikiConfig.projectDirPath, ".gitignore"))["catch"](this.logger.error);

      if (wikiConfig.useGitignore && gitIgnoreFound) {
        var newWikiConfig = wikiConfig;
        var gitIgnoreFile = await _fsExtra["default"].readFile("".concat(wikiConfig.projectDirPath, ".gitignore"), 'utf8')["catch"](this.logger.error);
        var gitIgnoreArray = gitIgnoreFile.split('\n');
        gitIgnoreArray.forEach(function (line) {
          var endOfPath = line.split('/').pop();

          if (line.slice(-1) === '/') {
            newWikiConfig.ignoreDirs.push(line);
          } else if (endOfPath.split('.').pop().toLowerCase() === 'md') {
            newWikiConfig.ignoreMdFiles.push(line);
          }
        });
        return newWikiConfig;
      }

      return wikiConfig;
    }

    return useGitignoredIfEnabled;
  }(),
  ignoreDirsFilterCallback: function () {
    function ignoreDirsFilterCallback(ignoreDirs) {
      return function (file) {
        return ignoreDirs.filter(function (ignoreDir) {
          return file.includes(ignoreDir);
        }).length === 0;
      };
    }

    return ignoreDirsFilterCallback;
  }(),
  //   Read: Reads md files in the temporary wiki directory.
  // Reduce: Passes read results, specific function and its extra arguments to a reduce function.
  // Action: Passes reduced results and extra action function arguments to an action function.
  // The name of the specific function determines which reduce function will be used.
  readReduceAction: function () {
    async function readReduceAction(reduceActionSteps, wikiDirPath, safety) {
      // ------------------------------- Safety Counter -------------------------------
      var safetyCounter = safety;

      if (!safetyCounter) {
        safetyCounter = 1;
      } else if (safetyCounter > this.safetyCounterLimit) {
        return new Error('readReduceAction went over safety counter');
      }

      safetyCounter += 1; // ------------- Get Functions and Extra Arguments for Next Section -------------

      var mapKeyValue = reduceActionSteps.entries().next().value;

      if (!mapKeyValue) {
        return new Error('No reduceActionSteps');
      }

      var _mapKeyValue = _slicedToArray(mapKeyValue, 2),
          mapKey = _mapKeyValue[0],
          mapValue = _mapKeyValue[1];

      var _mapKey = _slicedToArray(mapKey, 2),
          specificFunc = _mapKey[0],
          extraSpecificArgs = _mapKey[1];

      var _mapValue = _slicedToArray(mapValue, 2),
          actionArray = _mapValue[0],
          moduleArray = _mapValue[1];

      var _actionArray = _slicedToArray(actionArray, 2),
          actionOnReducedFunc = _actionArray[0],
          extraActionArgs = _actionArray[1];

      var _moduleArray = _slicedToArray(moduleArray, 2),
          module = _moduleArray[0],
          moduleName = _moduleArray[1];

      var reduceFuncName = this.findReduceFuncName(specificFunc, module);

      if (!reduceFuncName) {
        this.logger.error("A reduce function for ".concat(specificFunc.name, " was not found in ").concat(moduleName, ".\n") + '(The pattern is ...By{x} for the specific function and ...By{x}Reduce for the reduce function. ' + "In this case, x = '".concat(specificFunc.name.split('By').pop(), "'.)"));
        process.exit(1);
      } // ----------------------------- Read Reduce Action -----------------------------


      var filesInTempDir = await this.readFilesInTempDir(wikiDirPath)["catch"](this.logger.error);
      var reduced = await module[reduceFuncName](filesInTempDir, extraSpecificArgs, specificFunc);
      await actionOnReducedFunc.apply(void 0, [reduced].concat(_toConsumableArray(extraActionArgs))); // ------------------ Recursive Function Call or Termination --------------------

      if (reduceActionSteps.size !== 1) {
        reduceActionSteps["delete"](mapKey);
        return this.readReduceAction(reduceActionSteps, wikiDirPath, safetyCounter);
      }

      return undefined;
    }

    return readReduceAction;
  }(),
  findReduceFuncName: function () {
    function findReduceFuncName(specificFunc, module) {
      var matchResults = specificFunc.name.match(/By(.*)/);

      if (matchResults) {
        var reduceNameSearch = "By".concat(matchResults[1]);
        return Object.keys(module).find(function (prop) {
          if (prop && typeof module[prop] === 'function' && module[prop].name) {
            return module[prop].name.endsWith("".concat(reduceNameSearch, "Reduce"));
          }

          return false;
        });
      }

      return undefined;
    }

    return findReduceFuncName;
  }(),
  getFilesInTempDir: function () {
    function getFilesInTempDir(wikiDirPath) {
      return _fsExtra["default"].readdir("".concat(wikiDirPath).concat(this.tempWikiDir));
    }

    return getFilesInTempDir;
  }(),
  readFilesInTempDir: function () {
    async function readFilesInTempDir(wikiDirPath) {
      var _this5 = this;

      var filesInTempDir = await this.getFilesInTempDir(wikiDirPath)["catch"](this.logger.error);
      var filePaths = filesInTempDir.map(function (file) {
        return "".concat(wikiDirPath).concat(_this5.tempWikiDir, "/").concat(file);
      });
      var fileAndBuffer = filePaths.map(function (file) {
        return {
          filePath: file,
          buffer: _fsExtra["default"].readFile(file)
        };
      });
      return Promise.all(fileAndBuffer);
    }

    return readFilesInTempDir;
  }(),
  // Reduce Function (for readReduceAction)
  filesByTitleReduce: function () {
    function filesByTitleReduce(filesInTempDir, extraArgs, specificFunc) {
      var _this6 = this;

      return filesInTempDir.reduce(async function (accumulator, fileObj) {
        var awaitedAccumulator = await accumulator["catch"](_this6.logger.error);
        var buffer = await fileObj.buffer["catch"](_this6.logger.error);
        var lines = buffer.toString('utf-8').split('\n');
        lines = lines.map(function (line) {
          return line.replace(/#/, '').trim().toLowerCase();
        }).filter(function (line) {
          return line.length > 0;
        });
        var file = specificFunc.apply(void 0, [lines, fileObj].concat(_toConsumableArray(extraArgs)));

        if (file !== false) {
          awaitedAccumulator.push(file);
        }

        return awaitedAccumulator;
      }, Promise.resolve([]));
    }

    return filesByTitleReduce;
  }(),
  // Specific Function (for readReduceAction)
  configIgnoreByTitle: function () {
    function configIgnoreByTitle(lines, fileObj, ignoreTitles) {
      if (ignoreTitles.includes(lines.shift())) {
        return fileObj.filePath;
      }

      return false;
    }

    return configIgnoreByTitle;
  }(),
  // Specific Function (for readReduceAction)
  // returns { file path: wiki file name }
  wikiFileNameByTitle: function () {
    function wikiFileNameByTitle(lines, fileObj) {
      var returnObj = {};
      var wikiTitle = lines.shift();
      var wikiFileName = wikiTitle.replace(/\b\w/g, function (word) {
        return word.toUpperCase();
      });
      wikiFileName = wikiFileName.replace(/\s+/g, '-');

      if (fileObj.filePath) {
        returnObj[fileObj.filePath] = "".concat(wikiFileName, ".md");
      }

      return returnObj;
    }

    return wikiFileNameByTitle;
  }(),
  removeFiles: function () {
    function removeFiles(filesToRemove) {
      var cleanedFilesToRemove = filesToRemove.filter(function (file) {
        return file.length > 0;
      });
      var removeMdFilePromises = cleanedFilesToRemove.map(function (file) {
        return _fsExtra["default"].remove(file);
      });
      return Promise.all(removeMdFilePromises);
    }

    return removeFiles;
  }(),
  moveFilesToWiki: function () {
    function moveFilesToWiki(filesToMove, thisObj) {
      var cleanedFilesToMove = thisObj.cleanFilesToMove(filesToMove);
      var movedFiles = cleanedFilesToMove.map(function (wikiNameAndPath) {
        var filePath = Object.keys(wikiNameAndPath)[0];
        var wikiName = wikiNameAndPath[filePath];
        var destinationPath = filePath.split('/');
        destinationPath.pop();
        destinationPath.pop();
        destinationPath = "".concat(destinationPath.join('/'), "/").concat(wikiName);
        return _fsExtra["default"].move(filePath, destinationPath);
      });
      return Promise.all(movedFiles);
    }

    return moveFilesToWiki;
  }(),
  cleanFilesToMove: function () {
    function cleanFilesToMove(filesToMove) {
      var _this7 = this;

      var cleanedFilesToMove = filesToMove.filter(function (fileObj) {
        return Object.keys(fileObj).length > 0;
      });
      cleanedFilesToMove = cleanedFilesToMove.filter(function (fileObj) {
        var objectKey = Object.keys(fileObj)[0];
        return fileObj[objectKey].length > 0;
      });
      var existingFileNames = [];
      return cleanedFilesToMove.map(function (fileObj) {
        var returnFileObj = {};
        var filePath = Object.keys(fileObj)[0];
        var wikiFileName = fileObj[Object.keys(fileObj)[0]];

        var _this7$getUniqueFileN = _this7.getUniqueFileName(wikiFileName, existingFileNames);

        var _this7$getUniqueFileN2 = _slicedToArray(_this7$getUniqueFileN, 2);

        wikiFileName = _this7$getUniqueFileN2[0];
        existingFileNames = _this7$getUniqueFileN2[1];
        existingFileNames.push(wikiFileName);
        returnFileObj[filePath] = wikiFileName;
        return returnFileObj;
      });
    }

    return cleanFilesToMove;
  }(),
  getUniqueFileName: function () {
    function getUniqueFileName(fileName, existingNames, dupCount, safety) {
      if (!existingNames.includes(fileName)) {
        return [fileName, existingNames];
      }

      var safetyCounter = safety;

      if (!safetyCounter) {
        safetyCounter = 1;
      } else if (safetyCounter > this.safetyCounterLimit) {
        return ['safetyCounterExceeded.md', existingNames];
      }

      safetyCounter += 1;
      var fileNameArray = fileName.split('.');
      fileNameArray.pop();
      var fileNameNoExtension = fileNameArray.join('.');
      var newDupCount = dupCount;

      if (!newDupCount) {
        newDupCount = 1;
      } else {
        newDupCount += 1;
      }

      var lastDupCount = "-(".concat(newDupCount - 1, ")");
      var fileNameNoExtensionArray = fileNameNoExtension.split(lastDupCount);

      if (fileNameNoExtensionArray.length > 1) {
        fileNameNoExtensionArray.pop();
      }

      fileNameNoExtension = fileNameNoExtensionArray.join(lastDupCount);
      var newFileName = "".concat(fileNameNoExtension, "-(").concat(newDupCount, ").md");
      return this.getUniqueFileName(newFileName, existingNames, newDupCount, safetyCounter);
    }

    return getUniqueFileName;
  }(),
  removeTempDir: function () {
    function removeTempDir(wikiDirPath) {
      return _fsExtra["default"].remove("".concat(wikiDirPath).concat(this.tempWikiDir));
    }

    return removeTempDir;
  }()
};
exports["default"] = _default;
