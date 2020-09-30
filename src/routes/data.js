const {Router} = require('express');
const { load } = require('protobufjs');

const router = Router();

router.post('/', (req, res) => {
    console.log(req.body);

    load('./spec/daqmessage.proto', (err, root) => {
        if (err) {
            console.log(err);
        }
        const DaqMessage = root.lookupType("DaqMessage");
        console.log(JSON.stringify(DaqMessage.decode(req.body)));
    
    });

    return res.sendStatus(200)
})

module.exports = router;