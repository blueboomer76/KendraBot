const {capitalize} = require("../modules/functions.js");

let cooldownMessages = [
	"You're calling me fast enough that I'm getting dizzy!",
	"You have to wait before using the command again...",
	"You're calling me a bit too fast, I am getting dizzy!",
	"I am busy, try again after a bit",
	"Hang in there before using this command again...",
	"Wait up, I am not done with my break"
];

(function() {
	const config = require("../config.json");
	if (Array.isArray(config.customCooldownMessages)) {
		cooldownMessages = cooldownMessages.concat(config.customCooldownMessages);
	}
})();

function getIDByType(message, type) {
	if (type == "user") {
		return message.author.id;
	} else if (type == "channel") {
		return message.channel.id;
	} else if (type == "guild") {
		return (message.guild && message.guild.id) || message.author.id;
	} else {
		throw new Error("Cooldown type must either be user, channel, or guild.");
	}
}

function findCooldown(bot, id, name, findIndex) {
	const filter = cd => cd.id == id && cd.name == name;
	return findIndex ? bot.cache.recentCommands.findIndex(filter) : bot.cache.recentCommands.find(filter);
}

/*
	Overrides are structured like this:
	{
		name: "image",
		time: 60000,
		type: "channel"
	}
*/
function addCooldown(bot, message, command, overrides) {
	if (!overrides) overrides = {};
	const cdID = getIDByType(message, overrides.type || command.cooldown.type),
		cdName = overrides.name || command.name,
		cdTime = overrides.time || command.cooldown.time;

	bot.cache.recentCommands.push({
		id: cdID,
		name: cdName,
		resets: Date.now() + cdTime,
		notified: false
	});
	setTimeout(removeCooldown, cdTime, bot, cdID, cdName);
}

function removeCooldown(bot, id, name) {
	bot.cache.recentCommands.splice(findCooldown(bot, id, name, true), 1);
}

module.exports = {
	check: (bot, message, command, type) => {
		const checkedCd = findCooldown(bot, getIDByType(message, type), command.cooldown.name || command.name, false);
		if (checkedCd) {
			if (!checkedCd.notified) {
				checkedCd.notified = true;

				const chosenMessage = cooldownMessages[Math.floor(Math.random() * cooldownMessages.length)];
				let toSend = "⛔ **Cooldown:**\n" + `*${chosenMessage}*\n`;
				toSend += command.cooldown.name ? capitalize(command.cooldown.name, true) + " commands are" : "This command is";

				const cdTime = ((checkedCd.resets - Date.now()) / 1000).toFixed(1);
				toSend += ` on cooldown for **${cdTime > 0 ? cdTime : 0.1} more seconds**`;
				if (type == "channel") {
					toSend += " in this channel";
				} else if (type == "guild") {
					toSend += " in this server";
				}
				message.channel.send(toSend + "!");
			}
			return false;
		} else {
			return true;
		}
	},
	addCooldown: addCooldown
};
