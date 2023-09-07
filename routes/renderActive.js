const express = require('express')

const renderRouter = express.Router()

renderRouter.get('/renderActive', async(req, res) => {res.send('active')})
module.exports = renderRouter;