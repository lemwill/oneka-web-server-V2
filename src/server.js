const net = require('net');
const protobuf = require('protobufjs');
const Influx = require('influx');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

const influx = new Influx.InfluxDB({
    host: 'oneka-influx',
    database: 'oneka',
});

const winstonOptions = {
    format: combine(
        timestamp(),
        prettyPrint()
      ),
    transports: [new transports.Console()],
    level: 'info'
};

const logger = new createLogger(winstonOptions);

logger.debug(influx);

let object;
let DaqMessage;

//=============================
// Flatten
//=============================
JSON.flatten = function (data) {
    let result = {};
    function recurse(cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            let l = cur.length + 1;
            for (let i = 1; i < l; i++)
                recurse(cur[i - 1], prop ? prop + "." + i : "" + i);
            if (l == 0)
                result[prop] = [];
        } else {
            let isEmpty = true;
            for (let p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop + "." + p : p);
            }
            if (isEmpty)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
}

//=============================
// Start
//=============================
protobuf.load("spec/daqmessage.proto", (err, root) => {
    if (err)
        throw err;

    // Obtain a message type
    DaqMessage = root.lookupType("DaqMessage");

    influx.getDatabaseNames()
        .then(names => {
            if (!names.includes('oneka')) {
                return influx.createDatabase('oneka');
            }
        }).catch(error => logger.error({ error }));


    protobufData = null
    let server = net.createServer((socket) => {
        socket.on("error", (err) => {
            logger.error("Client disconnected with error")
            // console.log(err.stack)
        })

        socket.on('data', (data) => {
            protobufData = protobuf.Reader.create(data)
            try {
                // Decode an Uint8Array (browser) or Buffer (node) to a message
                const message = DaqMessage.decodeDelimited(protobufData);

                // Maybe convert the message back to a plain object
                object = DaqMessage.toObject(message, {
                    longs: String,
                    enums: String,
                    bytes: String,
                    arrays: true,
                    defaults: true,
                });

                flatObject = JSON.flatten(object);
                const currentBoardId = flatObject.boardId;
                delete flatObject.boardId

                logger.info(`Writing to DB with Board ID ${currentBoardId}`);
                logger.debug(object);

                influx.writePoints([
                    {
                        measurement: 'oneka',
                        tags: { board_id: currentBoardId },
                        fields: flatObject
                    }
                ]).then(() => {
                    // res.json('Added data to the Db');
                }).catch((e) => {
                    logger.error(e);
                });
            } catch (err) {
                logger.error("waiting for more")
                logger.error(err.stack)
                logger.error(protobufData)
            }
        });
    });

    server.listen(1337, '0.0.0.0');
});
