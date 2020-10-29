const {Router} = require('express');
const DaqMessage = require('../model/daqMessage')

const router = Router();

router.post('/', (req, res) => {
    try {
        daqMessage = new DaqMessage();
        daqMessage.writeMessage(req.body)
    } catch (e){
        console.error(e);
        return res.sendStatus(500)
    }
    return res.sendStatus(200)
})

module.exports = router;