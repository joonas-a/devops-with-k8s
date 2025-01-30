import axios from 'axios';
import fs from 'fs';
import path from 'path';

const url = 'https://en.wikipedia.org/wiki/Kubernetes';
const savePath = path.join('/', 'usr', 'tmp', 'www', 'index.html');

axios
  .get(url)
  .then((response) => {
    fs.writeFile(savePath, response.data, (err) => {
      if (err) {
        console.error('Error saving HTML:', err);
      } else {
        console.log('HTML saved successfully!');
      }
    });
  })
  .catch((error) => {
    console.error('Failed: ', error);
  });
