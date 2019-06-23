Sync your github wiki with markdown
files in your project.

# Setup

`npm install wiki-builder --save-dev`

Create a file named wikiConfig.json

```
{
  "wikiDirPath": "",
  "projectDirPath": "",
  "ignoreMdFiles": [],
  "ignoreMdTitles": [],
  "ignoreDirs": [],
  "statsEnabled": false,
  "useGitignore": true,
  "plugins": []
}
```

**wikiDirPath:** Path to wiki directory. ./wiki/ by default.

**projectDirPath:** Path to project directory. ./ by default.

**ignoreMdFiles:** List of files to not add to the wiki. 
To ignore specific files, include the path (example: ./readme.md) 
To ignore files by file name, don't include the path (example: readme.md)

**ignoreMdTitles:** Ignore by the first line of markdown files.

**ignoreDirs:** List of directories to ignore. Includes node_modules.

**statsEnabled:** Creates a stats markdown file for the wiki. This file can 
only be created for git repositories with commits. False by default.

**useGitignore:** Ignore directories and markdown files in 
.gitignore. True by default.

**plugins:** Add plugins here. These plugins should have 
 corresponding local node modules. If the node_modules directory is not 
in the same directory as the project's root, give the module 
(plugin) path instead of it's name. Example Usage: ["plugin-one", "plugin-two"].

# Usage

Run `wiki-builder`. 

package.json example:
```
"scripts": {
    "wiki": "wiki-builder"
  }
```

`wiki-builder` puts files into the 'wikiDirPath'. If you do 
not have a github wiki git submodule, [you can make one.](https://brendancleary.com/2013/03/08/including-a-github-wiki-in-a-repository-as-a-submodule/)
