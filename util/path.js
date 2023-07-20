const path = require('path')

// Helper method that gives us the path to the root directory in which our applicaton runs, in this case the app.js file.
module.exports = path.dirname(require.main.filename)