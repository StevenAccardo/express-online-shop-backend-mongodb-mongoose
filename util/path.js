const path = require('path');

// Helper method that gives us the path to the root directory in which our applicaton runs, we accomplish this by targeting the main file and getting the directory name that holds it.
module.exports = path.dirname(require.main.filename);
