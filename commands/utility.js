const {RichEmbed} = require("discord.js"),
	Command = require("../structures/command.js"),
	{capitalize, getDuration, getStatuses} = require("../modules/functions.js"),
	{fetchMembers} = require("../modules/memberFetcher.js"),
	paginator = require("../utils/paginator.js"),
	convert = require("color-convert"),
	math = require("mathjs"),
	util = require("util");

function getDateAndDurationString(timestamp) {
	const dateString = new Date(timestamp).toUTCString(),
		duration = getDuration(timestamp);
	return dateString + ` (${duration})`;
}

module.exports = [
	class AvatarCommand extends Command {
		constructor() {
			super({
				name: "avatar",
				description: "Get a user's avatar. You can also provide any user ID even if outside this server",
				aliases: ["profilepic", "pfp"],
				args: [
					{
						allowRaw: true,
						infiniteArgs: true,
						optional: true,
						type: "member"
					}
				],
				cooldown: {
					time: 15000,
					type: "channel"
				},
				usage: "avatar [user]"
			});
		}

		async run(bot, message, args, flags) {
			let user;
			if (typeof args[0] == "string") {
				let cmdErr = true;
				if (/^\d{17,19}$/.test(args[0])) {
					await bot.fetchUser(args[0])
						.then(fetchedUser => {user = fetchedUser; cmdErr = false})
						.catch(() => {});
				}
				if (cmdErr) return {cmdWarn: "No users found matching `" + args[0] + "`"};
			} else {
				user = (args[0] && args[0].user) || message.author;
			}
			const avatarURL = user.avatarURL || `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;
			message.channel.send(new RichEmbed()
				.setTitle("Avatar - " + user.tag)
				.setDescription("Avatar URL: " + avatarURL)
				.setColor(Math.floor(Math.random() * 16777216))
				.setImage(avatarURL)
			);
		}
	},
	class ChannelInfoCommand extends Command {
		constructor() {
			super({
				name: "channelinfo",
				description: "Get info about a channel",
				aliases: ["channel"],
				args: [
					{
						infiniteArgs: true,
						optional: true,
						type: "channel"
					}
				],
				cooldown: {
					time: 15000,
					type: "channel"
				},
				perms: {
					bot: ["EMBED_LINKS"],
					user: [],
					level: 0
				},
				usage: "channelinfo [channel]"
			});
		}

		async run(bot, message, args, flags) {
			const channel = args[0] || message.channel,
				everyoneRole = message.guild.roles.find(r => r.calculatedPosition == 0);
			let accessible = "No";
			if (channel.permissionsFor(everyoneRole).has("VIEW_CHANNEL")) {
				accessible = channel.permissionsFor(everyoneRole).has("READ_MESSAGE_HISTORY") ? "Yes" : "Partial";
			}

			const channelEmbed = new RichEmbed()
				.setTitle("Channel Info - " + channel.name)
				.setColor(Math.floor(Math.random() * 16777216))
				.setFooter("ID: " + channel.id)
				.addField("Channel created at", getDateAndDurationString(channel.createdTimestamp))
				.addField("Type", capitalize(channel.type), true)
				.addField("Category Parent", channel.parent ? channel.parent.name : "None", true)
				.addField("Accessible to everyone", accessible, true);

			const uncategorized = message.guild.channels.filter(c => c.type != "category" && !c.parent);
			let channels, pos = 0;
			if (uncategorized.has(channel.id)) {
				channels = uncategorized.array().sort((a, b) => a.calculatedPosition - b.calculatedPosition);
			} else {
				const categoryID = channel.type == "category" ? channel.id : channel.parent.id,
					catChannels = message.guild.channels.array().filter(c => c.type == "category").sort((a, b) => a.calculatedPosition - b.calculatedPosition);
				pos += uncategorized.size;

				let chnlParent;
				for (const cat of catChannels) {
					chnlParent = cat;
					pos++;
					if (chnlParent.id == categoryID) break;
					pos += cat.children.size;
				}
				channels = chnlParent.children.array().sort((a, b) => a.calculatedPosition - b.calculatedPosition);
			}
			if (channel.type != "category") {
				const textChannels = channels.filter(c => c.type == "text"),
					voiceChannels = channels.filter(c => c.type == "voice");
				if (channel.type == "text") {
					pos += textChannels.findIndex(c => c.id == channel.id);
				} else {
					pos += textChannels.length + voiceChannels.findIndex(c => c.id == channel.id);
				}
				pos++;
			}
			channelEmbed.addField("Position", pos + " / " + message.guild.channels.size, true);

			if (channel.type == "text") {
				channelEmbed.addField("NSFW", channel.nsfw ? "Yes" : "No", true)
					.addField("Topic", channel.topic || "No topic set");
			} else if (channel.type == "voice") {
				channelEmbed.addField("User Limit", channel.userLimit == 0 ? "None" : channel.userLimit, true)
					.addField("Bitrate", channel.bitrate + " bits", true);
			}

			message.channel.send(channelEmbed);
		}
	},
	class ColorCommand extends Command {
		constructor() {
			super({
				name: "color",
				description: "Get information about a color",
				aliases: ["colour"],
				args: [
					{
						infiniteArgs: true,
						type: "color"
					}
				],
				perms: {
					bot: ["EMBED_LINKS"],
					user: [],
					level: 0
				},
				usage: "color <hex color | rgb(0-255,0-255,0-255) | color name | 0-255,0-255,0-255 | decimal:0-16777215 | hsl(0-359,0-100,0-100)>"
			});
		}

		async run(bot, message, args, flags) {
			const decimalValue = parseInt(args[0]),
				rgbValues = [Math.floor(decimalValue / 65536), Math.floor(decimalValue / 256) % 256, decimalValue % 256],
				colorName = convert.rgb.keyword(rgbValues),
				cmykValues = convert.rgb.cmyk(rgbValues),
				hexValue = convert.rgb.hex(rgbValues),
				hslValues = convert.rgb.hsl(rgbValues),
				hsvValues = convert.rgb.hsv(rgbValues),
				xyzValues = convert.rgb.xyz(rgbValues),
				grayscaleValue = Math.round(convert.rgb.gray.raw(rgbValues) * 2.55);

			message.channel.send(new RichEmbed()
				.setTitle("Color - #" + hexValue)
				.setDescription(`**Nearest CSS Color Name**: ${colorName}\n` +
					`**Hexadecimal (Hex)**: #${hexValue}\n` +
					`**RGB**: rgb(${rgbValues.join(", ")})\n` +
					`**Decimal (Integer)**: ${decimalValue}\n` +
					`**HSL**: hsl(${hslValues[0]}, ${hslValues[1]}%, ${hslValues[2]}%)\n` +
					`**CMYK**: cmyk(${cmykValues[0]}%, ${cmykValues[1]}%, ${cmykValues[2]}%, ${cmykValues[3]}%)\n` +
					`**HSV**: hsv(${hsvValues[0]}, ${hsvValues[1]}%, ${hsvValues[2]}%)\n` +
					`**XYZ**: XYZ(${xyzValues.join(", ")})`)
				.setColor(decimalValue)
				.addField("Related colors", `**Grayscale**: rgb(${(grayscaleValue + ", ").repeat(2) + grayscaleValue})\n` +
					`**Inverted**: rgb(${rgbValues.map(v => 255 - v).join(", ")})`)
			);
		}
	},
	class EmojiCommand extends Command {
		constructor() {
			super({
				name: "emoji",
				description: "Get a custom emoji along with info",
				aliases: ["emojiinfo"],
				args: [
					{
						type: "emoji"
					}
				],
				cooldown: {
					time: 15000,
					type: "channel"
				},
				perms: {
					bot: ["EMBED_LINKS"],
					user: [],
					level: 0
				},
				usage: "emoji <custom emoji>"
			});
		}

		async run(bot, message, args, flags) {
			const emoji = args[0];
			message.channel.send(new RichEmbed()
				.setTitle("Emoji - " + emoji.name)
				.setColor(Math.floor(Math.random() * 16777216))
				.setFooter("ID: " + emoji.id)
				.setImage(emoji.url)
				.addField("Emoji created at", getDateAndDurationString(emoji.createdTimestamp))
				.addField("Roles which can use this emoji", emoji.roles.size == 0 ? "All roles" : emoji.roles.map(role => role.name).join(", "))
				.addField("Animated", emoji.animated ? "Yes" : "No", true)
				.addField("Managed", emoji.managed ? "Yes" : "No", true)
				.addField("Emoji URL", emoji.url)
			);
		}
	},
	class EvalCommand extends Command {
		constructor() {
			super({
				name: "eval",
				description: "Evaluate JavaScript code",
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
				flags: [
					{
						name: "console",
						desc: "Puts the result in the console"
					},
					{
						name: "inspect",
						desc: "Inspect the result using utils"
					},
					{
						name: "promise",
						desc: "Wait for the promise to resolve to a value if there is one"
					}
				],
				hidden: true,
				perms: {
					bot: ["EMBED_LINKS"],
					user: [],
					level: 5
				},
				usage: "eval <code> [--console] [--inspect] [--promise]"
			});
		}

		async run(bot, message, args, flags) {
			const consoleFlag = flags.some(f => f.name == "console");
			let isPromise = flags.some(f => f.name == "promise");
			let rawRes, beginEval, endEval;
			try {
				beginEval = process.hrtime();
				rawRes = eval(args[0]);
				if (isPromise && rawRes instanceof Promise) {
					await rawRes
						.then(value => rawRes = value)
						.catch(err => rawRes = this.getErrorString(err, consoleFlag));
				}
			} catch (err) {
				rawRes = this.getErrorString(err, consoleFlag);
				isPromise = false;
			} finally {
				endEval = process.hrtime();
			}

			const ns = (endEval[0] - beginEval[0]) * 1e+9 + (endEval[1] - beginEval[1]);
			let evalTime;
			if (ns < 100000) {
				evalTime = (ns / 1000).toPrecision(3) + "μs";
			} else if (ns < 1e+9) {
				evalTime = (ns / 1000000).toPrecision(3) + "ms";
			} else {
				evalTime = Math.round(ns / 1000000) + "ms";
			}

			const res = typeof rawRes == "function" ? rawRes.toString() : rawRes;
			if (consoleFlag) {
				console.log(res);
				message.react("✅");
			} else {
				const rawCodeFieldText = args[0].length < 1000 ? args[0] : args[0].slice(0, 1000) + "...",
					resToSend = flags.some(f => f.name == "inspect") && typeof rawRes != "function" ? util.inspect(res) : res,
					evalEmbed = new RichEmbed()
						.setTitle("discord.js Evaluator")
						.setColor(Math.floor(Math.random() * 16777216))
						.setFooter("Execution took: " + evalTime)
						.setTimestamp(message.createdAt)
						.addField("Input Code", "```javascript" + "\n" + rawCodeFieldText + "```");

				// Check if the result is longer than the allowed field length
				if (resToSend != undefined && resToSend != null && resToSend.toString().length > 1000) {
					console.log(res);
					evalEmbed
						.addField(isPromise ? "Promise Result" : "Result",
							"```javascript\n" + resToSend.toString().slice(0, 1000) + "...```")
						.addField("Note", "The full result has been logged in the console.");
				} else {
					evalEmbed.addField(isPromise ? "Promise Result" : "Result", "```javascript\n" + resToSend + "```");
				}

				message.channel.send(evalEmbed);
			}
		}

		getErrorString(err, isConsole) {
			if (err instanceof Error && err.stack && isConsole) {
				return err.stack.split("    ", 3).join("    ") + "    ...";
			}
			return err;
		}
	},
	class MathCommand extends Command {
		constructor() {
			super({
				name: "math",
				description: "Calculate a math expression",
				aliases: ["calc", "calculate"],
				args: [
					{
						infiniteArgs: true,
						type: "string"
					}
				],
				usage: "math <expression>"
			});
		}

		async run(bot, message, args, flags) {
			let result;
			try {
				result = math.evaluate(args[0]);
			} catch(err) {
				return {cmdWarn: "Failed to evaluate expression: " + err.message};
			}
			message.channel.send(result);
		}
	},
	class RoleInfoCommand extends Command {
		constructor() {
			super({
				name: "roleinfo",
				description: "Get info about a role",
				aliases: ["role"],
				args: [
					{
						infiniteArgs: true,
						type: "role"
					}
				],
				cooldown: {
					time: 15000,
					type: "channel"
				},
				perms: {
					bot: ["EMBED_LINKS"],
					user: [],
					level: 0
				},
				usage: "roleinfo <role>"
			});
		}

		async run(bot, message, args, flags) {
			const role = args[0],
				rolePos = role.calculatedPosition,
				guildRoles = message.guild.roles.array();
			guildRoles.splice(guildRoles.findIndex(r => r.calculatedPosition == 0), 1);

			const guildMembers = message.guild.large ? await fetchMembers(message) : message.guild.members,
				roleMembers = guildMembers.filter(mem => mem.roles.has(role.id)),
				nearbyRoles = [],
				startPos = Math.min(rolePos + 2, guildRoles.length),
				endPos = Math.max(rolePos - 2, 1);

			for (let i = startPos; i >= endPos; i--) {
				const roleName = guildRoles.find(r => r.calculatedPosition == i).name;
				nearbyRoles.push(i == rolePos ? `**${roleName}**` : roleName);
			}

			message.channel.send(new RichEmbed()
				.setTitle("Role Info - " + role.name)
				.setColor(role.color)
				.setFooter("ID: " + role.id)
				.addField("Role created at", getDateAndDurationString(role.createdTimestamp))
				.addField(`Members in Role [${roleMembers.size} total]`, getStatuses(roleMembers).notOffline + " Online", true)
				.addField("Color", "Hex: " + role.hexColor + "\nDecimal: " + role.color, true)
				.addField("Position from top", (guildRoles.length - rolePos + 1) + " / " + guildRoles.length, true)
				.addField("Displays separately (hoisted)", role.hoist ? "Yes" : "No", true)
				.addField("Mentionable", role.mentionable ? "Yes" : "No", true)
				.addField("Managed", role.managed ? "Yes" : "No", true)
				.addField("Role order", nearbyRoles.join(" > "))
			);
		}
	},
	class RoleListCommand extends Command {
		constructor() {
			super({
				name: "rolelist",
				description: "Get the server's roles",
				aliases: ["roles"],
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
				flags: [
					{
						name: "ordered",
						desc: "Whether the list should be ordered according to position"
					}
				],
				perms: {
					bot: ["ADD_REACTIONS", "EMBED_LINKS", "MANAGE_MESSAGES"],
					user: [],
					level: 0
				},
				usage: "rolelist [page] [--ordered]"
			});
		}

		async run(bot, message, args, flags) {
			const orderedFlag = flags.find(f => f.name == "ordered");
			const roles = message.guild.roles.array();
			roles.splice(roles.findIndex(r => r.calculatedPosition == 0), 1);
			if (orderedFlag) roles.sort((a, b) => b.calculatedPosition - a.calculatedPosition);
			paginator.paginate(message, {title: "List of roles - " + message.guild.name}, [roles.map(role => role.name)], {
				limit: 25,
				noStop: true,
				numbered: orderedFlag,
				page: args[0] || 1,
				params: null,
				removeReactAfter: 60000
			});
		}
	},
	class RoleMembersCommand extends Command {
		constructor() {
			super({
				name: "rolemembers",
				description: "See which members have a certain role",
				aliases: ["inrole", "rolemems"],
				args: [
					{
						infiniteArgs: true,
						type: "role"
					}
				],
				cooldown: {
					time: 15000,
					type: "channel"
				},
				perms: {
					bot: ["EMBED_LINKS", "MANAGE_MESSAGES"],
					user: [],
					level: 0
				},
				usage: "rolemembers <role>"
			});
		}

		async run(bot, message, args, flags) {
			const role = args[0],
				guildMembers = message.guild.large ? await fetchMembers(message) : message.guild.members,
				roleMembers = guildMembers.filter(mem => mem.roles.has(role.id));

			if (roleMembers.size == 0) return {cmdWarn: `There are no members in the role **${role.name}**.`};
			if (roleMembers.size > 250) return {cmdWarn: `There are more than 250 members in the role **${role.name}**.`};

			paginator.paginate(message, {title: "List of members in role - " + role.name}, [roleMembers.map(m => m.user.tag)], {
				embedColor: role.color,
				limit: 25,
				noStop: true,
				numbered: false,
				page: 1,
				params: null,
				removeReactAfter: 60000
			});
		}
	},
	class ServerInfoCommand extends Command {
		constructor() {
			super({
				name: "serverinfo",
				description: "Get info about this server",
				aliases: ["guild", "guildinfo", "server"],
				cooldown: {
					time: 120000,
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
			const guild = message.guild,
				guildMembers = guild.large ? await fetchMembers(message) : guild.members;

			const statuses = getStatuses(guild.members, guild.memberCount - guild.members.size),
				channels = {text: 0, voice: 0, category: 0};
			for (const channel of guild.channels.values()) channels[channel.type]++;

			let guildVerif;
			switch (guild.verificationLevel) {
				case 0: guildVerif = "None"; break;
				case 1: guildVerif = "Low (verified email)"; break;
				case 2: guildVerif = "Medium (registered for 5 mins)"; break;
				case 3: guildVerif = "High (member for 10 mins)"; break;
				case 4: guildVerif = "Very High (verified phone)";
			}
			const botCount = guildMembers.filter(mem => mem.user.bot).size;

			message.channel.send(new RichEmbed()
				.setTitle("Server Info - " + guild.name)
				.setColor(Math.floor(Math.random() * 16777216))
				.setFooter(`ID: ${guild.id} | Server stats as of`)
				.setThumbnail(guild.iconURL)
				.setTimestamp(message.createdAt)
				.addField("Server created at", getDateAndDurationString(guild.createdTimestamp))
				.addField("Owner", `${guild.owner.user.tag} \`(ID ${guild.owner.id})\``)
				.addField("Region", guild.region, true)
				.addField("Verification", guildVerif, true)
				.addField("Explicit Filter", guild.explicitContentFilter == 0 ? "None" : (guild.explicitContentFilter == 1 ? "Low" : "High"), true)
				.addField("2-Factor Auth Required", guild.mfaLevel == 0 ? "No" : "Yes", true)
				.addField(`Members [${guild.memberCount} total]`,
					`${statuses.online} Online, ${statuses.idle} Idle, ${statuses.dnd} DND ` +
						`(${(statuses.notOffline / guild.memberCount * 100).toFixed(1)}%) /\n` +
						statuses.offline + " Offline\n" +
					`${botCount} Bots (${(botCount / guild.memberCount * 100).toFixed(1)}%)`,
					true)
				.addField(`Roles [${guild.roles.size - 1} total]`, "Use `rolelist` to see all roles", true)
				.addField(`Channels [${guild.channels.size} total]`,
					channels.text + " Text\n" + channels.voice + " Voice\n" + channels.category + " Categories", true)
			);
		}
	},
	class UserInfoCommand extends Command {
		constructor() {
			super({
				name: "userinfo",
				description: "Get info about a user. You can also provide any user ID to get info even if outside this server",
				aliases: ["member", "memberinfo", "user"],
				args: [
					{
						infiniteArgs: true,
						optional: true,
						type: "member",
						allowRaw: true
					}
				],
				cooldown: {
					time: 15000,
					type: "channel"
				},
				perms: {
					bot: ["EMBED_LINKS"],
					user: [],
					level: 0
				},
				usage: "userinfo [user]"
			});
		}

		async run(bot, message, args, flags) {
			let user, member;
			if (typeof args[0] == "string") {
				let cmdErr = true;
				if (/^\d{17,19}$/.test(args[0])) {
					await bot.fetchUser(args[0])
						.then(fetchedUser => {user = fetchedUser; cmdErr = false})
						.catch(() => {});
				}
				if (cmdErr) return {cmdWarn: "No users found matching `" + args[0].slice(0, 1500) + "`"};
			} else {
				member = args[0] || message.member;
				user = member.user;
			}

			const userEmbed = new RichEmbed()
				.setTitle("User Info - " + user.tag)
				.setFooter("ID: " + user.id)
				.setThumbnail(user.avatarURL || `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`)
				.addField("Account created at", getDateAndDurationString(user.createdTimestamp));

			if (member) userEmbed.addField("Joined this server at", getDateAndDurationString(member.joinedTimestamp));

			const rawPresence = (member && member.presence) || user.presence;
			let presence;
			if (rawPresence.status == "online") {
				presence = "Online";
			} else if (rawPresence.status == "idle") {
				presence = "Idle";
			} else if (rawPresence.status == "dnd") {
				presence = "Do Not Disturb";
			} else {
				presence = "Offline";
			}
			if (rawPresence.game) presence += ` (playing ${rawPresence.game.name})`;
			userEmbed.addField("Status", presence, true);

			if (member) {
				const memRoles = [];
				for (const role of member.roles.values()) {
					if (role.calculatedPosition == 0) continue;
					memRoles.push(role.name);
				}
				const guildMembers = message.guild.large ? await fetchMembers(message) : message.guild.members,
					guildMemArray = guildMembers.array().sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
				const joinPos = guildMemArray.findIndex(mem => mem.joinedTimestamp == member.joinedTimestamp),
					nearbyMems = [],
					startPos = Math.max(joinPos - 2, 0),
					endPos = Math.min(joinPos + 2, message.guild.memberCount - 1);
				for (let i = startPos; i <= endPos; i++) {
					nearbyMems.push(i == joinPos ? `**${guildMemArray[i].user.username}**` : guildMemArray[i].user.username);
				}

				userEmbed.addField("Bot user", user.bot ? "Yes" : "No", true)
					.addField("Nickname", member.nickname || "None", true)
					.addField("Member #", joinPos + 1, true)
					.addField("Join order", nearbyMems.join(" > "))
					.addField("Roles - " + memRoles.length, memRoles.length == 0 ? "None" : memRoles.join(", "));

				if (member.displayColor != 0 || (member.colorRole && member.colorRole.color == 0)) {
					userEmbed.setColor(member.displayColor);
				}
			}

			message.channel.send(userEmbed);
		}
	}
];
