// Options for the customizer steps
export const customizationOptions = {
  controllers: [
    { id: 'Arduino UNO', name: 'Arduino UNO', icon: 'cpu' },
    { id: 'Arduino Mega', name: 'Arduino Mega', icon: 'cpu' },
    { id: 'ESP32', name: 'ESP32', icon: 'wifi' },
    { id: 'ESP8266', name: 'ESP8266', icon: 'wifi' },
    { id: 'Raspberry Pi', name: 'Raspberry Pi', icon: 'hard-drive' },
    { id: 'STM32', name: 'STM32', icon: 'cpu' },
    { id: 'Other', name: 'Other (Specify later)', icon: 'help-circle' }
  ],
  sensors: [
    { id: 'Temperature', name: 'Temperature', icon: 'thermometer' },
    { id: 'Humidity', name: 'Humidity', icon: 'cloud-rain' },
    { id: 'Soil Moisture', name: 'Soil Moisture', icon: 'droplet' },
    { id: 'LDR', name: 'Light (LDR)', icon: 'sun' },
    { id: 'Gas', name: 'Gas/Smoke', icon: 'wind' },
    { id: 'PIR', name: 'Motion (PIR)', icon: 'activity' },
    { id: 'Ultrasonic', name: 'Ultrasonic', icon: 'radio' },
    { id: 'IR', name: 'Infrared (IR)', icon: 'eye' },
    { id: 'RFID', name: 'RFID', icon: 'credit-card' },
    { id: 'GPS', name: 'GPS', icon: 'map-pin' },
    { id: 'Current Sensor', name: 'Current', icon: 'zap' },
    { id: 'Voltage Sensor', name: 'Voltage', icon: 'battery' }
  ],
  communication: [
    { id: 'Wi-Fi', name: 'Wi-Fi', icon: 'wifi' },
    { id: 'Bluetooth', name: 'Bluetooth', icon: 'bluetooth' },
    { id: 'GSM', name: 'GSM/GPRS', icon: 'smartphone' },
    { id: 'LoRa', name: 'LoRa', icon: 'radio' },
    { id: 'MQTT', name: 'MQTT Protocol', icon: 'share-2' },
    { id: 'HTTP', name: 'HTTP Protocol', icon: 'globe' },
    { id: 'WebSocket', name: 'WebSocket', icon: 'zap' }
  ],
  displays: [
    { id: 'OLED', name: 'OLED Display', icon: 'monitor' },
    { id: 'LCD', name: 'LCD Display', icon: 'tv' },
    { id: 'TFT', name: 'TFT Touch', icon: 'smartphone' },
    { id: 'LED', name: 'LED Indicators', icon: 'sun' },
    { id: 'Buzzer', name: 'Buzzer/Alarm', icon: 'bell' },
    { id: 'Relay', name: 'Relay Switch', icon: 'toggle-right' },
    { id: 'Motor', name: 'DC Motor', icon: 'settings' },
    { id: 'Servo', name: 'Servo Motor', icon: 'rotate-cw' },
    { id: 'Pump', name: 'Water Pump', icon: 'droplet' }
  ],
  software: [
    { id: 'Arduino Code', name: 'Arduino Code', icon: 'code' },
    { id: 'ESP32 Code', name: 'ESP32 Code', icon: 'code' },
    { id: 'Python', name: 'Python Script', icon: 'terminal' },
    { id: 'Web Dashboard', name: 'Web Dashboard', icon: 'layout' },
    { id: 'Mobile App', name: 'Mobile App', icon: 'smartphone' },
    { id: 'Firebase', name: 'Firebase DB', icon: 'database' },
    { id: 'MQTT Dashboard', name: 'MQTT Dashboard', icon: 'bar-chart' },
    { id: 'Database', name: 'Custom Database', icon: 'server' },
    { id: 'API Integration', name: 'API Integration', icon: 'link' }
  ],
  power: [
    { id: 'USB', name: 'USB Power', icon: 'usb' },
    { id: '5V Adapter', name: '5V Adapter', icon: 'plug' },
    { id: '12V Adapter', name: '12V Adapter', icon: 'plug' },
    { id: 'Battery', name: 'Li-ion Battery', icon: 'battery' },
    { id: 'Solar', name: 'Solar Powered', icon: 'sun' },
    { id: 'Custom', name: 'Custom Power', icon: 'zap' }
  ],
  hardware: [
    { id: 'No enclosure', name: 'No Enclosure', icon: 'box' },
    { id: 'Basic enclosure', name: 'Basic Enclosure', icon: 'package' },
    { id: 'Custom enclosure', name: '3D Printed Case', icon: 'printer' },
    { id: 'Breadboard prototype', name: 'Breadboard', icon: 'grid' },
    { id: 'PCB', name: 'General PCB', icon: 'cpu' },
    { id: 'Custom PCB', name: 'Custom Designed PCB', icon: 'layers' }
  ]
};
