var net = require('net');
protobuf = require('protobufjs');
ByteBuffer = require("bytebuffer");


var object;
var DaqMessage

function connectDatabase(){

}

protobuf.load("daqmessage.proto", function(err, root) {
    if (err)
        throw err;

    // Obtain a message type
    DaqMessage = root.lookupType("DaqMessage");




    const Influx = require('influx');

    const influx = new Influx.InfluxDB({
        host: 'localhost',
        database: 'statistics',
    });




    influx.getDatabaseNames()
        .then(names => {
            if (!names.includes('statistics')) {
                return influx.createDatabase('statistics');
            }
        })
        .then(() => {
        })
        .catch(error => console.log({ error }));



    var maxMessageLength = 4096; // i.e. maximum expected
    var bb = ByteBuffer.allocate(2 * maxMessageLength);

    var i = 0

    test1 = null
    var server = net.createServer(function(socket) {
        socket.write('Echo server\r\n');

        socket.on("error", function(err) {
            console.log("Client disconnected")
           // console.log(err.stack)
        })

        socket.on('data', function (data) {


            // Exemplary payload
            var payload = { ch1cur: i, ch1volt:2};
            i = i + 1

            // Verify the payload if necessary (i.e. when possibly incomplete or invalid)
            var errMsg = DaqMessage.verify(payload);
            if (errMsg)
                throw Error(errMsg);

            // Create a new message
            var message = DaqMessage.create(payload); // or use .fromObject if conversion is necessary

            // Encode a message to an Uint8Array (browser) or Buffer (node)
            var buffer = DaqMessage.encodeDelimited(message).finish();
            // ... do something with buffer




            if (test1 != null) {

               // console.log(buffer.toString())

                test1 = test1.buf.slice(test1.pos)

                const totalLength = data.length + test1.length
                console.log(totalLength);
                buffer = Buffer.concat([test1, data], totalLength);
            }

            test1 = protobuf.Reader.create(data)




            bb.append(buffer);
            try {
                // Decode an Uint8Array (browser) or Buffer (node) to a message
                var message = DaqMessage.decodeDelimited(test1);
                // ... do something with message

                // If the application uses length-delimited buffers, there is also encodeDelimited and decodeDelimited.

                // Maybe convert the message back to a plain object
                object = DaqMessage.toObject(message, {
                    longs: String,
                    enums: String,
                    bytes: String,
                    // see ConversionOptions
                });



                console.log(object)


                influx.writePoints([
                    {
                        measurement: 'statistics',
                        tags: { product_id: 101},
                        fields: object
                    } ])
                    .then(() => {
                        // res.json('Added data to the Db');
                    });

                console.log(test1)

            } catch (err) {
                console.log("waiting for more")
                test1.pos = 0
                console.log(test1)
            }


        });
    });

    server.listen(1337, '192.168.2.111');
    //server.listen(1337, '127.0.0.1');

 



    console.log("Writing points")
    influx.writePoints([
      {
        measurement: 'statistics',
        tags: { product_id: 100},
        fields: { depth: 0, time: 0}
      } ])
        .then(() => {
          console.log("Points written")
         // res.json('Added data to the Db');

        });




});
