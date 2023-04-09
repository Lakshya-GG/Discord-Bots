const Discord = require("discord.js") // discord client
const dotenv = require("dotenv")
const { REST } = require("@discordjs/rest") // rest library used for slash commands
const { Routes } = require("discord-api-types/v9") // discord api used for slash commands
const fs = require("fs")
const { Player } = require("discord-player")
const { Client, GatewayIntentBits,} = require('discord.js')

dotenv.config()
const TOKEN = process.env.TOKEN

const LOAD_SLASH = process.argv[2] == "load"

// BOT Application ID
const CLIENT_ID = "1093856447005204581"
// BOT Server ID 
const GUILD_ID = "1093863373856321628"

const client = new Discord.Client({
    intents: [
        // "GUILDS",
        // "GUILD_VOICE_STATES"
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
})

// Variable Slash Commands 
client.slashcommands = new Discord.Collection()
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio", // meaning we will be streaming in audio only
        highWaterMark: 1 << 25
    }
})

let commands = []

// Deploying the above "slash" commands 
const slashFiles = fs.readdirSync("./slash").filter(file => file.endsWith(".js"))
for (const file of slashFiles){
    const slashcmd = require(`./slash/${file}`)
    client.slashcommands.set(slashcmd.data.name, slashcmd)
    // IF we are using the slash commands , push data of the slash commands to the "command[]"
    if (LOAD_SLASH) commands.push(slashcmd.data.toJSON()) // push
}

// Loading / Deploying the Slash Commands
if (LOAD_SLASH) {
    const rest = new REST({ version: "9" }).setToken(TOKEN)
    console.log("Deploying slash commands")
    rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {body: commands})
    .then(() => {
        console.log("Successfully loaded") //succeed
        process.exit(0)
    })
    .catch((err) => {
        if (err){
            console.log(err) // error occured 
            process.exit(1) // stop the bot 
        }
    })
}

// Slash Command Handler 
else {
    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}`)
    })
    client.on("interactionCreate", (interaction) => {
        async function handleCommand() {
            if (!interaction.isCommand()) return

            // Gets Slash commands from the Discord Collection
            const slashcmd = client.slashcommands.get(interaction.commandName) 

            // If the command doesn't exists 
            if (!slashcmd) interaction.reply("Not a valid slash command")

            await interaction.deferReply() // Discord only allows 3 seconds to reply for the BOT
            await slashcmd.run({ client, interaction })
        }
        handleCommand()
    })
    client.login(TOKEN)
}
