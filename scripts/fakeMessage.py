import daqmessage_pb2

message = daqmessage_pb2.DaqMessage()
message.boardId = 0
message.powerSupplyVoltage_mV = 1
message.powerSupplyCurrent_mA = 2
message.chargeVoltage_mV = 3
message.chargeCurrent_mA = 4

f = open("out.bin", "wb")
f.write(message.SerializeToString())
f.close()