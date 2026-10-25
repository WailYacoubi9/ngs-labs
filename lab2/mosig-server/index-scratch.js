import { createScratchApp } from './app.js';

const port = process.env.PORT || 3001;

createScratchApp().listen(port, () => {
  console.log(`Mosig REST server (tiny-rest) listening on http://localhost:${port}`);
});
