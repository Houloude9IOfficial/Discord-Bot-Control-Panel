const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

let botToken = 'YOU BOT TOKEN';
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

let isSending = false;
let channel = null;

const apiKey = ""; 
const city = ""; 

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity('Listening to Hitz');
  channel = client.channels.cache.get('YOU SERVER CHANNEL ID');
});

app.post('/start', (req, res) => {
  if (!isSending) {
    isSending = true;
    if (channel) {
      channel.send('Starting to send random messages!');
      sendMessages();
      res.json({ message: 'Started sending random messages!' });
    } else {
      res.status(500).json({ message: 'Bot channel not available.' });
    }
  } else {
    res.json({ message: 'Already sending messages!' });
  }
});

app.post('/stop', (req, res) => {
  if (isSending) {
    isSending = false;
    res.json({ message: 'Stopped sending messages.' });
  } else {
    res.json({ message: 'No messages are being sent currently.' });
  }
});

app.post('/set-token', (req, res) => {
  const newToken = req.body.token;
  if (newToken) {
    botToken = newToken;
    client.login(botToken).then(() => {
      res.json({ message: 'Bot token updated and logged in.' });
    }).catch(err => {
      res.status(500).json({ message: 'Error logging in with new token', error: err.message });
    });
  } else {
    res.status(400).json({ message: 'Token is required' });
  }
});

app.post('/send-message', (req, res) => {
  const { channelId, messageContent } = req.body;
  const targetChannel = client.channels.cache.get(channelId);

  if (targetChannel) {
    targetChannel.send(messageContent)
      .then(() => res.json({ message: 'Message sent successfully!' }))
      .catch(err => res.status(500).json({ message: 'Error sending message', error: err.message }));
  } else {
    res.status(400).json({ message: 'Invalid channel ID' });
  }
});

app.post('/send-embed', (req, res) => {
  const { channelId, embedContent } = req.body;
  const targetChannel = client.channels.cache.get(channelId);

  if (targetChannel) {
    const embed = new EmbedBuilder()
      .setColor(embedContent.color || '#121212')
      .setTitle(embedContent.title || 'Embed Title')
      .setDescription(embedContent.description || 'Embed description');

    targetChannel.send({ embeds: [embed] })
      .then(() => res.json({ message: 'Embed sent successfully!' }))
      .catch(err => res.status(500).json({ message: 'Error sending embed', error: err.message }));
  } else {
    res.status(400).json({ message: 'Invalid channel ID' });
  }
});

app.get('/weather', async (req, res) => {
  const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    const { name: town, main: { temp: temperature }, weather } = data;
    const weatherDescription = weather[0].description;

    res.json({
      town: town,
      temperature: temperature,
      weather: weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching weather data' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

client.login(botToken);

async function sendMessages() {
  if (isSending) {
    const randomMessage = "Random message!";
    try {
      if (channel) {
        await channel.send(randomMessage);
      }
    } catch (error) {
      console.log('Error sending message:', error);
    }

    setTimeout(() => sendMessages(), 5000);
  }
}