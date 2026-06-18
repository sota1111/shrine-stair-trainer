import app from './app.js';
import { PORT, checkAuthConfig } from './config/env.js';

checkAuthConfig();

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
