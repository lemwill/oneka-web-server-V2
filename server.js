var net = require('net');
protobuf = require('protobufjs');


var object;
var DaqMessage



//=============================
// Flatten
//=============================


JSON.flatten = function(data) {
    var result = {};
    function recurse (cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            for(var i=0, l=cur.length; i<l; i++)
                recurse(cur[i], prop ? prop+"."+i : ""+i);
            if (l == 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop+"."+p : p);
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
protobuf.load("daqmessage.proto", function(err, root) {
    if (err)
        throw err;

    // Obtain a message type
    DaqMessage = root.lookupType("DaqMessage");

    const Influx = require('influx');

    const influx = new Influx.InfluxDB({
        host: 'localhost',
        database: 'oneka',
    });


    influx.getDatabaseNames()
        .then(names => {
            if (!names.includes('oneka')) {
                return influx.createDatabase('oneka');
            }
        })
        .then(() => {
        })
        .catch(error => console.log({ error }));


    protobufData = null
    var server = net.createServer(function(socket) {
        socket.write('Echo server\r\n');

        socket.on("error", function(err) {
            console.log("Client disconnected")
           // console.log(err.stack)
        })

        socket.on('data', function (data) {



            protobufData = protobuf.Reader.create(data)


            try {
                // Decode an Uint8Array (browser) or Buffer (node) to a message
                var message = DaqMessage.decodeDelimited(protobufData);

                // Maybe convert the message back to a plain object
                object = DaqMessage.toObject(message, {
                    longs: String,
                    enums: String,
                    bytes: String,
                    arrays: true,
                    defaults: true,
                });


                flatObject = JSON.flatten(object);
                var currentBoardId = flatObject.boardId;
                delete flatObject.boardId

                console.log("Writing to DB with Board ID " + currentBoardId);

                console.log(object);

                influx.writePoints([
                    {
                        measurement: 'oneka',
                        tags: { board_id: currentBoardId},
                        fields: flatObject
                    } ])
                    .then(() => {
                        // res.json('Added data to the Db');
                    });


            } catch (err) {
                console.log("waiting for more")
                console.log(err)
                console.log(protobufData)
            }


        });
    });

    server.listen(1337, '192.168.2.113');

});
