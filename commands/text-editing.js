const Command = require("../structures/command.js");

const grouperRegex = /<(a?:[0-9A-Za-z_]{2,}:|@!?|&|#)\d+>|[\u0080-\uFFFF]{2}|./g,
	wordGrouperRegex = /<(a?:[0-9A-Za-z_]{2,}:|@!?|&|#)\d+>|([\u0080-\uFFFF]{2})+|[^ ]+/g;

module.exports = [
	class ClapifyCommand extends Command {
		constructor() {
			super({
				name: "clapify",
				description: "Clapify 👏 text 👏 for 👏 you",
				aliases: ["clap"],
				args: [
					{
						infiniteArgs: true,
						type: "string"
					}
				],
				usage: "clapify <text>"
			});
		}

		async run(bot, message, args, flags) {
			const clapified = args[0].replace(/ /g, " 👏 ");
			if (clapified.length >= 2000) return {cmdWarn: "Your input text to clapify is too long!", cooldown: null, noLog: true};
			message.channel.send(clapified);
		}
	},
	class CowsayCommand extends Command {
		constructor() {
			super({
				name: "cowsay",
				description: "Generates cowsay text",
				args: [
					{
						infiniteArgs: true,
						type: "string"
					}
				],
				usage: "cowsay <text>"
			});
		}

		async run(bot, message, args, flags) {
			if (args[0].length > 1000) return {cmdWarn: "That text is too long, must be under 1000 characters.", cooldown: null, noLog: true};

			let cowsayLines = [
				"      \\   ^__^",
				"       \\  (oo)\\_______",
				"          (__)\\       )\\/\\",
				"             ||----w |",
				"             ||     ||"
			];

			if (args[0].length <= 50) {
				cowsayLines.unshift(` ${"_".repeat(args[0].length + 2)}`,
					`< ${args[0]} >`,
					` ${"-".repeat(args[0].length + 2)}`
				);
			} else {
				const lines = [], words = args[0].split(" ");
				let currLine = [], nextWidth = 0;

				for (let i = 0; i < words.length; i++) {
					nextWidth += words[i].length;
					if (i != 0) nextWidth++;
					if (words[i].length > 50) {
						words.splice(i+1, 0, words[i].slice(50));
						words[i] = words[i].slice(0,50);
					}
					if (nextWidth > 50) {
						lines.push(currLine.join(" "));
						currLine = [words[i]];
						nextWidth = words[i].length;
					} else {
						currLine.push(words[i]);
					}
					if (i == words.length - 1) lines.push(currLine.join(" "));
				}

				for (let i = 0; i < lines.length; i++) {
					lines[i] = lines[i].padEnd(50, " ");
				}

				const toDisplayLines = [];
				toDisplayLines.push(` ${"_".repeat(52)}`, `/ ${lines[0]} \\`);
				if (lines.length > 2) {
					for (let i = 1; i < lines.length - 1; i++) {
						toDisplayLines.push(`| ${lines[i]} |`);
					}
				}
				toDisplayLines.push(`\\ ${lines[lines.length - 1]} /`, ` ${"-".repeat(52)}`);
				cowsayLines = toDisplayLines.concat(cowsayLines);
			}

			message.channel.send("```" + cowsayLines.join("\n") + "```");
		}
	},
	class EmojifyCommand extends Command {
		constructor() {
			super({
				name: "emojify",
				description: "Turns text into emojis",
				args: [
					{
						infiniteArgs: true,
						type: "string"
					}
				],
				usage: "emojify <text>"
			});
		}

		async run(bot, message, args, flags) {
			if (args[0].length > 85) return {cmdWarn: "That text is too long, must be under 85 characters.", cooldown: null, noLog: true};

			const chars = args[0].toLowerCase().split(""), emojiRegex = /[a-z]/;
			let emojified = "";
			for (const c of chars) {
				if (emojiRegex.test(c)) {
					emojified += `:regional_indicator_${c}: `;
				} else {
					switch (c) {
						case " ": emojified += "   "; break;
						case "0": emojified += ":zero: "; break;
						case "1": emojified += ":one: "; break;
						case "2": emojified += ":two: "; break;
						case "3": emojified += ":three: "; break;
						case "4": emojified += ":four: "; break;
						case "5": emojified += ":five: "; break;
						case "6": emojified += ":six: "; break;
						case "7": emojified += ":seven: "; break;
						case "8": emojified += ":eight: "; break;
						case "9": emojified += ":nine: "; break;
						default: emojified += c + " ";
					}
				}
			}

			message.channel.send(emojified);
		}
	},
	class ReverseCommand extends Command {
		constructor() {
			super({
				name: "reverse",
				description: "Reverses text",
				args: [
					{
						infiniteArgs: true,
						type: "string"
					}
				],
				flags: [
					{
						name: "words",
						desc: "Reverse text by words"
					}
				],
				usage: "reverse <text> [--words]"
			});
		}

		async run(bot, message, args, flags) {
			if (args[0].length > 1000) return {cmdWarn: "That text is too long, must be under 1000 characters.", cooldown: null, noLog: true};

			message.channel.send(args[0].match(flags.some(f => f.name == "words") ? wordGrouperRegex : grouperRegex).reverse().join(" "));
		}
	},
	class ScrambleCommand extends Command {
		constructor() {
			super({
				name: "scramble",
				description: "Scrambles up the letters or words of your text",
				aliases: ["jumble"],
				args: [
					{
						infiniteArgs: true,
						type: "string"
					}
				],
				flags: [
					{
						name: "inner",
						desc: "Scramble surrounding letters"
					},
					{
						name: "words",
						desc: "Scramble text using words"
					}
				],
				usage: "scramble <text> [--(inner|words)]"
			});
		}

		async run(bot, message, args, flags) {
			if (args[0].length > 1000) return {cmdWarn: "That text is too long, must be under 1000 characters.", cooldown: null, noLog: true};

			const innerFlag = flags.some(f => f.name == "inner"),
				wordsFlag = flags.some(f => f.name == "words"),
				toScramble = args[0].match(wordsFlag ? wordGrouperRegex : grouperRegex);
			let scrambled;
			if (innerFlag) {
				scrambled = toScramble;
				const max1 = Math.floor(scrambled.length / 2) * 2, max2 = Math.floor((scrambled.length - 1) / 2) * 2 + 1;
				for (let i = 0; i < 4; i++) {
					const offset = i % 2, max = offset == 0 ? max1 : max2;
					for (let j = 0; j < max; j += 2) {
						if (Math.random() > 0.5) {
							const temp = scrambled[offset+j];
							scrambled[offset+j] = scrambled[offset+j+1];
							scrambled[offset+j+1] = temp;
						}
					}
				}
			} else {
				scrambled = [];
				while (toScramble.length > 0) {
					scrambled.push(toScramble.splice(Math.floor(Math.random() * toScramble.length), 1));
				}
			}
			message.channel.send(scrambled.join(wordsFlag ? " " : ""));
		}
	},
	class WeebifyCommand extends Command {
		constructor() {
			super({
				name: "weebify",
				description: "Makes text sound like anime :3",
				args: [
					{
						infiniteArgs: true,
						type: "string"
					}
				],
				usage: "weebify <text>"
			});
		}

		async run(bot, message, args, flags) {
			if (args[0].length > 1000) return {cmdWarn: "That text is too long, must be under 1000 characters.", cooldown: null, noLog: true};

			const weebifySuffixes = ["owo", "OWO", "uwu", "UwU", "X3", ":3", "***notices bulge** OwO, what's this?*"],
				weebified = args[0].toLowerCase()
					.replace(/[lr]+/g, "w")
					.replace(/n/g, "ny")
					.split(" ")
					.map(word => Math.random() < 0.25 ? `${word.charAt(0)}-${word}` : word)
					.join(" ");
			message.channel.send(weebified + " " + weebifySuffixes[Math.floor(Math.random() * weebifySuffixes.length)]);
		}
	}
];