const cdChecker = require("../modules/cooldownChecker.js"),
	{parsePerm} = require("../modules/functions.js"),
	argParser = require("../utils/argsParser.js");

async function execCommand(runCommand, bot, message, args) {
	if (runCommand.disabled) return {cmdErr: "This command is currently disabled."};
	if (message.guild) {
		if (runCommand.nsfw && !message.channel.nsfw) return {cmdErr: "Please go to a NSFW channel to use this command."};
		if (message.guild.large && !message.member) await message.guild.fetchMember(message.author);
	} else if (!runCommand.allowDMs) {
		return {cmdErr: "This command cannot be used in Direct Messages."};
	}

	const requiredPerms = runCommand.perms;
	let userPermsAllowed = null, roleAllowed = null, faultMsg = "";
	if (message.guild) {
		if (requiredPerms.bot.length > 0) {
			for (const perm of requiredPerms.bot) {
				if (!message.guild.me.hasPermission(perm)) {
					faultMsg += "I need these permissions to run this command:\n" + requiredPerms.bot.map(p => parsePerm(p)).join(", ");
					break;
				}
			}
		}
		if (requiredPerms.user.length > 0) {
			userPermsAllowed = true;
			for (const perm of requiredPerms.user) {
				if (!message.member.hasPermission(perm)) {
					userPermsAllowed = false;
					break;
				}
			}
		}
		if (requiredPerms.role) roleAllowed = message.member.roles.some(role => role.name.toLowerCase() == requiredPerms.role.toLowerCase());
		if (userPermsAllowed == false && roleAllowed == null) {
			faultMsg += "\nYou need these permissions to run this command:\n" + requiredPerms.user.map(p => parsePerm(p)).join(", ");
		} else if (userPermsAllowed == false && roleAllowed == false) {
			faultMsg += `\nYou need these permissions or a role named **${requiredPerms.role}** to run this command:\n` +
				requiredPerms.user.map(p => parsePerm(p)).join(", ");
		} else if (userPermsAllowed == null && roleAllowed == false) {
			faultMsg += `\nYou need a role named **${requiredPerms.role}** to run this command.`;
		}
	}
	if (requiredPerms.level > 0) {
		const permLevels = bot.permLevels;
		let userLevel = 0;
		for (let i = 0; i < permLevels.length; i++) {
			if (permLevels[i].validate(message)) userLevel = i;
		}
		if (userLevel < requiredPerms.level) {
			const faultDesc = permLevels[requiredPerms.level].desc ? ` (${permLevels[requiredPerms.level].desc})` : "";
			faultMsg += `\nYou need to be a ${bot.permLevels[requiredPerms.level].name} to run this command` + faultDesc;
		}
	}
	if (faultMsg.length > 0) return {errTitle: "Command permission error", cmdWarn: faultMsg};

	let flags = [];
	if (runCommand.flags.length > 0) {
		const parsedFlags = await argParser.parseFlags(bot, message, args, runCommand.flags);
		if (parsedFlags.error) {
			if (parsedFlags.error.startsWith("Multiple")) return {cmdErr: `**${parsedFlags.error}**\n` + parsedFlags.message};
			return {cmdErr: `**${parsedFlags.error}**\n` + parsedFlags.message + `\n▫ | Correct usage: \`${runCommand.usage}\``};
		}
		flags = parsedFlags.flags;
		args = parsedFlags.newArgs;
	}
	args = await argParser.parseArgs(bot, message, args, runCommand);
	if (args.error) {
		if (args.error.startsWith("Multiple")) return {cmdErr: `**${args.error}**\n` + args.message};
		return {
			cmdErr: `**${args.error}**\n` + args.message + "\n" +
				`▫ | Correct usage: \`${runCommand.usage}\`\n` +
				`▫ | Get more help by using \`${bot.prefix}help ${runCommand.name}\``
		};
	}

	return runCommand.run(bot, message, args, flags);
}

module.exports = async (bot, message) => {
	bot.cache.stats.messageCurrentTotal++;
	if (message.author.bot) return;
	const mentionMatch = message.content.match(bot.mentionPrefix);
	if (!message.content.startsWith(bot.prefix) && !mentionMatch) {
		if (bot.cache.phone.channels.length > 1 && bot.cache.phone.channels.some(c => c.id == message.channel.id)) {
			if (message.guild && !message.channel.permissionsFor(bot.user).has("SEND_MESSAGES")) return;
			bot.handlePhoneMessage(message);
		}
	} else {
		const args = message.content.slice(mentionMatch ? mentionMatch[0].length : bot.prefix.length).trim().split(/ +/g),
			command = args.shift().toLowerCase(),
			runCommand = bot.commands.get(command) || bot.commands.get(bot.aliases.get(command));

		if (!runCommand) return;
		if (message.guild && !message.channel.permissionsFor(bot.user).has("SEND_MESSAGES")) return;
		if (!cdChecker.check(bot, message, runCommand, "user") ||
			!cdChecker.check(bot, message, runCommand, "channel") ||
			!cdChecker.check(bot, message, runCommand, "guild")) return;

		execCommand(runCommand, bot, message, args)
			.then(runRes => {
				/*
					runRes is sometimes returned as an object like this:
					{
						cmdTitle: "Error title",
						cmdErr: "Some error",
						cooldown: 90000,
						noLog: true
					}
				*/

				if (runRes) {
					if (runRes.cmdWarn) {
						const errTitle = runRes.errTitle ? `**${runRes.errTitle}**\n` : "";
						message.channel.send(`⚠ ${errTitle}${runRes.cmdWarn}`);
					} else if (runRes.cmdErr) {
						const errTitle = runRes.errTitle ? `**${runRes.errTitle}**\n` : "";
						message.channel.send(`❗ ${errTitle}${runRes.cmdErr}`);
					}
				}

				if (!bot.ownerIDs.includes(message.author.id) && runCommand.cooldown.time != 0 && (!runRes || runRes.cooldown)) {
					const cdOverrides = {name: runCommand.cooldown.name || null};
					if (runRes && runRes.cooldown) {
						cdOverrides.time = runRes.cooldown.time || null;
						cdOverrides.type = runRes.cooldown.type || null;
					}
					cdChecker.addCooldown(bot, message, runCommand, cdOverrides);
				}

				/*
					The below condition can be replaced with this when bot owners and select commands are to be ignored.
					if ((!runRes || (!runRes.noLog && !runRes.cmdWarn && !runRes.cmdErr)) && runCommand.name != "help" && runCommand.name != "phone" &&
						!bot.ownerIDs.includes(message.author.id)) {
				*/
				if (!runRes || (!runRes.noLog && !runRes.cmdWarn && !runRes.cmdErr)) {
					bot.cache.stats.commandUsages[runCommand.name] = (bot.cache.stats.commandUsages[runCommand.name] || 0) + 1;
				} else {
					bot.cache.stats.commandCurrentTotal++;
				}
			})
			.catch(err => {
				const e = err instanceof Error && err.stack ? err.stack : err;
				message.channel.send("⚠ **Internal Command Error**" + "```javascript" + "\n" + e + "```");
			});
	}
};
