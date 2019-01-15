const {RichEmbed, version} = require("discord.js"),
	Command = require("../structures/command.js"),
	{capitalize, getDuration, parsePerm} = require("../modules/functions.js"),
	paginator = require("../utils/paginator.js"),
	packageInfo = require("../package.json"),
	os = require("os");

module.exports = [
	class BotInfoCommand extends Command {
		constructor() {
			super({
				name: "botinfo",
				description: "Get general info about the bot",
				aliases: ["about", "bot", "info"],
				allowDMs: true,
				cooldown: {
					time: 60000,
					type: "guild"
				},
				perms: {
					bot: ["EMBED_LINKS"],
					user: [],
					level: 0
				}
			});
		}
		
		async run(bot, message, args, flags) {
			message.channel.send(new RichEmbed()
				.setAuthor("About this bot", bot.user.avatarURL)
				.setDescription("This is an actively developed bot that not only has fun, moderation, utility commands, but a phone command for calling other servers, and combines features from popular bots.")
				.setColor(Math.floor(Math.random() * 16777216))
				.setFooter(`Bot ID: ${bot.user.id}`)
				.addField("Library", `Discord.js v${version}`, true)
				.addField("Bot Version", packageInfo.version, true)
				.addField("Bot created", getDuration(bot.user.createdTimestamp), true)
				.addField("Quick Stats", `${bot.cache.guildCount} Servers\n${bot.cache.userCount} Users\n${bot.cache.channelCount} Channels`, true)
				.addField("Bot Invite", `[Go!](https://discordapp.com/oauth2/authorize?client_id=${bot.user.id}&permissions=405921878&scope=bot)`, true)
				.addField("Support Server", "[Go!](https://discord.gg/yB8TvWU)", true)
				.addField("Upvote this bot", "discordbots.org: [Go!](https://discordbots.org/bots/333058410465722368/vote)" + "\n" +
				"bots.ondiscord.xyz: [Go!](https://bots.ondiscord.xyz/bots/333058410465722368)" + "\n" +
				"botsfordiscord.com: [Go!](https://botsfordiscord.com/bots/333058410465722368/vote)", true)
			);
		}
	},
	class HelpCommand extends Command {
		constructor() {
			super({
				name: "help",
				description: "Get help for a command, or see all commands available.",
				allowDMs: true,
				args: [
					{
						optional: true,
						type: "command"
					}
				],
				cooldown: {
					time: 8000,
					type: "user"
				},
				flags: [
					{
						name: "dm",
						desc: "Sends the help message to DMs instead"
					},
				],
				perms: {
					bot: ["EMBED_LINKS"],
					user: [],
					level: 0
				},
				usage: "help [command] [--dm]"
			});
		}
		
		async run(bot, message, args, flags) {
			const command = args[0], helpEmbed = new RichEmbed();
			if (!command) {
				helpEmbed.setTitle("All bot commands")
					.setDescription(`Use \`${bot.prefix}help <command>\` to get help for a command, e.g. \`${bot.prefix}help urban\``)
					.setColor(Math.floor(Math.random() * 16777216))
					.setFooter(`There are ${bot.commands.size} commands in total.`);
				let cmds = bot.commands;
				if (!bot.ownerIDs.includes(message.author.id) && !bot.adminIDs.includes(message.author.id)) {
					cmds = cmds.filter(cmd => !cmd.disabled && !cmd.hidden);
				}
				for (let i = 0; i < bot.categories.length; i++) {
					const cmdsInCat = cmds.filter(cmd => cmd.category == bot.categories[i]).map(cmd => cmd.name);
					helpEmbed.addField(bot.categories[i], cmdsInCat.join(", "));
				}
			} else {
				const commandFlags = command.flags.map(f => `\`--${f.name}\` (\`-${f.name.charAt(0)}\`): ${f.desc}`),
					commandPerms = command.perms,
					permReq = {
						bot: commandPerms.bot.length > 0 ? commandPerms.bot.map(p => parsePerm(p)).join(", ") : "None",
						user: commandPerms.user.length > 0 ? commandPerms.user.map(p => parsePerm(p)).join(", ") : "None",
						role: commandPerms.role ? `\nRequires having a role named ${commandPerms.role}.` : "",
						level: commandPerms.level > 0 ? `\nRequires being ${bot.permLevels[commandPerms.level].name}.` : ""
					};

				helpEmbed.setTitle(`Help - ${command.name}`)
					.setColor(Math.floor(Math.random() * 16777216))
					.setFooter("Don't include the usage symbols when running the command.")
					.addField("Category", command.category)
					.addField("Description", command.description);
				if (command.aliases.length > 0) helpEmbed.addField("Aliases", command.aliases.join(", "));
				if (command.flags.length > 0) helpEmbed.addField("Options", commandFlags.join("\n"));
				helpEmbed.addField("Usage", "`" + bot.prefix + command.usage + "`");
				if (command.examples.length > 0) helpEmbed.addField("Examples", command.examples.join("\n"));
				if (command.allowDMs) helpEmbed.addField("Allows DMs", "Yes");
				if (commandPerms.bot.length > 0 || commandPerms.user.length > 0 || commandPerms.role || commandPerms.level > 0) {
					helpEmbed.addField("Permissions", `Bot - ${permReq.bot}\nUser - ${permReq.user}${permReq.role}${permReq.level}`);
				}
				helpEmbed.addField("Cooldown", command.cooldown.time != 0 ? `${command.cooldown.time / 1000} seconds per ${command.cooldown.type}` : "None");
			}
			if (flags.some(f => f.name == "dm")) {
				message.member.send(helpEmbed)
					.catch(() => message.channel.send("Failed to send a help message as a DM. Check your settings and try again."));
			} else {
				message.channel.send(helpEmbed);
			}
		}
	},
	class InviteCommand extends Command {
		constructor() {
			super({
				name: "invite",
				description: "Get info about inviting the bot, joining the bot's server, or its references",
				allowDMs: true,
				cooldown: {
					time: 30000,
					type: "guild"
				},
				perms: {
					bot: ["EMBED_LINKS"],
					user: [],
					level: 0
				}
			});
		}
		
		async run(bot, message, args, flags) {
			message.channel.send(new RichEmbed()
				.setTitle("Bot References")
				.setDescription("Exciting! Now you have the chance to spread the love!")
				.setColor(Math.floor(Math.random() * 16777216))
				.addField("Bot Invite", `[Go!](https://discordapp.com/oauth2/authorize?client_id=${bot.user.id}&permissions=405921878&scope=bot)`, true)
				.addField("Support Server", "[Go!](https://discord.gg/yB8TvWU)", true)
				.addField("Upvote this bot", "discordbots.org: [Go!](https://discordbots.org/bots/333058410465722368/vote)" + "\n" +
				"bots.ondiscord.xyz: [Go!](https://bots.ondiscord.xyz/bots/333058410465722368)" + "\n" +
				"botsfordiscord.com: [Go!](https://botsfordiscord.com/bots/333058410465722368/vote)", true)
			);
		}
	},
	class LoadCommand extends Command {
		constructor() {
			super({
				name: "load",
				description: "Loads a command",
				allowDMs: true,
				args: [
					{
						allowQuotes: true,
						infiniteArgs: true,
						type: "string"
					},
					{
						type: "string"
					},
					{
						optional: true,
						type: "string"
					}
				],
				cooldown: {
					time: 0,
					type: "user"
				},
				hidden: true,
				perms: {
					bot: [],
					user: [],
					level: 4
				},
				usage: "load <category> <command> [command class name]"
			});
		}
		
		async run(bot, message, args, flags) {
			const category = capitalize(args[0]), commandName = args[1].toLowerCase();
			
			if (bot.commands.has(commandName)) return {cmdErr: "A command with that name is already loaded."};
			try {
				delete require.cache[require.resolve(`./${category.toLowerCase().replace(/ /g, "-")}.js`)];
				const commandClasses = require(`./${category.toLowerCase().replace(/ /g, "-")}.js`),
					CommandClass = commandClasses.find(c => c.name.toLowerCase().slice(0, c.name.length - 7) == (args[2] ? args[2].toLowerCase() : commandName));
				let newCommand;
				try {
					newCommand = new CommandClass();
				} catch(err2) {
					return {cmdWarn: "You need to give a third argument for the class name, replacing all numbers in the command with the word."};
				}
				newCommand.category = capitalize(category, true);
				bot.commands.set(commandName, newCommand);
				if (newCommand.aliases.length > 0) {
					for (const alias of newCommand.aliases) bot.aliases.set(alias, newCommand.name);
				}
				message.channel.send(`The command ${commandName} was loaded.`);
			} catch(err) {
				message.channel.send(`A problem has occurred: \`${err}\``);
			}
		}
	},
	class PhoneCommand extends Command {
		constructor() {
			super({
				name: "phone",
				description: "Chat with other servers on the phone!",
				aliases: ["telephone"],
				cooldown: {
					time: 60000,
					type: "channel"
				}
			});
		}
		
		async run(bot, message, args, flags) {
			const phoneCache = bot.cache.phone;
			let phoneMsg, phoneMsg0;
			if (!phoneCache.channels.some(c => c.id == message.channel.id)) {
				phoneCache.channels.push(message.channel);
				if (phoneCache.channels.length == 1) {
					message.react("☎");
				} else {
					bot.cache.stats.callCurrentTotal++;
					phoneCache.lastMsgTime = Number(new Date());
					phoneCache.timeout = setTimeout(bot.checkPhone, 1000*3600, bot);
					
					message.channel.send("☎ A phone connection has started! Greet the other side!");
					if (phoneCache.channels.length == 2) {
						phoneMsg0 = "The other side has picked up the phone! Greet the other side!";
					} else {
						phoneMsg0 = "Looks like someone else picked up the phone.";
						phoneCache.channels.shift().send("☎ Someone else is now using the phone...");
					}
					phoneCache.channels[0].send(`☎ ${phoneMsg0}`);
				}
			} else {
				if (phoneCache.channels.length == 1) {
					phoneMsg = "There was no response from the phone, hanging it up.";
				} else {
					let affected = 0;
					if (message.channel.id == phoneCache.channels[0].id) affected = 1;
					phoneMsg = "You have hung up the phone.";
					phoneCache.channels[affected].send("☎ The other side hung up the phone.");
				}
				bot.resetPhone(bot);
				message.channel.send(`☎ ${phoneMsg}`);
			}
		}
	},
	class PingCommand extends Command {
		constructor() {
			super({
				name: "ping",
				description: "Get bot ping and latency",
				allowDMs: true,
				cooldown: {
					time: 15000,
					type: "channel"
				}
			});
		}
		
		async run(bot, message, args, flags) {
			message.channel.send("Ping?")
				.then(msg => {
					msg.edit(`🏓 **Pong!**\nLatency: ${msg.createdTimestamp - message.createdTimestamp}ms\nAPI Latency: ${Math.round(bot.ping)}ms`);
				});
		}
	},
	class ReloadCommand extends Command {
		constructor() {
			super({
				name: "reload",
				description: "Reload a command. It must be a command that is already loaded",
				allowDMs: true,
				args: [
					{
						type: "command"
					},
					{
						optional: true,
						type: "string"
					}
				],
				cooldown: {
					time: 0,
					type: "user"
				},
				hidden: true,
				perms: {
					bot: [],
					user: [],
					level: 4
				},
				usage: "reload <command> [command class name]"
			});
		}
		
		async run(bot, message, args, flags) {
			const command = args[0],
				commandName = command.name,
				category = command.category;
			try {
				delete require.cache[require.resolve(`./${category.toLowerCase().replace(/ /g, "-")}.js`)];
				const commandClasses = require(`./${category.toLowerCase().replace(/ /g, "-")}.js`),
					CommandClass = commandClasses.find(c => c.name.toLowerCase().slice(0, c.name.length - 7) == (args[1] ? args[1].toLowerCase() : commandName));
				let newCommand;
				try {
					newCommand = new CommandClass();
				} catch(err2) {
					return {cmdWarn: "You need to provide a second argument for the class name, replacing all numbers in the command with the word."};
				}
				newCommand.category = category;
				bot.commands.set(commandName, newCommand);
				if (newCommand.aliases.length > 0) {
					const toRemoveAliases = bot.aliases.filter(alias => alias == commandName);
					for (const alias of toRemoveAliases.keys()) {
						bot.aliases.delete(alias);
					}
					for (const alias of newCommand.aliases) { 
						bot.aliases.set(alias, newCommand.name);
					}
				}
				message.react("✅");
			} catch(err) {
				message.channel.send(`An error has occurred: \`${err}\``);
			}
		}
	},
	class ReloadFileCommand extends Command {
		constructor() {
			super({
				name: "reloadfile",
				description: "Reload a file",
				allowDMs: true,
				args: [
					{
						infiniteArgs: true,
						type: "string"
					}
				],
				cooldown: {
					time: 0,
					type: "user"
				},
				hidden: true,
				perms: {
					bot: [],
					user: [],
					level: 5
				},
				usage: "reloadfile <file path>"
			});
		}
		
		async run(bot, message, args, flags) {
			try {
				const res = delete require.cache[require.resolve(`../${args[0]}`)];
				if (res) {
					message.channel.send(`The file ${args[0]} was reloaded and its require.cache has been cleared.`);
				} else {
					message.channel.send("Failed to reload that file.");
				}
			} catch(err) {
				message.channel.send(`Couldn't reload file: \`${err}\``);
			}
		}
	},
	class ShutdownCommand extends Command {
		constructor() {
			super({
				name: "shutdown",
				description: "Shuts down the bot and kills its process",
				allowDMs: true,
				cooldown: {
					time: 0,
					type: "user"
				},
				hidden: true,
				perms: {
					bot: [],
					user: [],
					level: 4
				}
			});
		}
		
		async run(bot, message, args, flags) {
			message.channel.send("Shutting down the bot in 10 seconds...");
			bot.logStats();
			setTimeout(() => {
				bot.destroy();
				process.exit(0);
			}, 10000);
		}
	},
	class StatsCommand extends Command {
		constructor() {
			super({
				name: "stats",
				description: "Get detailed stats for the bot",
				aliases: ["botstats"],
				allowDMs: true,
				args: [
					{
						optional: true,
						shiftable: true,
						type: "oneof",
						allowedValues: ["processor"]
					}
				],
				cooldown: {
					time: 60000,
					type: "guild"
				},
				perms: {
					bot: ["EMBED_LINKS"],
					user: [],
					level: 0
				},
				usage: "stats [processor]"
			});
		}
		
		async run(bot, message, args, flags) {
			const statsEmbed = new RichEmbed()
				.setColor(Math.floor(Math.random() * 16777216))
				.setTimestamp(message.createdAt);
			
			if (args[0] == "processor") {
				statsEmbed.setAuthor("Bot Stats - Processor", bot.user.avatarURL);
				this.getProcessorStats(message, statsEmbed);
			} else {
				const storedStats = require("../modules/stats.json"),
					processUptime = process.uptime() * 1000,
					duration = storedStats.duration + (Number(new Date()) - bot.cache.stats.lastCheck);
				const beginEval = new Date();
				const serverCount = bot.guilds.size,
					bigServerCount = bot.guilds.filter(g => g.large).size,
					userCount = bot.users.size,
					onlineUserCount = bot.users.filter(u => u.presence.status != "offline").size,
					textChannelCount = bot.channels.filter(chnl => chnl.type == "text").size,
					voiceChannelCount = bot.channels.filter(chnl => chnl.type == "voice").size,
					categoryCount = bot.channels.filter(chnl => chnl.type == "category").size;
				let commandCurrentTotal = bot.cache.stats.commandCurrentTotal;
				for (const usageCacheEntry of bot.cache.stats.commandUsages) {
					commandCurrentTotal += usageCacheEntry.uses;
				}
				const sessionCommands = bot.cache.stats.commandSessionTotal + commandCurrentTotal,
					totalCommands = storedStats.commandTotal + commandCurrentTotal,
					sessionCalls = bot.cache.stats.callSessionTotal + bot.cache.stats.callCurrentTotal,
					totalCalls = storedStats.callTotal + bot.cache.stats.callCurrentTotal,
					sessionMessages = bot.cache.stats.messageSessionTotal + bot.cache.stats.messageCurrentTotal,
					totalMessages = storedStats.messageTotal + bot.cache.stats.messageCurrentTotal;
				
				const endEval = new Date();
				
				statsEmbed.setAuthor("Bot Stats", bot.user.avatarURL)
					.setFooter(`⏰ Took: ${((endEval - beginEval) / 1000).toFixed(2)}s | Stats as of`)
					.setDescription(`Here's some detailed stats about this bot! *To see stats about the bot host, use \`${bot.prefix}stats processor\`*`)
					.addField("Bot created", getDuration(bot.user.createdTimestamp), true)
					.addField("Last Ready", getDuration(bot.readyTimestamp), true)
					.addField("Servers", 
						`Total: ${serverCount.toLocaleString()}` + "\n" +
						`Large: ${bigServerCount.toLocaleString()} (${(bigServerCount * 100 / serverCount).toFixed(1)}%)`
						, true)
					.addField("Users",
						`Total: ${userCount.toLocaleString()} (${(userCount / serverCount).toFixed(1)}/server)` + "\n" +
						`Online: ${onlineUserCount.toLocaleString()} (${(onlineUserCount / userCount * 100).toFixed(1)}%)`
						, true)
					.addField("Channels",
						`Text: ${textChannelCount.toLocaleString()} (${(textChannelCount / serverCount).toFixed(2)}/server)` + "\n" +
						`Voice: ${voiceChannelCount.toLocaleString()} (${(voiceChannelCount / serverCount).toFixed(2)}/server)` + "\n" +
						`Categories: ${categoryCount.toLocaleString()} (${(categoryCount / serverCount).toFixed(2)}/server)`
						, true)
					.addField("Commands",
						`Session: ${sessionCommands.toLocaleString()} (${this.setRate(sessionCommands, processUptime)})` + "\n" +
						`Total: ${totalCommands.toLocaleString()} (${this.setRate(totalCommands, duration)})`
						, true)
					.addField("Phone Connections",
						`Session: ${sessionCalls.toLocaleString()} (${this.setRate(sessionCalls, processUptime)})` + "\n" +
						`Total: ${totalCalls.toLocaleString()} (${this.setRate(totalCalls, duration)})`
						, true)
					.addField("Messages Seen",
						`Session: ${sessionMessages.toLocaleString()} (${this.setRate(sessionMessages, processUptime)})` + "\n" +
						`Total: ${totalMessages.toLocaleString()} (${this.setRate(totalMessages, duration)})`
						, true);
				message.channel.send(statsEmbed);
			}
		}

		setRate(amount, duration) {
			const amtPerDay = amount / duration * 8.64e+7;
			if (amtPerDay > 43200) {
				return `${(amtPerDay/86400).toFixed(2)}/sec`;
			} else if (amtPerDay > 720) {
				return `${(amtPerDay/1440).toFixed(2)}/min`;
			} else if (amtPerDay > 12) {
				return `${(amtPerDay/24).toFixed(2)}/hr`;
			} else {
				return `${amtPerDay.toFixed(2)}/day`;
			}
		}
		
		getProcessorStats(message, processorEmbed) {
			const totalMemory = os.totalmem(),
				freeMemory = os.freemem(),
				usedMemory = totalMemory - freeMemory,
				cpus = os.cpus(),
				processMemoryUsage = process.memoryUsage(),
				heapTotal = processMemoryUsage.heapTotal,
				heapUsed = processMemoryUsage.heapUsed,
				cpuUsage1 = [];
			
			for (const cpu of cpus) {
				cpuUsage1.push({
					idle: cpu.times.idle,
					nonidle: Object.values(cpu.times).reduce((prev, val) => prev + val) - cpu.times.idle
				});
			}
			
			processorEmbed.setDescription("Here's some detailed stats about the host that this bot is on!")
				.addField("Total Resident Set (RSS)", `${(processMemoryUsage.rss / 1048576).toFixed(2)} MB`, true)
				.addField("Heap Usage", `Total: ${(processMemoryUsage.heapTotal / 1048576).toFixed(2)} MB`+ "\n" + 
				`Used: ${(processMemoryUsage.heapUsed / 1048576).toFixed(2)} MB (${(heapUsed / heapTotal * 100).toFixed(1)}%)`, true)
				.addField("Memory", `Total: ${(totalMemory / 1073741824).toFixed(2)} GB` + "\n" +
				`Used: ${(usedMemory / 1073741824).toFixed(2)} GB (${(usedMemory / totalMemory * 100).toFixed(1)}%)` + "\n" +
				`Free: ${(freeMemory / 1073741824).toFixed(2)} GB (${(freeMemory / totalMemory * 100).toFixed(1)}%)`, true);
			
			setTimeout(this.postProcessorStats, 250, message, processorEmbed, cpuUsage1);
		}
		
		postProcessorStats(message, processorEmbed, cpuUsage1) {
			const cpuUsage2 = [], cpus = os.cpus();
			for (const cpu of cpus) {
				cpuUsage2.push({
					idle: cpu.times.idle,
					nonidle: Object.values(cpu.times).reduce((prev, val) => prev + val) - cpu.times.idle
				});
			}
			
			const usagePercentages = [];
			for (let i = 0; i < cpus.length; i++) {
				const idleDif = cpuUsage2[i].idle - cpuUsage1[i].idle, nonidleDif = cpuUsage2[i].nonidle - cpuUsage1[i].nonidle;
				usagePercentages.push(nonidleDif / (idleDif + nonidleDif));
			}
			
			processorEmbed.addField("CPU Usage", `${(usagePercentages.reduce((prev, val) => prev + val) / cpus.length * 100).toFixed(1)}%`, true)
				.addField("Processor", cpus[0].model)
				.addField("Number of Cores", cpus.length);
			message.channel.send(processorEmbed);
		}
	},
	class SuggestCommand extends Command {
		constructor() {
			super({
				name: "suggest",
				description: "Suggest new features or report problems",
				aliases: ["feedback", "complain", "report"],
				allowDMs: true,
				args: [
					{
						missingArgMsg: "You must provide a suggestion or problem to send.",
						infiniteArgs: true,
						type: "string"
					}
				],
				cooldown: {
					time: 30000,
					type: "user"
				},
				usage: "suggest <suggestion>"
			});
		}
		
		async run(bot, message, args, flags) {
			if (!bot.ideaWebhook) return {cmdWarn: "The suggestions webhook has not been set up."};
			let sourceFooter;
			if (message.guild) {
				sourceFooter = `#${message.channel.name} (ID ${message.channel.id}) in ${message.guild.name} (ID ${message.guild.id})`;
			} else {
				sourceFooter = `From ${message.author.tag}`;
			}
			bot.ideaWebhook.send({
				embeds: [{
					description: args[0].replace(/https?:\/\/\S+\.\S+/gi, "").replace(/(www\.)?(discord\.(gg|me|io)|discordapp\.com\/invite)\/[0-9a-z]+/gi, ""),
					author: {
						name: message.author.tag,
						icon_url: message.author.avatarURL
					},
					color: Math.floor(Math.random() * 16777216),
					footer: {
						text: sourceFooter,
						timestamp: message.createdAt
					}
				}]
			})
				.then(() => {
					message.channel.send("The suggestion has been sent.");
				})
				.catch(() => {
					message.channel.send("⚠ Failed to send the suggestion.");
				});
		}
	},
	class UnloadCommand extends Command {
		constructor() {
			super({
				name: "unload",
				description: "Unloads a command. Some commands cannot be unloaded.",
				allowDMs: true,
				args: [
					{
						type: "command"
					}
				],
				cooldown: {
					time: 0,
					type: "user"
				},
				hidden: true,
				perms: {
					bot: [],
					user: [],
					level: 5
				},
				usage: "unload <command>"
			});
		}
		
		async run(bot, message, args, flags) {
			const command = args[0], commandName = command.name;
			if (command.category == "Core" || commandName == "eval") return {cmdErr: "That command is not unloadable."};
			delete require.cache[require.resolve(`./${command.category.toLowerCase().replace(/ /g, "-")}.js`)];
			bot.commands.delete(commandName);
			if (command.aliases.length > 0) {
				const toRemoveAliases = bot.aliases.filter(alias => alias == command.name);
				for (const alias of toRemoveAliases.keys()) {bot.aliases.delete(alias)}
			}
			message.channel.send(`The command ${commandName} was unloaded.`);
		}
	},
	class UsageCommand extends Command {
		constructor() {
			super({
				name: "usage",
				description: "Find out which commands from the bot are used most often",
				aliases: ["popular", "mostused"],
				allowDMs: true,
				args: [
					{
						optional: true,
						type: "number",
						min: 1
					}
				],
				cooldown: {
					time: 30000,
					type: "guild"
				},
				perms: {
					bot: ["ADD_REACTIONS", "EMBED_LINKS", "MANAGE_MESSAGES"],
					user: [],
					level: 0
				},
				usage: "usage [page]"
			});
		}
		
		async run(bot, message, args, flags) {
			const storedUsages = require("../modules/stats.json").commandUsages;
			storedUsages.sort((a, b) => b.uses - a.uses);

			const entries = [storedUsages.map(cmd => `${cmd.command} - used ${cmd.uses} times`)];
			paginator.paginate(message, {title: "Most Popular Bot Commands"}, entries, {
				limit: 25,
				noStop: true,
				numbered: true,
				page: args[0] ? args[0] : 1,
				params: null
			});
		}
	}
];
