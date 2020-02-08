**Note**: *Some changes, especially command additions in more recent versions, have been compacted into some versions in this changelog.*

*The full changelog is available on the Discord support server.*

# 1.X (current)

## 1.6.0
- Removed unnecessary commands and audio dependencies from the repository (now considered as advanced topics)
- Made many changes to the bot

## 1.5.21
- Bumped `twemoji` dependency to version 12 and remove its file system lookups
- Added "float" argument type for floating-point numbers
- Added a new check for system architecture, preventing the bot from starting if `process.arch` is "ia32" (64-bit is required)

## 1.5.17
- Added option to add cooldown messages in the cooldown checker by config
- Changed argument quote parser to use a shared function to find arguments that fit quote-related regexes
- Fixed styling of code with more ESLint rules, such as brace use with one-line if statements
- Reorganized duration and large number parsers in `modules/functions.js` along with renaming of variables to make it more understandable

## 1.5.12
- Added "color" argument type
- Changed Reddit fetching methods to accept objects

## 1.5.7
- Added a new argument property "allowRaw" to allow some unresolved objects to be handled in commands
- Allowed the argument parser to be able to parse non-strings seperately
- Made the paginator use the RichEmbed class from `discord.js`
- Added a ready seperator in the command line to distinguish between bot sessions
- Changed conditions for logging a reconnecting event

## 1.5.4
- Improved the handling of role permissions of most moderation commands
- Edited methods for getting the amount of each type of channel and presence in a server
- Changed the behavior and logged messages when the bot fails to reconnect
- Changed `console.log` and `process.exit` expressions to more relevant ones with the appropriate values

## 1.5.0
- Changed the storage method of command usage from array to object form
- Added the command usage from `modules/stats.json` to the bot cache
- Adapted more precise methods for measuring the execution time of functions
- Edited associated depreciations with `discord.js` version 11.5
- Added `mathjs` dependency
- Simplified many expressions to use ternary operators or other efficient forms

## 1.4.17
- Renamed and changed moderation command descriptions and operations
- Added a new check for `commands/advanced` for advanced-level commands

## 1.4.11
- Added a way to store cumulative bot stats to its cache
- Edited the bot method for writing bot stats

## 1.4.8
- Changed `Number(new Date())` to `Date.now()` in expressions requiring a numbered date
- Reworded many of the event messages and added timestamps for better understanding
- Changed system of handling remote HTTP request errors
- Changed handling of Reddit-based commands when a non-regular image URL is embedded
- Added many options to purge command

## 1.4.3
- Added emoji support (both custom and default) for inputs to image commands
- Added `gifencoder`, `svg2png`, and `twemoji` dependencies
- Moved some code into the image manager

## 1.4.0
- Added more advanced image commands with customizable text
- Added more commands in many categories
- Changed the wording in some error messages
- Moved some commands in Image category into a new category Image Editing

## 1.3.41
- Fixed many bugs in the code in various parts
- Changed object deletion detection methods to those such as `message.channel.messages.has("some message ID")`

## 1.3.40
- Added bot methods for posting memes and RSS feeds along with their configs

## 1.3.38
- Added ESLint to dependencies and formatted code to its rules
- Fixed bugs and added more utility to commands

## 1.3.35
- Added grouped cooldown support

## 1.3.34
- Added subcommand support to commands
- Changed resolvers to use promises instead
- Added a few commands in multiple categories

## 1.3.27
- Added support for posting to botsfordiscord.com
- Added time since bot creation to bot stats related commands

## 1.3.24
- Added consistency for command error displaying
- Added options for executing functions after a command has finished executing
- Changed the stats posting link for bots.discord.pw to bots.ondiscord.xyz

## 1.3.17
- Added new commands: rolemembers, birb, and joke
- Separated stats command into two parts: one for the bot and one for the host
- Removed unnecessary require() calls
- Changed some "let" declarations to "const"
- Moved cat and dog commands to Image category

## 1.3.12
- Added an "nsfw" property to commands

## 1.3.9
- Added new commands: emoji, xkcd, and removenickname
- Allowed object resolver to now resolve emojis

## 1.3.7
- Changed argument structure: "num" is no longer a property and is replaced with "infiniteArgs"
- Fix errors in event listeners

## 1.3.4
- Added more image commands

## 1.3.0
- Added a new category Text Editing

## 1.2.26
- Move commands into category files; `commands` now has no subfolders.
- Added author to reddit and meme commands; added timestamp to reddit command
- Made various bot improvements

## 1.2.17
- Changed argument parser to show alerts if multiple roles, channels, or members are matched
- Adjusted the way bot mentions are handled

## 1.2.14
- Moved commands in Bot category to Core category

## 1.2.8
- Added Search category
- Added more music commands
- Changed `superagent` dependency to `request`

## 1.2.0
- Added music commands (in beta)
- Made command, module, and util bug fixes

## 1.1.3
- Added a new category Games

## 1.1.0
- Added a more advanced argument parser and paginator
- Changed commands into class form
- Added new commands, including say and quote
- Added flag options to some commands

## 1.0.0
Initial 1.X version

# 0.X (beta)
## 0.5.0
- Reimplemented cooldowns
- Simplified permission system
- Added Direct Message checks

## 0.4.0
- Added member finder
- Moved events to its own folder
- Simplified `index.js` code
- Improved the alias system

## 0.3.1
- Added new category Moderation
- Removed phone command and some more code from `index.js`

## 0.3.0
- Added an alias system
- Added config properties to some commands

## 0.2.5
- Added role info, bot info, user info, invite, and server info commands
- Fixed error console log messages when there are code errors
- Tweaked other commands

## 0.2.0
- Added command handler to prevent `index.js` from becoming too large
- Added some basic commands

## 0.1.0
Initial 0.X version
