const express = require('express');
const app = express();
console.log(app);
const PORT = process.env.PORT || 3001;
app.get('/', (req, res) => res.send('API Running'));
app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
