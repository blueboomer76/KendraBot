const {Client, Collection, RichEmbed} = require("discord.js"),
	{capitalize} = require("./modules/functions.js"),
	config = require("./config.json"),
	fs = require("fs"),
	request = require("request"),
	Parser = require("rss-parser");

class KFSDiscordBot extends Client {
	constructor(options) {
		super(options);
		this.ownerIDs = config.ownerIDs;
		this.adminIDs = config.adminIDs;
		this.botModIDs = config.botModIDs;
		this.moderatorIDs = config.moderatorIDs;
		this.supportIDs = config.supportIDs;
		this.commands = new Collection();
		this.aliases = new Collection();
		this.categories = [];
		this.prefix = config.prefix;
		this.permLevels = [
			{
				name: "User",
				validate: () => true
			},
			{
				name: "Server Owner",
				validate: message => {
					if (!message.guild) return false;
					return message.guild.owner.user.id == message.author.id;
				}
			},
			{
				name: "Bot Support",
				validate: message => this.supportIDs.includes(message.author.id)
			},
			{
				name: "Bot Moderator",
				validate: message => this.moderatorIDs.includes(message.author.id)
			},
			{
				name: "Bot Admin",
				validate: message => this.adminIDs.includes(message.author.id)
			},
			{
				name: "Bot Owner",
				validate: message => this.ownerIDs.includes(message.author.id)
			}
		];
		this.cache = {
			guildCount: 0,
			userCount: 0,
			channelCount: 0,
			phone: {channels: [], msgCount: 0, lastMsgTime: 0, timeout: null},
			recentCommands: [],
			cumulativeStats: {
				duration: 0,
				commandTotal: 0,
				callTotal: 0,
				messageTotal: 0,
				lastSorted: 0,
				commandUsages: {}
			},
			stats: {
				commandCurrentTotal: 0,
				commandSessionTotal: 0,
				callCurrentTotal: 0,
				callSessionTotal: 0,
				messageCurrentTotal: 0,
				messageSessionTotal: 0,
				commandUsages: {},
				lastCheck: Date.now()
			},
			status: {randomIters: 0, pos: 0}
		};
		this.connectionRetries = 0;
	}

	loadCommands(altdir) {
		const dir = altdir || "./commands/";
		fs.readdir(dir, (err, files) => {
			if (err) throw err;
			const cmdFiles = files.filter(f => f.endsWith(".js"));
			if (cmdFiles.length > 0) {
				for (const fileName of cmdFiles) {
					const rawCategory = fileName.split(".").shift(),
						category = capitalize(rawCategory.replace(/-/g, " "));
					let commandClasses;
					try {
						commandClasses = require(dir + rawCategory + ".js");
					} catch(err) {
						console.error(`The category ${category} failed to load due to:`, err instanceof Error ? err.message : err);
						continue;
					}
					this.categories.push(category);
					if (commandClasses.length > 0) {
						for (const CommandClass of commandClasses) {
							const command = new CommandClass();
							command.category = category;
							this.commands.set(command.name, command);
							if (command.aliases.length > 0) {
								for (const alias of command.aliases) this.aliases.set(alias, command.name);
							}
						}
						console.log(`${commandClasses.length} commands have been loaded in the category ${category}.`);
					} else {
						console.log("No commands found in the category " + category);
					}
				}
			} else {
				const err = "No command files or commands found in the directory: " + dir;
				if (altdir) {console.error(err)} else {throw new Error(err)}
			}
			this.categories.sort();
		});
	}

	loadEvents() {
		fs.readdir("./events/", (err, files) => {
			if (err) throw err;
			const evFiles = files.filter(f => f.endsWith(".js"));
			if (evFiles.length > 0) {
				for (const eventFile of evFiles) {
					const eventName = eventFile.split(".")[0], ev = require("./events/" + eventFile);
					this.on(eventName, ev.bind(null, this));
					delete require.cache[require.resolve("./events/" + eventFile)];
				}
				console.log(evFiles.length + " events have been loaded.");
			} else {
				throw new Error("No events found");
			}
		});
	}

	logStats(writeSync = false) {
		const cachedStats = this.cache.stats,
			cumulativeStats = this.cache.cumulativeStats;

		cumulativeStats.duration += Date.now() - cachedStats.lastCheck;

		const cachedUsages = cachedStats.commandUsages,
			storedUsages = cumulativeStats.commandUsages;
		let commandCurrentTotal = cachedStats.commandCurrentTotal;
		for (const cmdName in cachedUsages) {
			storedUsages[cmdName] = (storedUsages[cmdName] || 0) + cachedUsages[cmdName];
			commandCurrentTotal += cachedUsages[cmdName];
		}
		cumulativeStats.commandTotal += commandCurrentTotal;
		cumulativeStats.callTotal += cachedStats.callCurrentTotal;
		cumulativeStats.messageTotal += cachedStats.messageCurrentTotal;

		if (Date.now() > cumulativeStats.lastSorted + 1000 * 86400 * 7) {
			cumulativeStats.lastSorted = Date.now();
			const tempNames = Object.keys(storedUsages),
				tempUses = Object.values(storedUsages),
				tempArray = [],
				newUsages = {};
			for (let i = 0; i < tempNames.length; i++) {
				tempArray.push({name: tempNames[i], uses: tempUses[i]});
			}
			tempArray.sort((a, b) => b.uses - a.uses);
			for (let i = 0; i < tempArray.length; i++) {
				newUsages[tempArray[i].name] = tempArray[i].uses;
			}
			cumulativeStats.commandUsages = newUsages;
		}

		cachedStats.commandSessionTotal += commandCurrentTotal;
		cachedStats.commandCurrentTotal = 0;
		cachedStats.callSessionTotal += cachedStats.callCurrentTotal;
		cachedStats.callCurrentTotal = 0;
		cachedStats.messageSessionTotal += cachedStats.messageCurrentTotal;
		cachedStats.messageCurrentTotal = 0;
		cachedStats.commandUsages = {};
		cachedStats.lastCheck = Date.now();

		const jsonString = JSON.stringify(cumulativeStats, null, 4);
		if (writeSync) {
			fs.writeFileSync("modules/stats.json", jsonString);
		} else {
			return new Promise((resolve, reject) => {
				fs.writeFile("modules/stats.json", jsonString, err => {
					if (err) reject(err);
					resolve();
				});
			});
		}
	}

