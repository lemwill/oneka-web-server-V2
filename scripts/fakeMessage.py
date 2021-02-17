import daqmessage_pb2
import time
import math
import requests
from google.protobuf.internal.encoder import _VarintBytes

message = daqmessage_pb2.DaqMessage()
message.boardId = 111111

t = (time.time()) * 1e3

for i in range(2):
  sample = message.samples.add()

  sample.ntpTimestamp = math.trunc((t + (1000 * i)))
  sample.powerSupplyVoltage_mV = 2 
  sample.powerSupplyCurrent_mA = 3
  sample.chargeVoltage_mV = 4
  sample.chargeCurrent_mA = 5

  analog = sample.analogChan.add()
  analog.current = 3001
  analog.voltage = 3002
  analog.digitalIn = 1

  diff = sample.differentialChan.add()
  diff.voltage = 12.345

  diff = sample.differentialChan.add()
  diff.voltage = 12.346

  sal = sample.salinityChan.add()
  sal.salinity = 23

  sample.imudata.pitch = 1
  sample.imudata.roll = 2
  sample.imudata.yaw = 3
  sample.imudata.accelX = 4
  sample.imudata.accelY = 5
  sample.imudata.accelZ = 6

  sample.gpsdata.latitude = 0
  sample.gpsdata.longitude = 45.4660259
  sample.gpsdata.altitude = -73.5604407
  sample.gpsdata.dilutionOfPrecision = 0
  print(sample.ntpTimestamp)


#print(message.SerializeToString())

daqmessage = daqmessage_pb2.DaqMessage()
daqmessage.ParseFromString(message.SerializeToString())

#print(daqmessage.boardId)

size = message.ByteSize()

r = requests.post(url="http://localhost:3001/v1/data",
                  data=_VarintBytes(size)+message.SerializeToString(),
                  headers={'Content-Type': 'application/octet-stream'})

print(r.status_code)
