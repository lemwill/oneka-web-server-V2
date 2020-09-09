const { load } = require('protobufjs');

load('./spec/daqmessage.proto', (err, root) => {
    if (err) {
        console.log(err);
    }

    console.log(root);

    const DaqMessage = root.lookupType("DaqMessage");

    console.log(DaqMessage);

    module.exports = DaqMessage;
});