	checkRemoteRequest(site, err, res) {
		if (err) return `Could not request to ${site}: ${err.message} (${err.code})`;
		if (!res) return `No response was received from ${site}.`;
		if (res.statusCode >= 400) return `An error has been returned from ${site}: ${res.statusCode} (${res.statusMessage}). Try again later.`;
		return true;
	}

	// General function for posting stats
	postStatsToWebsite(website, requestHeader, requestBody) {
		request.post({
			url: website,
			headers: requestHeader,
			body: requestBody,
			json: true
		}, (err, res) => {
			const requestRes = this.checkRemoteRequest(website, err, res);
			if (requestRes != true) {
				console.error(`[Stats Posting] ${requestRes}`);
			} else {
				console.log(`[Stats Posting] Stats successfully posted to ${website}`);
			}
		});
	}

	postMeme() {
		request.get({
			url: "https://reddit.com/r/memes/hot.json",
			json: true
		}, (err, res) => {
			const requestRes = this.checkRemoteRequest("Reddit", err, res);
			if (requestRes != true) {
				console.error(`Failed to obtain a meme from Reddit: ${requestRes}`);
			} else {
				const meme = res.body.data.children.filter(r => !r.data.stickied)[0].data;
				this.channels.get(config.memeFeedChannel).send(new RichEmbed()
					.setTitle(meme.title)
					.setURL("https://reddit.com" + meme.permalink)
					.setColor(Math.floor(Math.random() * 16777216))
					.setFooter(`👍 ${meme.score} | 💬 ${meme.num_comments} | By: ${meme.author}`)
					.setImage(meme.url)
				);
			}
		});
	}

	postRSSFeed(amt = 1) {
		const parser = new Parser();
		parser.parseURL(config.rssFeedWebsites[Math.floor(Math.random() * config.rssFeedWebsites.length)])
			.then(feed => {
				const urlList = [];
				for (let i = 0; i < amt; i++) {
					urlList.push(feed.items.splice(Math.floor(Math.random() * feed.items.length), 1)[0].link);
				}
				this.channels.get(config.rssFeedChannel).send(urlList.join("\n"));
			});
	}

	// Functions related to the phone command
	async handlePhoneMessage(message) {
		const phoneCache = this.cache.phone;
		if (this.checkDeletedPhoneChannels(this)) return;

		const toSend = message.cleanContent.replace(/https?:\/\/\S+\.\S+/gi, "")
				.replace(/(www\.)?(discord\.(gg|me|io)|discordapp\.com\/invite)\/[0-9a-z]+/gi, ""),
			affected = message.channel.id == phoneCache.channels[0].id ? 1 : 0;

		phoneCache.lastMsgTime = Date.now();
		phoneCache.msgCount++;
		setTimeout(() => phoneCache.msgCount--, 5000);

		phoneCache.channels[affected].send(`📞 ${toSend}`);
		if (phoneCache.msgCount > 4) {
			this.resetPhone(this, "☎️ The phone connection was cut off due to being overloaded.");
		}
	}

	async checkPhone(bot) {
		const phoneCache = bot.cache.phone;
		if (bot.checkDeletedPhoneChannels(bot)) return;

		const dif = Date.now() - phoneCache.lastMsgTime;
		if (dif < 1000*3595) {
			phoneCache.timeout = setTimeout(bot.checkPhone, dif, bot);
		} else {
			bot.resetPhone(bot, "⏰ The phone call has timed out due to inactivity.");
		}
	}

	resetPhone(bot, phoneMsg) {
		const phoneCache = bot.cache.phone;
		if (phoneMsg) {
			phoneCache.channels[0].send(phoneMsg);
			phoneCache.channels[1].send(phoneMsg);
		}
		phoneCache.channels = [];

		let phoneTimeout = phoneCache.timeout;
		if (phoneTimeout) {clearTimeout(phoneTimeout); phoneTimeout = null}
	}

	checkDeletedPhoneChannels(bot) {
		const phoneCache = bot.cache.phone,
			ch0deleted = phoneCache.channels[0] ? phoneCache.channels[0].deleted : null,
			ch1deleted = phoneCache.channels[1] ? phoneCache.channels[1].deleted : null;
		if (ch0deleted == true || ch1deleted == true) {
			const phoneMsg = "⚠ The other side has deleted their channel for which the phone call was made.";
			if (ch0deleted == true && ch1deleted == false) {
				phoneCache.channels[1].send(phoneMsg);
			} else if (ch0deleted == false && ch1deleted == true) {
				phoneCache.channels[0].send(phoneMsg);
			}
			bot.resetPhone(bot);
			return true;
		}
		return false;
	}
}

module.exports = KFSDiscordBot;
