const upload = require("../middlewares/upload");
const express = require("express");
const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
    if (req.file === undefined) return res.send("you must select a file.");
    console.log(req.file);
    const imgUrl = `http://localhost:8080/file/${req.file.image}`;
    return res.send(imgUrl);
});

module.exports = router;