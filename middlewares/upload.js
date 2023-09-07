const multer = require('multer');

const app = require("../app");
const bodyParser = require('body-parser');

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
// app.use(bodyParser.text({ type: '/' }));

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       // Specify the destination directory to store the uploaded files
//       cb(null, 'routes/uploads/');
//     },
//     filename: function (req, file, cb) {
//       // Generate a unique filename for the uploaded file
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       cb(null, file.fieldname + '-' + uniqueSuffix);
//     }
//   });

//   const upload = multer({ storage: storage });
// module.exports = upload;