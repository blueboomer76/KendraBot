const {Permissions} = require("discord.js"),
	Command = require("../structures/command.js"),
	promptor = require("../modules/codePromptor.js");

function compareRolePositions(message, target, role, options) {
	let err = "";
	if (options.type == "role") {
		const tempErr = `I cannot ${options.action} the role **${target.name}** since its position is at or higher than `;
		if (message.guild.owner.id != message.author.id && target.comparePositionTo(message.member.highestRole) >= 0) {
			err = tempErr + "your highest role. This can be overridden with server owner.";
		} else if (target.comparePositionTo(message.guild.me.highestRole) >= 0) {
			err = tempErr + "my highest role.";
		}
	} else {
		const tempErr = `I cannot ${options.action} the user **${target.user.tag}** since the user's highest role is at or higher than `;
		if (message.guild.owner.id != message.author.id && role.comparePositionTo(message.member.highestRole) >= 0) {
			err = tempErr + "yours. This can be overridden with server owner.";
		} else if (role.comparePositionTo(message.guild.me.highestRole) >= 0) {
			err = tempErr + "mine.";
		}
	}
	return err.length > 0 ? err : true;
}

module.exports = [
	class AddRoleCommand extends Command {
		constructor() {
			super({
				name: "addrole",
				description: "Adds a role to a user",
				aliases: ["giverole", "setrole"],
				args: [
					{
						allowQuotes: true,
						infiniteArgs: true,
						type: "member"
					},
					{
						infiniteArgs: true,
						type: "role"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_ROLES"],
					user: ["MANAGE_ROLES"],
					level: 0
				},
				usage: "addrole <user | \"user\"> <role>"
			});
		}

		async run(bot, message, args, flags) {
			const member = args[0], role = args[1];
			if (member.id == message.author.id || member.id == bot.user.id) return {cmdWarn: "This command cannot be used on yourself or the bot."};
			if (member.roles.has(role.id)) return {cmdWarn: `User **${member.user.tag}** already has the role **${role.name}**.`};
			if (role.managed) return {cmdWarn: `Role **${role.name}** cannot be added to **${member.user.tag}** since it is managed or integrated.`};
			const compareTest = compareRolePositions(message, member, role, {action: `add the role **${role.name}** to`, type: "user"});
			if (compareTest != true) return {cmdWarn: compareTest};

			member.addRole(role)
				.then(() => message.channel.send(`✅ Role **${role.name}** has been added to the user **${member.user.tag}**.`))
				.catch(err => message.channel.send("An error has occurred while trying to add the role: `" + err + "`"));
		}
	},
	class BanCommand extends Command {
		constructor() {
			super({
				name: "ban",
				description: "Bans a user from this server",
				args: [
					{
						infiniteArgs: true,
						type: "member"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				flags: [
					{
						name: "days",
						desc: "Number of days to delete messages",
						arg: {
							type: "number",
							min: 1,
							max: 7
						}
					},
					{
						name: "reason",
						desc: "Reason to put in the audit log",
						arg: {
							type: "string"
						}
					},
					{
						name: "yes",
						desc: "Skips the confirmation dialog"
					}
				],
				perms: {
					bot: ["BAN_MEMBERS"],
					user: ["BAN_MEMBERS"],
					level: 0
				},
				usage: "ban <user> [--days <1-7>] [--reason <reason>] [--yes]"
			});
		}

		async run(bot, message, args, flags) {
			const member = args[0],
				daysFlag = flags.find(f => f.name == "days"),
				reasonFlag = flags.find(f => f.name == "reason");
			if (member.id == message.author.id || member.id == bot.user.id) return {cmdWarn: "This command cannot be used on yourself or the bot."};
			const compareTest = compareRolePositions(message, member, member.highestRole, {action: "ban", type: "user"});
			if (compareTest != true) return {cmdWarn: compareTest};

			if (!flags.some(f => f.name == "yes")) {
				const promptRes = await promptor.prompt(message, `You are about to ban the user **${member.user.tag}** from this server.`);
				if (promptRes.error) return {cmdWarn: promptRes.error};
			}

			member.ban({
				days: daysFlag ? daysFlag.args : 0,
				reason: reasonFlag ? reasonFlag.args : null
			})
				.then(() => message.channel.send(`✅ User **${member.user.tag}** has been banned from this server.`))
				.catch(err => message.channel.send("An error has occurred while trying to ban the user: `" + err + "`"));
		}
	},
	class CreateChannelCommand extends Command {
		constructor() {
			super({
				name: "createchannel",
				description: "Create a text channel with a given name",
				aliases: ["addch", "addchannel", "createch"],
				args: [
					{
						type: "string"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_CHANNELS"],
					user: ["MANAGE_CHANNELS"],
					level: 0
				},
				usage: "createchannel <name>"
			});
		}

		async run(bot, message, args, flags) {
			const channelName = args[0].toLowerCase();
			if (/[^0-9a-z-_]/.test(channelName)) return {cmdWarn: "Channel names can only have numbers, lowercase letters, hyphens, or underscores."};

			message.guild.createChannel(channelName, {type: "text"})
				.then(() => message.channel.send(`✅ The text channel **${channelName}** has been created.`))
				.catch(err => message.channel.send("An error has occurred while trying to create the channel: `" + err + "`"));
		}
	},
	class CreateRoleCommand extends Command {
		constructor() {
			super({
				name: "createrole",
				description: "Creates a server role",
				aliases: ["crrole"],
				args: [
					{
						infiniteArgs: true,
						type: "string"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_ROLES"],
					user: ["MANAGE_ROLES"],
					level: 0
				},
				usage: "createrole <name>"
			});
		}

		async run(bot, message, args, flags) {
			const roleName = args[0];
			message.guild.createRole({name: roleName})
				.then(() => message.channel.send(`✅ Role **${roleName}** has been created.`))
				.catch(err => message.channel.send("An error has occurred while trying to create the role: `" + err + "`"));
		}
	},
	class DeleteChannelCommand extends Command {
		constructor() {
			super({
				name: "deletechannel",
				description: "Deletes a channel",
				aliases: ["delch", "delchannel", "deletech"],
				args: [
					{
						infiniteArgs: true,
						type: "channel"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				flags: [
					{
						name: "yes",
						desc: "Skips the confirmation dialog"
					}
				],
				perms: {
					bot: ["MANAGE_CHANNELS"],
					user: ["MANAGE_CHANNELS"],
					level: 0
				},
				usage: "deletechannel <name> [--yes]"
			});
		}

		async run(bot, message, args, flags) {
			const channel = args[0];
			if (channel.createdTimestamp + 1.5552e+10 < Date.now() && !flags.some(f => f.name == "yes")) {
				const promptRes = await promptor.prompt(message,
					`You are about to delete the channel **${channel.name}** (ID ${channel.id}), which is more than 180 days old.`);
				if (promptRes.error) return {cmdWarn: promptRes.error};
			}

			channel.delete()
				.then(() => message.channel.send(`✅ The channel **${channel.name}** has been deleted.`))
				.catch(err => message.channel.send("An error has occurred while trying to delete the channel: `" + err + "`"));
		}
	},
	class DeleteRoleCommand extends Command {
		constructor() {
			super({
				name: "deleterole",
				description: "Deletes a role",
				aliases: ["delr", "delrole", "deleter"],
				args: [
					{
						infiniteArgs: true,
						type: "role"
					}
				],
				cooldown: {
					time: 30000,
					type: "user"
				},
				flags: [
					{
						name: "yes",
						desc: "Skips the confirmation dialog"
					}
				],
				perms: {
					bot: ["MANAGE_ROLES"],
					user: ["MANAGE_ROLES"],
					level: 0
				},
				usage: "deleterole <name>"
			});
		}

		async run(bot, message, args, flags) {
			const role = args[0];
			if (role.managed) return {cmdWarn: `Role **${role.name}** cannot be deleted since it is managed or integrated.`};
			const compareTest = compareRolePositions(message, role, null, {action: "delete", type: "role"});
			if (compareTest != true) return {cmdWarn: compareTest};
			if (role.members.size > 10 && role.members.size > message.guild.memberCount / 10 && !flags.some(f => f.name == "yes")) {
				const promptRes = await promptor.prompt(message,
					`You are about to delete the role **${role.name}** (ID ${role.id}), which more than 10% of the members in this server have.`);
				if (promptRes.error) return {cmdWarn: promptRes.error};
			}

			role.delete()
				.then(() => message.channel.send(`✅ The role **${role.name}** has been deleted.`))
				.catch(err => message.channel.send("An error has occurred while trying to delete the role: `" + err + "`"));
		}
	},
	class HackbanCommand extends Command {
		constructor() {
			super({
				name: "hackban",
				description: "Bans a user even if that user is not in this server",
				args: [
					{
						errorMsg: "You need to provide a valid user ID.",
						type: "function",
						testFunction: obj => /^\d{17,19}$/.test(obj)
					}
				],
				cooldown: {
					time: 25000,
					type: "user"
				},
				flags: [
					{
						name: "days",
						desc: "Number of days to delete messages",
						arg: {
							type: "number",
							min: 1,
							max: 7
						}
					},
					{
						name: "reason",
						desc: "Reason to put in the audit log",
						arg: {
							type: "string"
						}
					}
				],
				perms: {
					bot: ["BAN_MEMBERS"],
					user: ["BAN_MEMBERS"],
					level: 0
				},
				usage: "hackban <user ID> [--days <1-7>] [--reason <reason>]"
			});
		}

		async run(bot, message, args, flags) {
			const userID = args[0],
				daysFlag = flags.find(f => f.name == "days"),
				reasonFlag = flags.find(f => f.name == "reason");
			if (userID == message.author.id || userID == bot.user.id) return {cmdWarn: "This command cannot be used on yourself or the bot."};
			let guildMembers, cmdErr = false;
			if (!message.guild.large) {
				guildMembers = message.guild.members;
			} else {
				await message.guild.fetchMembers()
					.then(g => guildMembers = g.members)
					.catch(() => cmdErr = true);
			}
			if (cmdErr) return {cmdWarn: "Unable to perform a hackban. Maybe try again?"};

			const memberWithID = guildMembers.get(userID);
			if (memberWithID) {
				const compareTest = compareRolePositions(message, memberWithID, memberWithID.highestRole, {action: "hackban", type: "user"});
				if (compareTest != true) return {cmdWarn: compareTest};
			}

			message.guild.ban(userID, {
				days: daysFlag ? daysFlag.args : 0,
				reason: reasonFlag ? reasonFlag.args : null
			})
				.then(() => message.channel.send(`✅ User with ID **${userID}** has been hackbanned from this server.`))
				.catch(() => message.channel.send("Could not hackban the user with that ID. " +
					"Make sure to check for typos in the ID and that the user is not already banned."));
		}
	},
	class KickCommand extends Command {
		constructor() {
			super({
				name: "kick",
				description: "Kicks a user from this server",
				args: [
					{
						infiniteArgs: true,
						type: "member"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				flags: [
					{
						name: "reason",
						desc: "Reason to put in the audit log",
						arg: {
							type: "string"
						}
					},
					{
						name: "yes",
						desc: "Skips the confirmation dialog"
					}
				],
				perms: {
					bot: ["KICK_MEMBERS"],
					user: ["KICK_MEMBERS"],
					level: 0
				},
				usage: "kick <user> [--reason <reason>] [--yes]"
			});
		}

		async run(bot, message, args, flags) {
			const member = args[0],
				reasonFlag = flags.find(f => f.name == "reason");
			if (member.id == message.author.id || member.id == bot.user.id) return {cmdWarn: "This command cannot be used on yourself or the bot."};
			const compareTest = compareRolePositions(message, member, member.highestRole, {action: "kick", type: "user"});
			if (compareTest != true) return {cmdWarn: compareTest};

			if (!flags.some(f => f.name == "yes")) {
				const promptRes = await promptor.prompt(message, `You are about to kick the user **${member.user.tag}** from this server.`);
				if (promptRes.error) return {cmdWarn: promptRes.error};
			}

			member.kick(reasonFlag ? reasonFlag.args : null)
				.then(() => message.channel.send(`✅ User **${member.user.tag}** has been kicked from this server.`))
				.catch(err => message.channel.send("An error has occurred while trying to kick the user: `" + err + "`"));
		}
	},
	class LockCommand extends Command {
		constructor() {
			super({
				name: "lock",
				description: "Locks a channel to the everyone role",
				aliases: ["lockdown"],
				args: [
					{
						infiniteArgs: true,
						optional: true,
						type: "channel"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_CHANNELS"],
					user: ["MANAGE_CHANNELS"],
					level: 0
				},
				usage: "lock [channel]"
			});
		}

		async run(bot, message, args, flags) {
			const channel = args[0] || message.channel,
				channelTarget = args[0] ? "The channel **" + channel.name + "**": "This channel";

			const ecOverwrites = channel.permissionOverwrites.get(message.guild.id);
			if (ecOverwrites && new Permissions(ecOverwrites.deny).has("VIEW_CHANNEL")) {
				return {cmdWarn: channelTarget + " is already locked to the everyone role."};
			}
			channel.overwritePermissions(message.guild.id, {
				VIEW_CHANNEL: false
			})
				.then(() => {
					message.channel.send(`✅ ${channelTarget} has been locked to the everyone role.`);
				})
				.catch(err => message.channel.send("An error has occurred while trying to lock this channel: `" + err + "`"));
		}
	},
	class MuteCommand extends Command {
		constructor() {
			super({
				name: "mute",
				description: "Mutes a user from sending messages in this channel",
				args: [
					{
						infiniteArgs: true,
						type: "member"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_CHANNELS"],
					user: ["MANAGE_CHANNELS"],
					level: 0
				},
				usage: "mute <user>"
			});
		}

		async run(bot, message, args, flags) {
			const member = args[0];
			if (member.id == message.author.id || member.id == bot.user.id) return {cmdWarn: "This command cannot be used on yourself or the bot."};
			const compareTest = compareRolePositions(message, member, member.highestRole, {action: "mute", type: "user"});
			if (compareTest != true) return {cmdWarn: compareTest};

			const mcOverwrites = message.channel.permissionOverwrites.get(member.user.id);
			if (mcOverwrites && new Permissions(mcOverwrites.deny).has("SEND_MESSAGES")) {
				return {cmdWarn: `**${member.user.tag}** is already muted in this channel.`};
			}
			message.channel.overwritePermissions(member, {
				SEND_MESSAGES: false
			})
				.then(channel => {
					let toSend = `✅ User **${member.user.tag}** has been muted in this channel.`;
					if (!channel.permissionsFor(member).has("VIEW_CHANNEL")) {
						toSend += "\n" + "*This user is also unable to view this channel.*";
					}
					message.channel.send(toSend);
				})
				.catch(err => message.channel.send("An error has occurred while trying to mute the user: `" + err + "`"));
		}
	},
	class PurgeCommand extends Command {
		constructor() {
			super({
				name: "purge",
				description: "Deletes messages from this channel. You can specify options to refine the deleted messages",
				aliases: ["clear", "prune"],
				cooldown: {
					time: 20000,
					type: "user"
				},
				flags: [
					{
						name: "invert",
						desc: "Inverts the messages selected"
					},
					{
						name: "no-delete",
						desc: "Prevents the deletion breakdown message from being automatically deleted"
					},
					{
						name: "text",
						desc: "Filter messages containing text",
						arg: {
							type: "string"
						}
					},
					{
						name: "user",
						desc: "Filter messages from a user",
						arg: {
							type: "member"
						}
					}
				],
				perms: {
					bot: ["MANAGE_MESSAGES"],
					user: ["MANAGE_MESSAGES"],
					level: 0
				},
				subcommands: [
					{
						name: "message",
						args: [
							{
								errorMsg: "You need to provide a valid message ID.",
								type: "function",
								testFunction: obj => /^\d{17,19}$/.test(obj)
							}
						]
					},
					{
						name: "fallback",
						args: [
							{
								type: "number",
								min: 1,
								max: 500
							},
							{
								infiniteArgs: true,
								optional: true,
								parseSeperately: true,
								type: "string"
							}
						]
					}
				],
				usage: "purge <1-500> [attachments] [bots] [embeds] [images] [invites] [left] [links] [mentions] " +
					"[reactions] [--user <user>] [--text <text>] [--invert] [--no-delete] OR\n" +
					"purge message <message ID>"
			});

			this.filters = {
				attachments: msg => msg.attachments.size > 0,
				bots: msg => msg.author.bot,
				embeds: msg => msg.embeds[0],
				images: msg => msg.embeds[0] && (msg.embeds[0].type == "image" || msg.embeds[0].image),
				invites: msg => /(www\.)?(discord\.(gg|me|io)|discordapp\.com\/invite)\/[0-9a-z]+/gi.test(msg.content),
				left: msg => msg.member == null,
				links: msg => /https?:\/\/\S+\.\S+/gi.test(msg.content) ||
					(msg.embeds[0] && msg.embeds.some(e => e.type == "article" || e.type == "link")),
				mentions: msg => {
					const mentions = msg.mentions;
					return mentions.everyone || mentions.members.size > 0 || mentions.roles.size > 0 || mentions.users.size > 0;
				},
				reactions: msg => msg.reactions.size > 0
			};
		}

		async run(bot, message, args, flags) {
			await message.delete();
			if (args[0] == "message") {
				this.performMessageDelete(message, args[1]);
				return;
			}

			const hasMsgOptions = args[1] || flags.some(f => f.name != "no-delete");
			if (hasMsgOptions) {
				const extraArg = args.slice(1).find(arg => !this.filters[arg]);
				if (extraArg) {
					if (extraArg == "text" || extraArg == "user") {
						return {cmdWarn: `You need to use the flag version of the \`${extraArg}\` option: \`--${extraArg}\` <query>`};
					} else {
						return {cmdWarn: "Invalid option specified: " + extraArg};
					}
				}
			}
			if (args[0] > 100) {
				const promptRes = await promptor.prompt(message, `You are about to delete up to ${args[0]} messages from this channel.`);
				if (promptRes.error) return {cmdWarn: promptRes.error};

				const toDeleteFromPrompt = [];
				if (message.channel.messages.has(promptRes.noticeMsg.id)) toDeleteFromPrompt.push(promptRes.noticeMsg.id);
				if (message.channel.messages.has(promptRes.responseMsg.id)) toDeleteFromPrompt.push(promptRes.responseMsg.id);
				await message.channel.bulkDelete(toDeleteFromPrompt);
			}

			const textFlag = flags.find(f => f.name == "text"),
				userFlag = flags.find(f => f.name == "user");
			const msgGroupCount = Math.ceil(args[0] / 100),
				filters = [];
			for (const name in this.filters) {
				if (flags.some(f => f.name == name)) filters.push(this.filters[name]);
			}
			if (textFlag) filters.push(msg => msg.content.includes(textFlag.args));
			if (userFlag) filters.push(msg => msg.author.id == userFlag.args.id);

			const timestampLimit = Date.now() - 1.209e+9, // 2 weeks less 10 minutes
				toDeleteIDs = [],
				deleteDistrib = {};
			let nextMessageID,
				currMsgGroup = 0,
				outOfTimeRange = false,
				fetchErr;
			while (currMsgGroup < msgGroupCount && !outOfTimeRange) {
				await message.channel.fetchMessages({
					limit: currMsgGroup == msgGroupCount - 1 ? args[0] % 100 : 100,
					before: nextMessageID
				})
					.then(messages => {
						let newMessages = messages;
						if (hasMsgOptions) {
							for (const filter of filters) {
								newMessages = newMessages.filter(m => filter(m));
							}
						}
						if (flags.some(f => f.name == "invert")) {
							const oldDeleteIDs = newMessages.map(m => m.id);
							newMessages = messages.filter(m => !oldDeleteIDs.includes(m.id));
						}
						for (const msg of newMessages.values()) {
							if (msg.createdTimestamp < timestampLimit) {
								outOfTimeRange = true;
								return;
							}
							toDeleteIDs.push(msg.id);
							deleteDistrib[msg.author.tag] = (deleteDistrib[msg.author.tag] || 0) + 1;
						}
						nextMessageID = messages.last().id;
					})
					.catch(err => fetchErr = err);
				if (fetchErr) {
					console.error(fetchErr);
					return {cmdWarn: "Failed to fetch messages"};
				}

				currMsgGroup++;
			}

			// Delete the messages
			const deleteGroupCount = Math.ceil(toDeleteIDs.length / 100);
			for (let i = 0; i < deleteGroupCount; i++) {
				let deleteErr;
				await message.channel.bulkDelete(toDeleteIDs.slice(i * 100, (i + 1) * 100))
					.catch(err => deleteErr = "Could not delete all messages: ```" + err + "```");
				if (deleteErr) return {cmdWarn: deleteErr};
			}

			const authors = Object.keys(deleteDistrib),
				authorDisplayCount = Math.min(authors.length, 40);
			let breakdown = "";
			for (let i = 0; i < authorDisplayCount; i++) {
				breakdown += ` **\`${authors[i]}\`** - ${deleteDistrib[authors[i]]}\n`;
			}
			if (authorDisplayCount < authors.length) breakdown += `...and ${authors.length - 40} more.`;

			message.channel.send(`🗑 Deleted ${toDeleteIDs.length} messages from this channel!` + "\n\n" + "__**Breakdown**__:\n" + breakdown)
				.then(m => {
					if (!flags.some(f => f.name == "no-delete")) {
						m.delete(Math.min(500 * authors.length + 4500, 10000)).catch(() => {});
					}
				});
		}

		performMessageDelete(message, id) {
			message.channel.fetchMessage(id)
				.then(msg => msg.delete())
				.catch(() => message.channel.send("⚠ A message with that ID was not found in this channel."));
		}
	},
	class RemoveRoleCommand extends Command {
		constructor() {
			super({
				name: "removerole",
				description: "Removes a role a user has",
				aliases: ["takerole"],
				args: [
					{
						allowQuotes: true,
						infiniteArgs: true,
						type: "member"
					},
					{
						infiniteArgs: true,
						type: "role"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_ROLES"],
					user: ["MANAGE_ROLES"],
					level: 0
				},
				usage: "removerole <user | \"user\"> <role>"
			});
		}

		async run(bot, message, args, flags) {
			const member = args[0], role = args[1];
			if (member.id == message.author.id || member.id == bot.user.id) return {cmdWarn: "This command cannot be used on yourself or the bot."};
			if (!member.roles.has(role.id)) return {cmdWarn: `User **${member.user.tag}** does not have a role named **${role.name}**.`};
			if (role.managed) return {cmdWarn: `Role **${role.name}** cannot be removed from **${member.user.tag}** since it is managed or integrated.`};
			const compareTest = compareRolePositions(message, member, role, {action: `remove the role **${role.name}** from`, type: "user"});
			if (compareTest != true) return {cmdWarn: compareTest};

			member.removeRole(role)
				.then(() => message.channel.send(`✅ Role **${role.name}** has been removed from user **${member.user.tag}**.`))
				.catch(err => message.channel.send("An error has occurred while trying to remove the role: `" + err + "`"));
		}
	},
	class RenameChannelCommand extends Command {
		constructor() {
			super({
				name: "renamechannel",
				description: "Renames this channel",
				aliases: ["rnch", "renamech", "setchname", "setchannelname"],
				args: [
					{
						type: "string"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_CHANNELS"],
					user: ["MANAGE_CHANNELS"],
					level: 0
				},
				usage: "renamechannel <name>"
			});
		}

		async run(bot, message, args, flags) {
			const newChannelName = args[0].toLowerCase();
			if (/[^0-9a-z-_]/.test(newChannelName)) return {cmdWarn: "Channel names can only have numbers, lowercase letters, hyphens, or underscores."};

			message.channel.setName(newChannelName)
				.then(() => message.channel.send(`✅ This channel's name has been set to **${newChannelName}**.`))
				.catch(err => message.channel.send("An error has occurred while trying to rename this channel: `" + err + "`"));
		}
	},
	class RenameRoleCommand extends Command {
		constructor() {
			super({
				name: "renamerole",
				description: "Renames a role",
				aliases: ["rnr", "rolename", "setrolename"],
				args: [
					{
						allowQuotes: true,
						infiniteArgs: true,
						type: "role"
					},
					{
						infiniteArgs: true,
						type: "string"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_ROLES"],
					user: ["MANAGE_ROLES"],
					level: 0
				},
				usage: "renamerole <role | \"role\"> <new role name>"
			});
		}

		async run(bot, message, args, flags) {
			const role = args[0], newRoleName = args[1];
			const compareTest = compareRolePositions(message, role, null, {action: "rename", type: "role"});
			if (compareTest != true) return {cmdWarn: compareTest};

			role.edit({name: newRoleName})
				.then(() => message.channel.send(`✅ The role's name has been set to **${newRoleName}**.`))
				.catch(err => message.channel.send("An error has occurred while trying to rename the role: `" + err + "`"));
		}
	},
	class ResetNicknameCommand extends Command {
		constructor() {
			super({
				name: "resetnickname",
				description: "Remove a user's nickname",
				aliases: ["removenick", "removenickname", "resetnick"],
				args: [
					{
						infiniteArgs: true,
						type: "member"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_NICKNAMES"],
					user: ["MANAGE_NICKNAMES"],
					level: 0
				},
				usage: "resetnickname <user>"
			});
		}

		async run(bot, message, args, flags) {
			const member = args[0];
			if (member.id == message.author.id || member.id == bot.user.id) return {cmdWarn: "This command cannot be used on yourself or the bot."};
			if (!member.nickname) return {cmdWarn: `User **${member.user.tag}** does not have a nickname in this server.`};
			const compareTest = compareRolePositions(message, member, member.highestRole, {action: "reset the nickname of", type: "user"});
			if (compareTest != true) return {cmdWarn: compareTest};

			member.setNickname("")
				.then(() => message.channel.send(`✅ Nickname of **${member.user.tag}** has been reset.`))
				.catch(err => message.channel.send("An error has occurred while trying to reset the nickname: `" + err + "`"));
		}
	},
	class SetNicknameCommand extends Command {
		constructor() {
			super({
				name: "setnickname",
				description: "Changes a user's nickname in this server",
				aliases: ["changenick", "setnick"],
				args: [
					{
						allowQuotes: true,
						infiniteArgs: true,
						type: "member"
					},
					{
						infiniteArgs: true,
						type: "string"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_NICKNAMES"],
					user: ["MANAGE_NICKNAMES"],
					level: 0
				},
				usage: "setnickname <user | \"user\"> <new nick>"
			});
		}

		async run(bot, message, args, flags) {
			const member = args[0], newNick = args[1];
			if (member.id == message.author.id || member.id == bot.user.id) return {cmdWarn: "This command cannot be used on yourself or the bot."};
			const compareTest = compareRolePositions(message, member, member.highestRole, {action: "set the nickname of", type: "user"});
			if (compareTest != true) return {cmdWarn: compareTest};

			member.setNickname(newNick)
				.then(() => message.channel.send(`✅ Nickname of user **${member.user.tag}** has been set to **${newNick}.**`))
				.catch(err => message.channel.send("An error has occurred while trying to set the nickname: `" + err + "`"));
		}
	},
	class SetRoleColorCommand extends Command {
		constructor() {
			super({
				name: "setrolecolor",
				description: "Sets a new color for a role",
				aliases: ["src", "rolecolor"],
				args: [
					{
						allowQuotes: true,
						infiniteArgs: true,
						type: "role"
					},
					{
						infiniteArgs: true,
						type: "color"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_ROLES"],
					user: ["MANAGE_ROLES"],
					level: 0
				},
				usage: "setrolecolor <role | \"role\"> <color: hex color | decimal:0-16777215 | ...>"
			});
		}

		async run(bot, message, args, flags) {
			const role = args[0], newRoleColor = args[1];
			const compareTest = compareRolePositions(message, role, null, {action: "change the color of", type: "role"});
			if (compareTest != true) return {cmdWarn: compareTest};

			role.edit({color: newRoleColor})
				.then(() => message.channel.send(`✅ The color of role **${role.name}** has been set to **#${newRoleColor.toString(16)}**.`))
				.catch(err => message.channel.send("An error has occurred while trying to set the color of the role: `" + err + "`"));
		}
	},
	class SetTopicCommand extends Command {
		constructor() {
			super({
				name: "settopic",
				description: "Sets the topic for this channel",
				args: [
					{
						infiniteArgs: true,
						type: "string"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_CHANNELS"],
					user: ["MANAGE_CHANNELS"],
					level: 0
				},
				usage: "settopic <new topic>"
			});
		}

		async run(bot, message, args, flags) {
			const newChannelTopic = args[0];
			if (newChannelTopic.length > 1024) return {cmdWarn: "The topic to set is too long."};

			message.channel.setTopic(newChannelTopic)
				.then(() => message.channel.send("✅ This channel's topic has changed."))
				.catch(err => message.channel.send("An error has occurred while trying to set the topic: `" + err + "`"));
		}
	},
	class SoftbanCommand extends Command {
		constructor() {
			super({
				name: "softban",
				description: "Bans a user, deletes messages, then unbans that user",
				args: [
					{
						allowQuotes: true,
						infiniteArgs: true,
						type: "member"
					},
					{
						missingArgMsg: "You need to provide a number of days to delete messages. " +
							"Use `ban` without the `days` option instead if you do not want to delete any messages, or `kick` to simply remove the user.",
						type: "number",
						min: 1,
						max: 7
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				flags: [
					{
						name: "reason",
						desc: "Reason to put in the audit log",
						arg: {
							type: "string"
						}
					},
					{
						name: "yes",
						desc: "Skips the confirmation dialog"
					}
				],
				perms: {
					bot: ["BAN_MEMBERS"],
					user: ["BAN_MEMBERS"],
					level: 0
				},
				usage: "softban <user | \"user\"> <days: 1-7> [--reason <reason>] [--yes]"
			});
		}

		async run(bot, message, args, flags) {
			const member = args[0], reasonFlag = flags.find(f => f.name == "reason");
			if (member.id == message.author.id || member.id == bot.user.id) return {cmdWarn: "This command cannot be used on yourself or the bot."};
			const compareTest = compareRolePositions(message, member, member.highestRole, {action: "softban", type: "user"});
			if (compareTest != true) return {cmdWarn: compareTest};

			if (!flags.some(f => f.name == "yes")) {
				const promptRes = await promptor.prompt(message, `You are about to softban the user **${member.user.tag}** in this server.`);
				if (promptRes.error) return {cmdWarn: promptRes.error};
			}

			member.ban({
				days: args[1],
				reason: reasonFlag ? reasonFlag.args : null
			})
				.then(() => {
					message.guild.unban(member.user.id)
						.then(() => message.channel.send(`✅ User **${member.user.tag}** has been softbanned.`))
						.catch(() => message.channel.send("An error has occurred while trying to unban the user while softbanning."));
				})
				.catch(err => message.channel.send("An error has occurred while trying to ban the user while softbanning: " + err + ""));
		}
	},
	class UnbanCommand extends Command {
		constructor() {
			super({
				name: "unban",
				description: "Unbans a user",
				args: [
					{
						errorMsg: "You need to provide a valid user ID.",
						type: "function",
						testFunction: obj => /^\d{17,19}$/.test(obj)
					}
				],
				cooldown: {
					time: 25000,
					type: "user"
				},
				flags: [
					{
						name: "reason",
						desc: "Reason to put in the audit log",
						arg: {
							type: "string"
						}
					}
				],
				perms: {
					bot: ["BAN_MEMBERS"],
					user: ["BAN_MEMBERS"],
					level: 0
				},
				usage: "unban <user ID> [--reason <reason>]"
			});
		}

		async run(bot, message, args, flags) {
			const userID = args[0],
				reasonFlag = flags.find(f => f.name == "reason");
			if (userID == message.author.id || userID == bot.user.id) return {cmdWarn: "This command cannot be used on yourself or the bot."};

			message.guild.unban(userID, reasonFlag ? reasonFlag.args : null)
				.then(() => message.channel.send(`✅ User with ID **${userID}** has been unbanned from this server.`))
				.catch(() => message.channel.send("Could not unban the user with that ID. " +
					"Make sure to check for typos in the ID and that the user is in the ban list."));
		}
	},
	class UnlockCommand extends Command {
		constructor() {
			super({
				name: "unlock",
				description: "Unlocks a channel to the everyone role",
				args: [
					{
						infiniteArgs: true,
						optional: true,
						type: "channel"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_CHANNELS"],
					user: ["MANAGE_CHANNELS"],
					level: 0
				},
				usage: "unlock [channel]"
			});
		}

		async run(bot, message, args, flags) {
			const channel = args[0] || message.channel,
				channelTarget = args[0] ? "The channel **" + channel.name + "**": "This channel";

			const ecOverwrites = channel.permissionOverwrites.get(message.guild.id);
			if (!ecOverwrites || !new Permissions(ecOverwrites.deny).has("VIEW_CHANNEL")) {
				return {cmdWarn: channelTarget + " is not locked to the everyone role."};
			}
			channel.overwritePermissions(message.guild.id, {
				VIEW_CHANNEL: null
			})
				.then(() => {
					message.channel.send(`✅ ${channelTarget} has been unlocked to the everyone role.`);
				})
				.catch(err => message.channel.send("An error has occurred while trying to unlock this channel: `" + err + "`"));
		}
	},
	class UnmuteCommand extends Command {
		constructor() {
			super({
				name: "unmute",
				description: "Allows a muted user to send messages in this channel",
				args: [
					{
						infiniteArgs: true,
						type: "member"
					}
				],
				cooldown: {
					time: 20000,
					type: "user"
				},
				perms: {
					bot: ["MANAGE_CHANNELS"],
					user: ["MANAGE_CHANNELS"],
					level: 0
				},
				usage: "unmute <user>"
			});
		}

		async run(bot, message, args, flags) {
			const member = args[0];
			if (member.id == message.author.id || member.id == bot.user.id) return {cmdWarn: "This command cannot be used on yourself or the bot."};
			const compareTest = compareRolePositions(message, member, member.highestRole, {action: "unmute", type: "user"});
			if (compareTest != true) return {cmdWarn: compareTest};

			const mcOverwrites = message.channel.permissionOverwrites.get(member.user.id);
			if (!mcOverwrites || !new Permissions(mcOverwrites.deny).has("SEND_MESSAGES")) {
				return {cmdWarn: `**${member.user.tag}** is not muted in this channel.`};
			}
			message.channel.overwritePermissions(member, {
				SEND_MESSAGES: null
			})
				.then(channel => {
					let toSend = `✅ User **${member.user.tag}** has been unmuted in this channel.`;
					if (!channel.permissionsFor(member).has("VIEW_CHANNEL")) {
						toSend += "\n*This user is still unable to view this channel.*";
					}
					message.channel.send(toSend);
				})
				.catch(err => message.channel.send("An error has occurred while trying to unmute the user: `" + err + "`"));
		}
	}
];
