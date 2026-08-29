// Pricing data for dynamic calculation
export const pricing = {
  controllers: {
    'Arduino UNO': 500,
    'Arduino Mega': 900,
    'ESP32': 600,
    'ESP8266': 350,
    'Raspberry Pi': 4500,
    'STM32': 400,
    'Other': 500
  },
  sensors: {
    'Temperature': 150,
    'Humidity': 150,
    'Soil Moisture': 100,
    'LDR': 50,
    'Gas': 200,
    'PIR': 120,
    'Ultrasonic': 100,
    'IR': 80,
    'RFID': 250,
    'GPS': 600,
    'Current Sensor': 200,
    'Voltage Sensor': 100,
    'Other': 150
  },
  communication: {
    'Wi-Fi': 300,
    'Bluetooth': 250,
    'GSM': 800,
    'LoRa': 900,
    'MQTT': 0, // Software protocol
    'HTTP': 0,
    'WebSocket': 0,
    'Other': 300
  },
  displays: {
    'OLED': 350,
    'LCD': 250,
    'TFT': 800,
    'LED': 50,
    'Buzzer': 30,
    'Relay': 100,
    'Motor': 150,
    'Servo': 180,
    'Pump': 250
  },
  software: {
    'Arduino Code': 500,
    'ESP32 Code': 600,
    'Python': 800,
    'Web Dashboard': 1500,
    'Mobile App': 2500,
    'Firebase': 800,
    'MQTT Dashboard': 1000,
    'Database': 1200,
    'API Integration': 1000
  },
  power: {
    'USB': 50,
    '5V Adapter': 150,
    '12V Adapter': 250,
    'Battery': 400,
    'Solar': 800,
    'Custom': 500
  },
  hardware: {
    'No enclosure': 0,
    'Basic enclosure': 200,
    'Custom enclosure': 800,
    'PCB': 500,
    'Breadboard prototype': 100,
    'Custom PCB': 1500
  },
  customizationBaseCharge: 500
};
