import axios from 'axios';
import fs from 'fs';
import path from 'path';

const randomUrl = 'https://en.wikipedia.org/wiki/Special:Random';
const savePath = path.join('/', 'usr', 'tmp', 'www', 'index.html');

const getRandomWikiPage = async () => {
  try {
    const response = await axios.get(randomUrl);
    fs.writeFile(savePath, response.data, (err) => {
      if (err) {
        console.error('Error saving file:', err);
      } else {
        console.log('File saved');
      }
    });
  } catch (error) {
    console.error('Error fetching wiki page:', error);
  }
};

const getRandomInterval = () => {
  return Math.floor(Math.random() * (900000 - 300000 + 1)) + 300000;
};

const startCurling = () => {
  getRandomWikiPage();
  setInterval(getRandomWikiPage, getRandomInterval());
};

startCurling();
