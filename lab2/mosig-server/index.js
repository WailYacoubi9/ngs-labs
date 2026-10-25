import { createExpressApp } from './app.js';

const port = process.env.PORT || 3000;

createExpressApp().listen(port, () => {
  console.log(`Mosig REST server (Express) listening on http://localhost:${port}`);
});
