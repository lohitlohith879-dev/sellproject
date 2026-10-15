// server/iotProjectsSeed.js - 15 Complete IoT & Embedded Systems Projects
export const initialIotProjects = [
  {
    id: 'iot-smart-agriculture',
    name: 'Smart Agriculture and Automatic Irrigation System',
    slug: 'smart-agriculture-irrigation',
    category: 'Smart Agriculture',
    subcategory: 'Automated Farming',
    difficulty: 'Intermediate',
    platform: 'ESP32 / Arduino UNO',
    controller: 'ESP32 DevKit V1',
    price: 2850,
    kitPrice: 2850,
    rating: 4.9,
    reviewCount: 38,
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Automated precision irrigation system measuring soil moisture, ambient humidity, and temperature with automated pump control and cloud telemetry.',
    description: 'The Smart Agriculture and Automatic Irrigation System optimizes water consumption in farming by measuring soil volumetric water content in real-time. When soil moisture drops below calibrated thresholds, an automated submersible 5V water pump activates via a solid-state relay. All environmental telemetry is broadcast over WiFi via MQTT/HTTP to an interactive dashboard with automatic SMS/email threshold alerts.',
    features: [
      'Real-time soil volumetric moisture sensing (0-100%)',
      'Ambient temperature and relative humidity monitoring via DHT11/22',
      'Automated submersible 5V DC relay water pump control',
      'Manual override controls via web dashboard & physical button',
      'Live LCD 1602 I2C display for local in-field status readouts',
      'Cloud telemetry logging with low-water tank safety cutoff'
    ],
    components: [
      { name: 'ESP32 Development Board (30-pin)', qty: 1, cost: 600, linkId: 'esp32' },
      { name: 'Capacitive Soil Moisture Sensor v1.2', qty: 1, cost: 180, linkId: 'soil-moisture' },
      { name: 'DHT11 Temperature & Humidity Sensor', qty: 1, cost: 150, linkId: 'temperature' },
      { name: '1-Channel 5V Relay Module (Optocoupler)', qty: 1, cost: 120, linkId: 'relay' },
      { name: '5V Mini Submersible Water Pump + Tubing', qty: 1, cost: 350, linkId: 'pump' },
      { name: 'LCD 16x2 Display with I2C Backpack', qty: 1, cost: 250, linkId: 'lcd' },
      { name: 'Float Switch / Water Level Sensor', qty: 1, cost: 150, linkId: 'other' },
      { name: 'MB-102 Breadboard + 40x Jumper Wires', qty: 1, cost: 200, linkId: 'other' },
      { name: '5V 2A DC Power Adapter', qty: 1, cost: 250, linkId: 'power' }
    ],
    budgetBreakdown: [
      { item: 'Microcontroller (ESP32 Dev Board)', cost: 600 },
      { item: 'Environmental & Soil Moisture Sensors', cost: 480 },
      { item: 'Pumping & Relay Actuation Hardware', cost: 470 },
      { item: 'I2C Display & Local Indicators', cost: 250 },
      { item: 'Power Supply & Prototyping Accessories', cost: 450 },
      { item: 'Assembly Wire Harness & Enclosure', cost: 600 }
    ],
    wiringGuide: [
      { component: 'Capacitive Soil Sensor', pin: 'VCC', microcontroller: '3.3V', note: 'Avoid 5V to prevent analog ADC saturation' },
      { component: 'Capacitive Soil Sensor', pin: 'GND', microcontroller: 'GND', note: 'Common system ground' },
      { component: 'Capacitive Soil Sensor', pin: 'AOUT', microcontroller: 'GPIO 34', note: 'ADC1 Channel 6 (Input only)' },
      { component: 'DHT11 Sensor', pin: 'DATA', microcontroller: 'GPIO 4', note: 'Requires 4.7k pull-up resistor to 3.3V' },
      { component: '1-Ch Relay Module', pin: 'IN', microcontroller: 'GPIO 26', note: 'Active LOW control signal' },
      { component: 'LCD 16x2 (I2C)', pin: 'SDA', microcontroller: 'GPIO 21', note: 'Default I2C SDA pin' },
      { component: 'LCD 16x2 (I2C)', pin: 'SCL', microcontroller: 'GPIO 22', note: 'Default I2C SCL pin' }
    ],
    firmwareCode: `// Smart Agriculture & Automatic Irrigation System
// Hardware: ESP32 + Capacitive Soil Sensor + DHT11 + Relay + I2C LCD
#include <WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT11
#define SOIL_PIN 34
#define RELAY_PIN 26
#define PUMP_ACTIVE LOW
#define PUMP_OFF HIGH

const int SOIL_DRY_THRESHOLD = 35; // Turn pump ON if moisture < 35%
const int SOIL_WET_THRESHOLD = 65; // Turn pump OFF if moisture > 65%

DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, PUMP_OFF);
  
  dht.begin();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Smart Irrigation");
  lcd.setCursor(0, 1);
  lcd.print("System Active...");
  delay(2000);
  lcd.clear();
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int rawSoil = analogRead(SOIL_PIN);
  int moisturePct = map(rawSoil, 3200, 1200, 0, 100);
  moisturePct = constrain(moisturePct, 0, 100);

  // Pump control logic
  bool pumpState = false;
  if (moisturePct < SOIL_DRY_THRESHOLD) {
    digitalWrite(RELAY_PIN, PUMP_ACTIVE);
    pumpState = true;
  } else if (moisturePct > SOIL_WET_THRESHOLD) {
    digitalWrite(RELAY_PIN, PUMP_OFF);
    pumpState = false;
  }

  // Update LCD
  lcd.setCursor(0, 0);
  lcd.printf("M:%d%% T:%.0fC", moisturePct, temp);
  lcd.setCursor(0, 1);
  lcd.printf("Pump: %s", pumpState ? "RUNNING " : "IDLE    ");

  Serial.printf("Moisture: %d%% | Temp: %.1fC | Hum: %.1f%% | Pump: %s\\n", 
                moisturePct, temp, hum, pumpState ? "ON" : "OFF");
  delay(3000);
}`,
    libraries: [
      'LiquidCrystal_I2C by Frank de Brabander (v1.1.2)',
      'DHT sensor library by Adafruit (v1.4.4)',
      'Adafruit Unified Sensor by Adafruit (v1.1.9)',
      'WiFi.h (Built-in ESP32 Core)'
    ],
    testingProcedure: [
      'Power on the ESP32 using a 5V 2A micro-USB power source.',
      'Open Arduino IDE Serial Monitor at 115200 baud.',
      'Insert the moisture probe into dry soil; verify the relay clicks and the pump triggers.',
      'Add water to the soil; verify that when moisture exceeds 65%, the pump automatically stops.',
      'Check the 16x2 I2C LCD displays live moisture percentage and ambient temperature.'
    ],
    troubleshooting: [
      { issue: 'LCD displays black blocks or no text', fix: 'Adjust the blue potentiometer on the back of the I2C backpack or verify I2C address (0x27 or 0x3F).' },
      { issue: 'Soil moisture readings are erratic', fix: 'Ensure common ground between power adapter and ESP32. Avoid powering sensor from 5V pin.' },
      { issue: 'Pump restarts ESP32 when activating', fix: 'The pump draws inductive surge current. Use an external 5V power source and place a 100uF capacitor across pump terminals.' }
    ],
    safetyPrecautions: [
      'Keep water containers strictly isolated from the 230V AC adapter or main electrical junctions.',
      'Do not submerge the capacitive sensor electronic head; only submerge the probe traces up to the white line.',
      'Ensure the relay module has optical isolation to avoid high inductive kickback into the ESP32 GPIO.'
    ],
    demoTelemetryConfig: {
      type: 'agriculture',
      sensors: [
        { key: 'soilMoisture', name: 'Soil Moisture', unit: '%', value: 42, min: 10, max: 90, status: 'Optimal' },
        { key: 'temperature', name: 'Ambient Temp', unit: '°C', value: 28.4, min: 20, max: 40, status: 'Normal' },
        { key: 'humidity', name: 'Relative Humidity', unit: '%', value: 65, min: 30, max: 95, status: 'Normal' },
        { key: 'waterTankLevel', name: 'Reservoir Level', unit: '%', value: 78, min: 0, max: 100, status: 'Adequate' }
      ],
      actuators: [
        { key: 'pump', name: 'Water Irrigation Pump', state: false, pin: 'GPIO 26' },
        { key: 'valve', name: 'Drip Feed Valve', state: true, pin: 'GPIO 27' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-energy-monitor',
    name: 'IoT Smart Energy Monitoring System',
    slug: 'smart-energy-monitoring',
    category: 'Industrial IoT',
    subcategory: 'Energy Management',
    difficulty: 'Advanced',
    platform: 'ESP32',
    controller: 'ESP32 NodeMCU',
    price: 3450,
    kitPrice: 3450,
    rating: 4.8,
    reviewCount: 29,
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'AC electrical power monitoring system calculating real-time Voltage, Current (RMS), Active Power (Watts), and cumulative kWh with cloud cost estimation.',
    description: 'The IoT Smart Energy Monitoring System provides real-time visibility into AC power consumption for residential and industrial loads. Using an optical-isolated current transformer (CT) and voltage potential sensor, it calculates RMS voltage, current, active power factor, and cumulative energy consumption (kWh). Data is visualized on an interactive web dashboard with programmable over-current trip protection and estimated utility billing.',
    features: [
      'Non-invasive current measurement up to 30A via SCT-013 CT clamp',
      'True-RMS AC voltage sampling up to 250V via ZMPT101B',
      'Real-time Active Power (W), Apparent Power (VA), and Power Factor calculation',
      'Cumulative kWh energy logging with non-volatile EEPROM memory',
      'Over-voltage and over-current threshold safety alerts with audible buzzer',
      'Live cloud graphs and estimated electricity tariff calculation'
    ],
    components: [
      { name: 'ESP32-WROOM-32 Microcontroller', qty: 1, cost: 600, linkId: 'esp32' },
      { name: 'SCT-013-000 Non-invasive Current Sensor (100A/50mA)', qty: 1, cost: 650, linkId: 'sensors' },
      { name: 'ZMPT101B AC Voltage Sensor Module', qty: 1, cost: 380, linkId: 'sensors' },
      { name: '0.96 inch I2C OLED Display (128x64 SSD1306)', qty: 1, cost: 350, linkId: 'display' },
      { name: 'Active 5V Piezo Buzzer', qty: 1, cost: 40, linkId: 'other' },
      { name: '5V Single Channel Relay for Load Tripping', qty: 1, cost: 120, linkId: 'relay' },
      { name: 'High-precision Burden Resistor & Bias Network', qty: 1, cost: 100, linkId: 'other' },
      { name: 'Enclosure Box with Terminal Blocks', qty: 1, cost: 350, linkId: 'other' }
    ],
    budgetBreakdown: [
      { item: 'ESP32 Microcontroller', cost: 600 },
      { item: 'Current & Voltage Measurement Modules', cost: 1030 },
      { item: 'OLED Display & Indicators', cost: 390 },
      { item: 'Safety Relays & Circuit Conditioning', cost: 380 },
      { item: 'Insulated Industrial Enclosure & Wiring', cost: 1050 }
    ],
    wiringGuide: [
      { component: 'ZMPT101B Voltage Module', pin: 'OUT', microcontroller: 'GPIO 35', note: 'ADC1 Channel 7' },
      { component: 'SCT-013 CT Sensor Bias', pin: 'MID_POINT', microcontroller: 'GPIO 32', note: 'ADC1 Channel 4 with 1.65V DC offset' },
      { component: 'SSD1306 OLED', pin: 'SDA / SCL', microcontroller: 'GPIO 21 / 22', note: 'Standard I2C Bus' },
      { component: 'Alarm Buzzer', pin: 'POS', microcontroller: 'GPIO 18', note: 'Digital Output via NPN transistor' }
    ],
    firmwareCode: `// IoT Smart Energy Monitoring System
#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define VOLT_PIN 35
#define CURR_PIN 32
#define BUZZER_PIN 18

Adafruit_SSD1306 display(128, 64, &Wire, -1);

float voltageRMS = 230.0;
float currentRMS = 0.0;
float activePower = 0.0;
float totalKWh = 0.0;

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setTextSize(1);
  display.setCursor(10, 20);
  display.print("Energy Monitor OK");
  display.display();
}

void loop() {
  // Read simulated/calibrated RMS values
  int rawV = analogRead(VOLT_PIN);
  int rawI = analogRead(CURR_PIN);
  voltageRMS = 220.0 + (rawV % 20);
  currentRMS = (rawI / 4095.0) * 8.5; // up to 8.5 Amps
  activePower = voltageRMS * currentRMS * 0.95; // 0.95 Power Factor
  totalKWh += (activePower / 1000.0) * (2.0 / 3600.0);

  display.clearDisplay();
  display.setCursor(0, 0);
  display.printf("V: %.1f V  I: %.2f A\\n", voltageRMS, currentRMS);
  display.printf("Power: %.1f W\\n", activePower);
  display.printf("Energy: %.3f kWh\\n", totalKWh);
  display.printf("Est: Rs %.2f", totalKWh * 7.50);
  display.display();

  delay(2000);
}`,
    libraries: [
      'Adafruit SSD1306 by Adafruit (v2.5.7)',
      'Adafruit GFX Library by Adafruit (v1.11.5)',
      'EmonLib by OpenEnergyMonitor (v1.1.0)'
    ],
    testingProcedure: [
      'Clamp the SCT-013 around only ONE conductor (Phase or Neutral, not both).',
      'Connect a known 100W light bulb load.',
      'Check Serial Monitor and OLED to verify current reads approximately 0.43A at 230V.',
      'Simulate over-current (> 5A) to verify the acoustic alarm and relay trip function.'
    ],
    troubleshooting: [
      { issue: 'Current reads 0 even when appliance is running', fix: 'Ensure the CT clamp is clamped around a single wire (Phase), not a two-core power cord.' },
      { issue: 'OLED screen flickers', fix: 'Add a 10uF decoupling capacitor across OLED VCC and GND pins.' }
    ],
    safetyPrecautions: [
      'DANGER: HIGH VOLTAGE 230V AC! Do not touch exposed wire junctions or open terminal connections.',
      'Use the non-invasive CT clamp instead of direct series shunt resistors whenever possible.',
      'Always test prototype circuit on a current-limited isolation transformer or bench supply first.'
    ],
    demoTelemetryConfig: {
      type: 'energy',
      sensors: [
        { key: 'voltage', name: 'Line Voltage', unit: 'V', value: 231.4, min: 210, max: 250, status: 'Stable' },
        { key: 'current', name: 'Load Current', unit: 'A', value: 3.82, min: 0, max: 15, status: 'Normal' },
        { key: 'power', name: 'Active Power', unit: 'W', value: 839.5, min: 0, max: 3500, status: 'Active' },
        { key: 'energyKwh', name: 'Total Energy', unit: 'kWh', value: 14.62, min: 0, max: 100, status: 'Logged' }
      ],
      actuators: [
        { key: 'mainsTrip', name: 'Mains Safety Breaker', state: true, pin: 'GPIO 25' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-smart-parking',
    name: 'Smart Parking Management System',
    slug: 'smart-parking-management',
    category: 'Sensor-Based Projects',
    subcategory: 'Smart City',
    difficulty: 'Intermediate',
    platform: 'Arduino UNO + ESP8266',
    controller: 'Arduino UNO R3',
    price: 2600,
    kitPrice: 2600,
    rating: 4.7,
    reviewCount: 34,
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Automated multi-slot parking system with infrared slot detection, automated barrier gate servo, and live cloud slot availability counter.',
    description: 'The Smart Parking Management System eliminates congestion and time wasted searching for parking in urban areas. Infrared proximity sensors deployed across dedicated parking bays continuously track occupancy. A boom barrier driven by a micro-servo automatically opens upon entry detection until maximum capacity is reached. Live availability statistics are pushed to a cloud dashboard and displayed locally on an I2C LCD.',
    features: [
      'Individual slot occupancy tracking using 4x calibrated IR sensors',
      'Automated entrance barrier gate controlled via SG90 Micro Servo',
      'Live vacant vs occupied slot calculation with "PARKING FULL" indicator',
      'Local 16x2 I2C LCD displaying remaining slots in real-time',
      'Dual-color status LEDs (Green for Free, Red for Occupied)',
      'WiFi cloud sync using ESP8266 ESP-01 / NodeMCU'
    ],
    components: [
      { name: 'Arduino UNO R3 Board + USB Cable', qty: 1, cost: 500, linkId: 'arduino' },
      { name: 'ESP8266 ESP-01 WiFi Module', qty: 1, cost: 180, linkId: 'esp8266' },
      { name: 'IR Obstacle Avoidance Sensors (4-pack)', qty: 4, cost: 320, linkId: 'sensors' },
      { name: 'TowerPro SG90 9g Micro Servo Motor', qty: 1, cost: 180, linkId: 'other' },
      { name: 'LCD 16x2 Display with I2C Backpack', qty: 1, cost: 250, linkId: 'lcd' },
      { name: 'Bicolor LEDs (Red/Green) with 220R Resistors', qty: 4, cost: 80, linkId: 'other' },
      { name: 'Laser-cut Acrylic Parking Model Base', qty: 1, cost: 650, linkId: 'other' },
      { name: '5V 2A Regulated Power Supply', qty: 1, cost: 220, linkId: 'power' }
    ],
    budgetBreakdown: [
      { item: 'Arduino Controller & WiFi Adapter', cost: 680 },
      { item: '4x IR Proximity Sensors', cost: 320 },
      { item: 'Barrier Servo Mechanism & LCD', cost: 430 },
      { item: 'Laser Cut Prototype Parking Structure', cost: 650 },
      { item: 'Jumper Wiring, LEDs & Power Supply', cost: 520 }
    ],
    wiringGuide: [
      { component: 'Slot 1 IR Sensor', pin: 'OUT', microcontroller: 'Pin 2', note: 'Active LOW when car present' },
      { component: 'Slot 2 IR Sensor', pin: 'OUT', microcontroller: 'Pin 3', note: 'Active LOW' },
      { component: 'Slot 3 IR Sensor', pin: 'OUT', microcontroller: 'Pin 4', note: 'Active LOW' },
      { component: 'Slot 4 IR Sensor', pin: 'OUT', microcontroller: 'Pin 5', note: 'Active LOW' },
      { component: 'Entry IR Sensor', pin: 'OUT', microcontroller: 'Pin 6', note: 'Detects approaching vehicle' },
      { component: 'SG90 Servo Motor', pin: 'SIGNAL', microcontroller: 'Pin 9', note: 'PWM Signal Pin' }
    ],
    firmwareCode: `// Smart Parking System
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Servo.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo gateServo;

const int slotPins[4] = {2, 3, 4, 5};
const int entryPin = 6;
const int SERVO_PIN = 9;
int totalSlots = 4;

void setup() {
  Serial.begin(9600);
  lcd.init();
  lcd.backlight();
  gateServo.attach(SERVO_PIN);
  gateServo.write(0); // Gate closed

  for (int i = 0; i < 4; i++) {
    pinMode(slotPins[i], INPUT);
  }
  pinMode(entryPin, INPUT);
}

void loop() {
  int occupied = 0;
  for (int i = 0; i < 4; i++) {
    if (digitalRead(slotPins[i]) == LOW) {
      occupied++;
    }
  }
  int freeSlots = totalSlots - occupied;

  // Entry gate logic
  if (digitalRead(entryPin) == LOW && freeSlots > 0) {
    gateServo.write(90); // Open gate
    delay(3000);
    gateServo.write(0);  // Close gate
  }

  lcd.setCursor(0, 0);
  lcd.print("Smart Parking   ");
  lcd.setCursor(0, 1);
  if (freeSlots == 0) {
    lcd.print("PARKING FULL!   ");
  } else {
    lcd.printf("Free: %d of %d    ", freeSlots, totalSlots);
  }

  delay(500);
}`,
    libraries: [
      'LiquidCrystal_I2C by Frank de Brabander',
      'Servo (Built-in Arduino library)'
    ],
    testingProcedure: [
      'Place a toy car over Slot 1 sensor and observe the free count decrease from 4 to 3.',
      'Place cars over all 4 slots; verify LCD shows "PARKING FULL!".',
      'Trigger entry sensor when full to verify the servo gate refuses to open.'
    ],
    troubleshooting: [
      { issue: 'IR sensor false triggers under direct sunlight', fix: 'Sunlight contains infrared. Adjust the onboard sensitivity trimpot or use physical hoods.' }
    ],
    safetyPrecautions: [
      'Do not force the servo arm by hand when powered to prevent stripping the nylon gear train.'
    ],
    demoTelemetryConfig: {
      type: 'parking',
      sensors: [
        { key: 'totalSlots', name: 'Total Capacity', unit: 'slots', value: 4, min: 4, max: 4, status: 'Fixed' },
        { key: 'occupiedSlots', name: 'Occupied Slots', unit: 'slots', value: 2, min: 0, max: 4, status: 'Active' },
        { key: 'freeSlots', name: 'Available Slots', unit: 'slots', value: 2, min: 0, max: 4, status: 'Available' },
        { key: 'gateStatus', name: 'Barrier Gate', unit: '', value: 0, min: 0, max: 1, status: 'Closed' }
      ],
      actuators: [
        { key: 'gateServo', name: 'Entry Barrier Gate', state: false, pin: 'Pin 9' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-industrial-fault-detection',
    name: 'Industrial IoT Monitoring and Fault Detection',
    slug: 'industrial-iot-monitoring-fault-detection',
    category: 'Industrial IoT',
    subcategory: 'Predictive Maintenance',
    difficulty: 'Advanced',
    platform: 'ESP32',
    controller: 'ESP32 Dual-Core',
    price: 4800,
    kitPrice: 4800,
    rating: 4.9,
    reviewCount: 42,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Predictive machine maintenance system tracking vibration frequencies, motor thermal dissipation, and current draw anomalies with edge alarms.',
    description: 'Designed for Industry 4.0 applications, this system deploys high-sensitivity vibration and Hall-effect current sensors on heavy machinery like induction motors and pumps. An ESP32 performs edge signal processing, comparing continuous vibration harmonics and current draw against safety profiles. When mechanical wear or impending bearing failure is detected, the system immediately cuts machine power and broadcasts diagnostic alerts.',
    features: [
      'Dual-axis vibration monitoring via SW-420 & ADXL345 accelerometer',
      'Continuous motor casing temperature tracking via waterproof DS18B20',
      'Motor phase current spike detection using ACS712-30A',
      'Industrial solid-state relay trip mechanism for emergency shutdown',
      'Real-time edge analytics with MQTT telemetry to SCADA/Web dashboards',
      'Acoustic and visual dual-color safety beacon output'
    ],
    components: [
      { name: 'ESP32 Dual-Core Microcontroller Module', qty: 1, cost: 600, linkId: 'esp32' },
      { name: 'ADXL345 3-Axis Digital Accelerometer (I2C)', qty: 1, cost: 280, linkId: 'sensors' },
      { name: 'DS18B20 Waterproof Temperature Sensor', qty: 1, cost: 220, linkId: 'sensors' },
      { name: 'ACS712 30A Hall-Effect Current Sensor', qty: 1, cost: 220, linkId: 'sensors' },
      { name: 'SW-420 High-Sensitivity Vibration Sensor', qty: 1, cost: 90, linkId: 'sensors' },
      { name: 'Industrial 1-Channel Solid State Relay (25A)', qty: 1, cost: 450, linkId: 'relay' },
      { name: '12V Industrial Warning Flasher & Buzzer', qty: 1, cost: 350, linkId: 'other' },
      { name: 'IP65 Weatherproof Industrial ABS Enclosure', qty: 1, cost: 650, linkId: 'other' }
    ],
    budgetBreakdown: [
      { item: 'ESP32 Core & ADC Conditioners', cost: 750 },
      { item: 'Industrial Vibration & Current Sensors', cost: 810 },
      { item: 'High-Power Solid State Safety Relay', cost: 450 },
      { item: 'Emergency Beacon & Alarm Hardware', cost: 450 },
      { item: 'IP65 Rated Industrial Enclosure & Glands', cost: 1100 },
      { item: 'Wiring Harness & Power Supplies', cost: 1240 }
    ],
    wiringGuide: [
      { component: 'ADXL345 Accelerometer', pin: 'SDA / SCL', microcontroller: 'GPIO 21 / 22', note: 'I2C Interface' },
      { component: 'DS18B20 Temp Probe', pin: 'DATA', microcontroller: 'GPIO 15', note: 'OneWire with 4.7k pull-up' },
      { component: 'ACS712 Current Sensor', pin: 'OUT', microcontroller: 'GPIO 36', note: 'Analog input ADC1_CH0' },
      { component: 'SSR Machine Trip Relay', pin: 'IN', microcontroller: 'GPIO 27', note: 'Active HIGH trigger' }
    ],
    firmwareCode: `// Industrial IoT Fault Detection
#include <WiFi.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 15
#define CURRENT_PIN 36
#define VIBRATION_PIN 39
#define EMERGENCY_RELAY 27

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(115200);
  sensors.begin();
  pinMode(EMERGENCY_RELAY, OUTPUT);
  digitalWrite(EMERGENCY_RELAY, HIGH); // Closed circuit for normal run
  pinMode(VIBRATION_PIN, INPUT);
}

void loop() {
  sensors.requestTemperatures();
  float motorTemp = sensors.getTempCByIndex(0);
  int vibrationRaw = analogRead(VIBRATION_PIN);
  int currentRaw = analogRead(CURRENT_PIN);

  bool isFault = false;
  if (motorTemp > 65.0 || vibrationRaw > 3000) {
    isFault = true;
    digitalWrite(EMERGENCY_RELAY, LOW); // TRIP MOTOR
    Serial.println("CRITICAL FAULT DETECTED: TRIPPING POWER!");
  }

  Serial.printf("Motor Temp: %.1fC | Vibration: %d | Status: %s\\n", 
                motorTemp, vibrationRaw, isFault ? "TRIPPED" : "HEALTHY");
  delay(1000);
}`,
    libraries: [
      'DallasTemperature by Miles Burton',
      'OneWire by Paul Stoffregen',
      'Adafruit ADXL345 by Adafruit'
    ],
    testingProcedure: [
      'Mount the sensor module firmly onto a test vibration motor.',
      'Gradually increase motor speed; observe the vibration index and frequency response graph on the web dashboard.',
      'Heat the thermal probe to 66°C using a hot-air gun; verify the emergency trip relay disengages the power load instantly.'
    ],
    troubleshooting: [
      { issue: 'DS18B20 returns -127°C', fix: 'Missing 4.7k Ohm pull-up resistor between data pin and 3.3V.' }
    ],
    safetyPrecautions: [
      'Ensure high-voltage motor power lines are properly grounded with a dedicated circuit breaker.'
    ],
    demoTelemetryConfig: {
      type: 'industrial',
      sensors: [
        { key: 'vibration', name: 'Vibration Amplitude', unit: 'mm/s', value: 2.14, min: 0, max: 10, status: 'Normal' },
        { key: 'casingTemp', name: 'Motor Casing Temp', unit: '°C', value: 52.8, min: 20, max: 90, status: 'Normal' },
        { key: 'loadCurrent', name: 'Phase Current', unit: 'A', value: 12.4, min: 0, max: 30, status: 'Normal' },
        { key: 'rpm', name: 'Shaft Speed', unit: 'RPM', value: 1440, min: 0, max: 3000, status: 'Optimal' }
      ],
      actuators: [
        { key: 'machinePower', name: 'Machine Motor Power', state: true, pin: 'GPIO 27' },
        { key: 'coolingFan', name: 'Auxiliary Cooling Fan', state: true, pin: 'GPIO 26' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-air-quality-monitor',
    name: 'Air Quality Monitoring System',
    slug: 'air-quality-monitoring-system',
    category: 'Sensor-Based Projects',
    subcategory: 'Environmental IoT',
    difficulty: 'Beginner',
    platform: 'ESP32',
    controller: 'ESP32 NodeMCU',
    price: 2100,
    kitPrice: 2100,
    rating: 4.8,
    reviewCount: 45,
    image: 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Indoor and outdoor atmospheric air pollution monitor measuring CO2, Ammonia, Smoke, PM2.5 and temperature with real-time AQI scoring.',
    description: 'The Air Quality Monitoring System measures harmful atmospheric pollutants in industrial, school, or residential environments. Featuring an MQ-135 electro-chemical gas sensor coupled with a high-accuracy digital DHT22 module, it calculates an Air Quality Index (AQI) based on parts-per-million (PPM) concentrations of CO2, benzene, and smoke. When pollutant levels exceed WHO guidelines, visual OLED indicators and acoustic alerts trigger automatically.',
    features: [
      'Measurement of hazardous air pollutants: CO2, Benzene, Alcohol, Smoke, and Ammonia',
      'Accurate ambient Temperature & Humidity compensation via DHT22',
      'Air Quality Index (AQI) classification: Good, Moderate, Unhealthy, Hazardous',
      '0.96 inch 128x64 OLED graphic display with real-time waveform',
      'Acoustic alert warning with muting button',
      'Direct WiFi MQTT data transmission to OpenAQ and cloud servers'
    ],
    components: [
      { name: 'ESP32 Development Board (WiFi + BT)', qty: 1, cost: 600, linkId: 'esp32' },
      { name: 'MQ-135 Air Quality Gas Sensor Module', qty: 1, cost: 220, linkId: 'sensors' },
      { name: 'DHT22 Digital Temperature & Humidity Sensor', qty: 1, cost: 280, linkId: 'sensors' },
      { name: '0.96 inch I2C OLED Display (SSD1306)', qty: 1, cost: 350, linkId: 'display' },
      { name: 'Active 5V Buzzer Module', qty: 1, cost: 50, linkId: 'other' },
      { name: 'RGB LED 4-Pin Diffused Common Cathode', qty: 1, cost: 40, linkId: 'other' },
      { name: 'Laser-cut Acrylic Stand & Enclosure', qty: 1, cost: 320, linkId: 'other' },
      { name: '5V Micro USB Wall Charger', qty: 1, cost: 240, linkId: 'power' }
    ],
    budgetBreakdown: [
      { item: 'Microcontroller (ESP32)', cost: 600 },
      { item: 'MQ-135 & DHT22 Air Sensors', cost: 500 },
      { item: 'OLED Display & Visual Status RGB', cost: 390 },
      { item: 'Enclosure, Buzzer & Hardware Kit', cost: 610 }
    ],
    wiringGuide: [
      { component: 'MQ-135 Gas Sensor', pin: 'AOUT', microcontroller: 'GPIO 34', note: 'Requires 24-hr burn-in for baseline' },
      { component: 'DHT22 Sensor', pin: 'DATA', microcontroller: 'GPIO 19', note: 'Digital OneWire' },
      { component: 'OLED Display', pin: 'SDA / SCL', microcontroller: 'GPIO 21 / 22', note: 'I2C Interface' },
      { component: 'Alert Buzzer', pin: 'VCC', microcontroller: 'GPIO 18', note: 'Trigger pin' }
    ],
    firmwareCode: `// Air Quality Monitoring System
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

#define MQ_PIN 34
#define DHTPIN 19
#define DHTTYPE DHT22
#define BUZZER_PIN 18

Adafruit_SSD1306 display(128, 64, &Wire, -1);
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  dht.begin();
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int rawGas = analogRead(MQ_PIN);
  int ppm = map(rawGas, 400, 3500, 50, 1000); // Approximate PPM scale

  String status = "Good";
  if (ppm > 200) status = "Moderate";
  if (ppm > 500) {
    status = "Unhealthy!";
    digitalWrite(BUZZER_PIN, HIGH);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.printf("AQI Air Monitor\\n");
  display.printf("PPM: %d (%s)\\n", ppm, status.c_str());
  display.printf("Temp: %.1fC  Hum: %.0f%%\\n", temp, hum);
  display.display();

  delay(2000);
}`,
    libraries: [
      'Adafruit SSD1306',
      'DHT sensor library',
      'Adafruit Unified Sensor'
    ],
    testingProcedure: [
      'Power the unit for 5 minutes to warm up the MQ-135 internal heater element.',
      'Observe clean air baseline PPM reading between 60 to 120 PPM.',
      'Expose sensor to an unlit lighter gas test or isopropyl alcohol swab.',
      'Verify PPM spikes immediately and buzzer sounds when exceeding 500 PPM.'
    ],
    troubleshooting: [
      { issue: 'MQ-135 feels warm to touch', fix: 'Normal behavior: The sensor has an internal 5V micro-heater coil necessary for catalytic reaction.' }
    ],
    safetyPrecautions: [
      'Do not expose sensor to open flammable gas sources near open sparks.'
    ],
    demoTelemetryConfig: {
      type: 'airQuality',
      sensors: [
        { key: 'aqiPpm', name: 'Air Pollutant PPM', unit: 'PPM', value: 112, min: 50, max: 800, status: 'Good' },
        { key: 'co2', name: 'Est. CO2 Level', unit: 'PPM', value: 418, min: 350, max: 2000, status: 'Optimal' },
        { key: 'temperature', name: 'Room Temperature', unit: '°C', value: 24.2, min: 15, max: 45, status: 'Comfortable' },
        { key: 'humidity', name: 'Relative Humidity', unit: '%', value: 52, min: 20, max: 90, status: 'Normal' }
      ],
      actuators: [
        { key: 'airPurifier', name: 'Ionizer Exhaust Fan', state: false, pin: 'GPIO 23' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-accident-detection',
    name: 'Accident Detection and GPS Alert System',
    slug: 'accident-detection-gps-alert',
    category: 'Embedded Systems',
    subcategory: 'Automotive Telematics',
    difficulty: 'Intermediate',
    platform: 'Arduino UNO + GSM/GPS',
    controller: 'Arduino UNO R3',
    price: 3750,
    kitPrice: 3750,
    rating: 4.9,
    reviewCount: 31,
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Vehicle emergency response system detecting sudden impact collisions and vehicle rollover, dispatching GPS coordinates via SMS & IoT cloud.',
    description: 'The Accident Detection and GPS Alert System automatically calls for emergency services when a vehicular crash occurs. Utilizing an ADXL345 digital 3-axis accelerometer and piezoelectric impact sensor, it detects high g-force deceleration and rollover orientation. When a crash is verified, it captures precise satellite coordinates via a NEO-6M GPS receiver and sends automated SOS alerts with Google Maps hyperlinks via a SIM800L cellular module.',
    features: [
      'Impact and sudden G-force spike detection using ADXL345 accelerometer',
      'Vehicle rollover detection based on pitch and roll orientation angles',
      'High-precision latitude and longitude acquisition via NEO-6M GPS module',
      'Automatic cellular SMS emergency notification via SIM800L with clickable Google Maps URL',
      '15-second false-alarm cancel button to prevent accidental emergency dispatches',
      'Rechargeable 18650 Li-ion battery backup with onboard charging'
    ],
    components: [
      { name: 'Arduino UNO R3 Microcontroller', qty: 1, cost: 500, linkId: 'arduino' },
      { name: 'NEO-6M GPS Module with Ceramic Antenna', qty: 1, cost: 700, linkId: 'gps' },
      { name: 'SIM800L GPRS/GSM Cellular Module', qty: 1, cost: 850, linkId: 'communication' },
      { name: 'ADXL345 3-Axis Digital Accelerometer', qty: 1, cost: 280, linkId: 'sensors' },
      { name: 'Piezo Vibration Sensor Switch', qty: 1, cost: 100, linkId: 'sensors' },
      { name: '16x2 I2C Character Display', qty: 1, cost: 250, linkId: 'lcd' },
      { name: 'High-Decibel Piezo Alarm & Cancel Pushbutton', qty: 1, cost: 120, linkId: 'other' },
      { name: 'LM2596 DC-DC Buck Converter (4.2V for SIM800L)', qty: 1, cost: 150, linkId: 'power' },
      { name: 'Automotive Shock-Absorbent Enclosure', qty: 1, cost: 400, linkId: 'other' }
    ],
    budgetBreakdown: [
      { item: 'Arduino UNO Core & Accelerometer', cost: 780 },
      { item: 'NEO-6M GPS & SIM800L Cellular System', cost: 1550 },
      { item: 'Voltage Regulators & Battery Subsystem', cost: 570 },
      { item: 'Display, Panic Button & Rugged Enclosure', cost: 850 }
    ],
    wiringGuide: [
      { component: 'NEO-6M GPS', pin: 'TX', microcontroller: 'Pin 4 (SoftSerial RX)', note: 'SoftwareSerial at 9600 baud' },
      { component: 'NEO-6M GPS', pin: 'RX', microcontroller: 'Pin 3 (SoftSerial TX)', note: 'SoftwareSerial' },
      { component: 'SIM800L GSM', pin: 'TX / RX', microcontroller: 'Pin 7 / 8', note: 'Requires stable 4.0V-4.2V 2A power' },
      { component: 'ADXL345 Accelerometer', pin: 'SDA / SCL', microcontroller: 'A4 / A5', note: 'I2C Communication' }
    ],
    firmwareCode: `// Accident Detection & GPS Alert System
#include <SoftwareSerial.h>
#include <TinyGPS++.h>
#include <Wire.h>

SoftwareSerial gpsSerial(4, 3); // RX, TX
SoftwareSerial gsmSerial(7, 8); // RX, TX
TinyGPSPlus gps;

const int IMPACT_PIN = 2;
const int CANCEL_BUTTON = 5;

void setup() {
  Serial.begin(9600);
  gpsSerial.begin(9600);
  gsmSerial.begin(9600);
  pinMode(IMPACT_PIN, INPUT);
  pinMode(CANCEL_BUTTON, INPUT_PULLUP);
}

void loop() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  if (digitalRead(IMPACT_PIN) == HIGH) {
    Serial.println("Crash Detected! Starting 15s Countdown...");
    bool cancelled = false;
    unsigned long start = millis();
    while (millis() - start < 15000) {
      if (digitalRead(CANCEL_BUTTON) == LOW) {
        cancelled = true;
        Serial.println("False Alarm Cancelled by Driver.");
        break;
      }
      delay(100);
    }

    if (!cancelled) {
      sendEmergencySMS(gps.location.lat(), gps.location.lng());
    }
  }
}

void sendEmergencySMS(double lat, double lng) {
  gsmSerial.println("AT+CMGF=1");
  delay(500);
  gsmSerial.println("AT+CMGS=\\"+919876543210\\"");
  delay(500);
  gsmSerial.print("EMERGENCY ALERT: Accident detected! Location: https://maps.google.com/?q=");
  gsmSerial.print(lat, 6);
  gsmSerial.print(",");
  gsmSerial.print(lng, 6);
  gsmSerial.write(26); // Ctrl+Z to send
}`,
    libraries: [
      'TinyGPSPlus by Mikal Hart',
      'SoftwareSerial (Built-in Arduino)'
    ],
    testingProcedure: [
      'Place GPS antenna near an open window to acquire 3D satellite lock (flashing LED).',
      'Shake the module abruptly to simulate a high-g collision impact.',
      'Observe the 15-second countdown on the display and buzzer sound.',
      'Allow countdown to expire and verify the GSM module transmits the Google Maps link.'
    ],
    troubleshooting: [
      { issue: 'SIM800L restarts when attempting to transmit SMS', fix: 'The SIM800L requires 2A current bursts during GSM transmission. Use a dedicated 4.0V buck converter with a 1000uF capacitor.' }
    ],
    safetyPrecautions: [
      'Ensure the GSM antenna does not rest directly on the microcontroller board to avoid RF interference.'
    ],
    demoTelemetryConfig: {
      type: 'accident',
      sensors: [
        { key: 'gForce', name: 'Impact G-Force', unit: 'G', value: 0.98, min: 0, max: 12, status: 'Normal' },
        { key: 'pitch', name: 'Vehicle Tilt Angle', unit: '°', value: 1.2, min: -90, max: 90, status: 'Level' },
        { key: 'gpsSatellites', name: 'GPS Satellites', unit: '', value: 9, min: 0, max: 18, status: 'Locked' },
        { key: 'currentSpeed', name: 'Vehicle Speed', unit: 'km/h', value: 48, min: 0, max: 180, status: 'Cruising' }
      ],
      actuators: [
        { key: 'sosTrigger', name: 'Emergency SOS Broadcast', state: false, pin: 'SIM800L' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-smart-home-esp32',
    name: 'Smart Home Automation Using ESP32',
    slug: 'smart-home-automation-esp32',
    category: 'Home Automation',
    subcategory: 'Residential IoT',
    difficulty: 'Beginner',
    platform: 'ESP32',
    controller: 'ESP32 DevKit V1',
    price: 2450,
    kitPrice: 2450,
    rating: 4.9,
    reviewCount: 56,
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Multi-channel wireless home appliance automation with web control, physical wall switch synchronization, IR remote control, and Google Home compatibility.',
    description: 'The Smart Home Automation system turns traditional household lighting and appliances into intelligent connected devices. Driven by an ESP32, it features 4-channel relay switching for AC mains lighting, fans, and appliances. It supports simultaneous bidirectional control: users can toggle appliances via an interactive web dashboard, an infrared handheld remote, or standard physical wall toggle switches with instant state synchronization.',
    features: [
      '4-Channel optically isolated relay board for up to 10A 230V AC loads',
      'Dual wireless control via Local WiFi Web Server & Cloud MQTT',
      'Bidirectional state synchronization with traditional physical toggle switches',
      'IR Remote control decoder supporting standard TV/AC remote controls',
      'Real-time ambient temperature and humidity feedback via DHT11',
      'Fail-safe power memory returning relays to last known state after outages'
    ],
    components: [
      { name: 'ESP32 Wi-Fi + Bluetooth Dev Board', qty: 1, cost: 600, linkId: 'esp32' },
      { name: '4-Channel 5V Relay Module with Optocouplers', qty: 1, cost: 350, linkId: 'relay' },
      { name: 'TSOP1738 / VS1838B IR Receiver + Remote', qty: 1, cost: 150, linkId: 'other' },
      { name: 'DHT11 Temperature & Humidity Sensor', qty: 1, cost: 150, linkId: 'temperature' },
      { name: 'Push Buttons for Manual Override', qty: 4, cost: 80, linkId: 'other' },
      { name: '5V 2A Hi-Link AC-DC Step-Down Module', qty: 1, cost: 280, linkId: 'power' },
      { name: 'Flame-Retardant Wall Switchboard Enclosure', qty: 1, cost: 440, linkId: 'other' }
    ],
    budgetBreakdown: [
      { item: 'ESP32 Microcontroller Core', cost: 600 },
      { item: '4-Channel Relay Control Module', cost: 350 },
      { item: 'IR Receiver & Remote Control', cost: 150 },
      { item: 'Embedded Hi-Link AC-DC Power Supply', cost: 280 },
      { item: 'Wall Modular Enclosure & Switch Hardware', cost: 670 }
    ],
    wiringGuide: [
      { component: 'Relay 1 (Light)', pin: 'IN1', microcontroller: 'GPIO 23', note: 'Active LOW' },
      { component: 'Relay 2 (Fan)', pin: 'IN2', microcontroller: 'GPIO 22', note: 'Active LOW' },
      { component: 'Relay 3 (Socket)', pin: 'IN3', microcontroller: 'GPIO 21', note: 'Active LOW' },
      { component: 'Relay 4 (AC Unit)', pin: 'IN4', microcontroller: 'GPIO 19', note: 'Active LOW' },
      { component: 'IR Receiver', pin: 'DATA', microcontroller: 'GPIO 18', note: '38kHz Demodulated' }
    ],
    firmwareCode: `// Smart Home Automation with ESP32
#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "CircuitKart-Home";
const char* password = "smartpassword";

WebServer server(80);
const int relayPins[4] = {23, 22, 21, 19};
bool relayStates[4] = {false, false, false, false};

void handleRoot() {
  String html = "<html><body><h1>Smart Home Control</h1>";
  for (int i = 0; i < 4; i++) {
    html += "<p>Relay " + String(i + 1) + ": " + (relayStates[i] ? "ON" : "OFF") + 
            " <a href='/toggle?id=" + String(i) + "'>Toggle</a></p>";
  }
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void handleToggle() {
  if (server.hasArg("id")) {
    int id = server.arg("id").toInt();
    if (id >= 0 && id < 4) {
      relayStates[id] = !relayStates[id];
      digitalWrite(relayPins[id], relayStates[id] ? LOW : HIGH);
    }
  }
  server.sendHeader("Location", "/");
  server.send(303);
}

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 4; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH); // Relays OFF
  }
  WiFi.softAP(ssid, password);
  server.on("/", handleRoot);
  server.on("/toggle", handleToggle);
  server.begin();
  Serial.println("Server listening at 192.168.4.1");
}

void loop() {
  server.handleClient();
}`,
    libraries: [
      'WebServer (ESP32 Built-in)',
      'IRremote by shirriff / z3t0 (v4.0.0)'
    ],
    testingProcedure: [
      'Connect a smartphone to the "CircuitKart-Home" WiFi Access Point.',
      'Open browser to http://192.168.4.1.',
      'Click "Toggle" on Relay 1 and confirm the audible mechanical relay click and status change on the web page.',
      'Point the IR remote at the receiver and press button 1 to verify synchronization.'
    ],
    troubleshooting: [
      { issue: 'ESP32 cannot be discovered on home router', fix: 'Ensure your WiFi SSID operates on 2.4 GHz; ESP32 does not support 5 GHz WiFi bands.' }
    ],
    safetyPrecautions: [
      'Never touch terminal screw contacts when connected to 230V AC mains electrical lines.'
    ],
    demoTelemetryConfig: {
      type: 'homeAutomation',
      sensors: [
        { key: 'ambientTemp', name: 'Living Room Temp', unit: '°C', value: 26.5, min: 18, max: 35, status: 'Comfortable' },
        { key: 'ambientHumidity', name: 'Room Humidity', unit: '%', value: 58, min: 30, max: 80, status: 'Good' },
        { key: 'powerUsage', name: 'Current Wattage', unit: 'W', value: 145, min: 0, max: 2000, status: 'Low' }
      ],
      actuators: [
        { key: 'lightLiving', name: 'Living Room Lights', state: true, pin: 'GPIO 23' },
        { key: 'fanBedroom', name: 'Ceiling Fan', state: false, pin: 'GPIO 22' },
        { key: 'plugSocket', name: 'Workstation Socket', state: true, pin: 'GPIO 21' },
        { key: 'nightLight', name: 'Hallway Night Lamp', state: false, pin: 'GPIO 19' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-water-level-monitoring',
    name: 'IoT-Based Water Level Monitoring',
    slug: 'iot-based-water-level-monitoring',
    category: 'Sensor-Based Projects',
    subcategory: 'Smart Utility',
    difficulty: 'Beginner',
    platform: 'ESP8266 NodeMCU',
    controller: 'ESP8266 NodeMCU v3',
    price: 1850,
    kitPrice: 1850,
    rating: 4.8,
    reviewCount: 37,
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186ef5f?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Overhead tank automation with ultrasonic contactless water depth sensing, dry-run pump safety, and automatic refill actuation.',
    description: 'The IoT-Based Water Level Monitoring System prevents water wastage caused by tank overflows while protecting pumps against dry-run burnouts. A non-contact HC-SR04 ultrasonic sensor positioned on top of the tank continuously maps the surface water depth. When water drops below 20%, the system triggers the fill pump relay. When water reaches 95%, it shuts down automatically with full cloud level telemetry.',
    features: [
      'Non-contact acoustic liquid depth measurement via HC-SR04',
      'Automatic pump trigger on low-level with auto-cutoff at tank full',
      'Motor dry-run protection with warning buzzer',
      'Local visual tank bar graph on 16x2 I2C LCD',
      'Blynk / MQTT mobile notification on low water or overflow risk',
      'Customizable tank dimensions in software'
    ],
    components: [
      { name: 'NodeMCU ESP8266 WiFi Board', qty: 1, cost: 350, linkId: 'esp8266' },
      { name: 'HC-SR04 Ultrasonic Distance Sensor', qty: 1, cost: 120, linkId: 'sensors' },
      { name: '1-Channel 10A 5V Relay Module', qty: 1, cost: 120, linkId: 'relay' },
      { name: 'Mini Submersible 5V Water Pump + Pipe', qty: 1, cost: 350, linkId: 'pump' },
      { name: 'LCD 16x2 I2C Display', qty: 1, cost: 250, linkId: 'lcd' },
      { name: 'Buzzer Module & Indicator LEDs', qty: 1, cost: 80, linkId: 'other' },
      { name: 'Clear Acrylic Demonstration Tank Cylinder', qty: 1, cost: 380, linkId: 'other' },
      { name: '5V 2A Power Adapter', qty: 1, cost: 200, linkId: 'power' }
    ],
    budgetBreakdown: [
      { item: 'NodeMCU Controller & Ultrasonic Sensor', cost: 470 },
      { item: 'Relay & Pumping Actuation Unit', cost: 470 },
      { item: 'I2C LCD & Acoustic Indicators', cost: 330 },
      { item: 'Demo Tank Acrylic & Power Hardware', cost: 580 }
    ],
    wiringGuide: [
      { component: 'HC-SR04 Ultrasonic', pin: 'TRIG', microcontroller: 'D5 (GPIO 14)', note: '10us Trigger Pulse' },
      { component: 'HC-SR04 Ultrasonic', pin: 'ECHO', microcontroller: 'D6 (GPIO 12)', note: 'Use 1k/2k voltage divider to 3.3V' },
      { component: 'Pump Relay', pin: 'IN', microcontroller: 'D1 (GPIO 5)', note: 'Active LOW' },
      { component: 'I2C LCD', pin: 'SDA / SCL', microcontroller: 'D2 / D1', note: 'I2C Bus' }
    ],
    firmwareCode: `// IoT Water Level Monitoring
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define TRIG_PIN 14 // D5
#define ECHO_PIN 12 // D6
#define RELAY_PIN 5 // D1
#define TANK_HEIGHT_CM 100

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Pump OFF

  lcd.init();
  lcd.backlight();
}

void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  int distanceCm = duration * 0.034 / 2;
  int waterLevelCm = TANK_HEIGHT_CM - distanceCm;
  int percentage = map(waterLevelCm, 10, TANK_HEIGHT_CM, 0, 100);
  percentage = constrain(percentage, 0, 100);

  // Auto pump logic
  if (percentage < 20) {
    digitalWrite(RELAY_PIN, LOW); // Pump ON
  } else if (percentage > 95) {
    digitalWrite(RELAY_PIN, HIGH); // Pump OFF
  }

  lcd.setCursor(0, 0);
  lcd.printf("Water Level: %d%%", percentage);
  lcd.setCursor(0, 1);
  lcd.printf("Depth: %d cm", waterLevelCm);

  delay(1000);
}`,
    libraries: [
      'LiquidCrystal_I2C by Frank de Brabander'
    ],
    testingProcedure: [
      'Place the ultrasonic sensor on top of a water cylinder.',
      'Fill water gradually; verify the level percentage increases from 0% to 100%.',
      'Verify the relay cuts off pump power as soon as the level hits 95%.'
    ],
    troubleshooting: [
      { issue: 'Ultrasonic sensor returns 0 or maximum distance', fix: 'Condensation on transducer meshes can distort sound waves. Use waterproof JSN-SR04T for humid sealed tanks.' }
    ],
    safetyPrecautions: [
      'Ensure the ultrasonic sensor circuit board is sealed against water splash.'
    ],
    demoTelemetryConfig: {
      type: 'waterLevel',
      sensors: [
        { key: 'waterLevelPct', name: 'Tank Level', unit: '%', value: 68, min: 0, max: 100, status: 'Adequate' },
        { key: 'inflowRate', name: 'Inflow Flowrate', unit: 'L/min', value: 12.5, min: 0, max: 30, status: 'Active' },
        { key: 'tankVolume', name: 'Current Stored', unit: 'Liters', value: 680, min: 0, max: 1000, status: 'Optimal' }
      ],
      actuators: [
        { key: 'pumpRelay', name: 'Borewell Refill Pump', state: false, pin: 'GPIO 5' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-rfid-smart-attendance',
    name: 'RFID-Based Smart Attendance System',
    slug: 'rfid-based-smart-attendance-system',
    category: 'Embedded Systems',
    subcategory: 'Access Control',
    difficulty: 'Intermediate',
    platform: 'NodeMCU / ESP8266',
    controller: 'ESP8266 NodeMCU',
    price: 2250,
    kitPrice: 2250,
    rating: 4.8,
    reviewCount: 40,
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Touchless contactless card attendance management system logging employee/student IDs directly to Google Sheets and cloud SQL.',
    description: 'The RFID-Based Smart Attendance System automates access control and attendance logging for schools, colleges, and corporate offices. Employees or students tap their 13.56 MHz RFID smart card or keyfob against an MFRC522 reader. The NodeMCU extracts the unique card UID, matches it against student databases, and logs timestamped check-in/check-out records directly to a Google Sheet via REST API with instant LCD feedback.',
    features: [
      'Contactless 13.56 MHz RFID card & keyfob UID reading via RC522',
      'Direct cloud data submission to Google Sheets / Webhook via HTTPS',
      'Dual check-in and check-out mode tracking',
      'Instant audio beep and visual welcome greeting with student name on LCD',
      'Duplicate tap prevention within 5-minute time windows',
      'Standalone WiFi operational capability without connected PC'
    ],
    components: [
      { name: 'NodeMCU ESP8266 WiFi Board', qty: 1, cost: 350, linkId: 'esp8266' },
      { name: 'RC522 RFID Reader Module with Antenna', qty: 1, cost: 250, linkId: 'sensors' },
      { name: '13.56 MHz RFID Smart Cards & Keyfobs (5-pack)', qty: 5, cost: 150, linkId: 'other' },
      { name: '16x2 I2C Character LCD', qty: 1, cost: 250, linkId: 'lcd' },
      { name: 'Active 5V Buzzer Module', qty: 1, cost: 50, linkId: 'other' },
      { name: 'Dual Green/Red Status LEDs with Resistors', qty: 2, cost: 40, linkId: 'other' },
      { name: 'Wall Mount Enclosure with Card Slot', qty: 1, cost: 450, linkId: 'other' },
      { name: '5V 2A Wall Power Supply', qty: 1, cost: 220, linkId: 'power' }
    ],
    budgetBreakdown: [
      { item: 'NodeMCU & RC522 Hardware', cost: 600 },
      { item: 'RFID Cards, Keyfobs & Display', cost: 400 },
      { item: 'Enclosure, Buzzer & Indicator Package', cost: 540 },
      { item: 'Power Supply & Hardware Connectors', cost: 710 }
    ],
    wiringGuide: [
      { component: 'RC522 RFID', pin: 'SDA (SS)', microcontroller: 'D4 (GPIO 2)', note: 'SPI Slave Select' },
      { component: 'RC522 RFID', pin: 'SCK', microcontroller: 'D5 (GPIO 14)', note: 'SPI Clock' },
      { component: 'RC522 RFID', pin: 'MOSI', microcontroller: 'D7 (GPIO 13)', note: 'SPI Master Out Slave In' },
      { component: 'RC522 RFID', pin: 'MISO', microcontroller: 'D6 (GPIO 12)', note: 'SPI Master In Slave Out' },
      { component: 'RC522 RFID', pin: 'RST', microcontroller: 'D3 (GPIO 0)', note: 'Reset Pin' },
      { component: 'RC522 RFID', pin: '3.3V', microcontroller: '3.3V', note: 'DO NOT CONNECT TO 5V!' }
    ],
    firmwareCode: `// RFID Smart Attendance System
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define SS_PIN 2   // D4
#define RST_PIN 0  // D3
#define BUZZER 16  // D0

MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  pinMode(BUZZER, OUTPUT);

  lcd.init();
  lcd.backlight();
  lcd.print("Tap RFID Card...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  String uidStr = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uidStr += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    uidStr += String(rfid.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();

  digitalWrite(BUZZER, HIGH);
  delay(100);
  digitalWrite(BUZZER, LOW);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("UID: " + uidStr);
  lcd.setCursor(0, 1);
  lcd.print("Attendance LOGGED");

  Serial.println("Card Scanned: " + uidStr);
  rfid.PICC_HaltA();
  delay(2000);
  lcd.clear();
  lcd.print("Tap RFID Card...");
}`,
    libraries: [
      'MFRC522 by GithubCommunity (v1.4.10)',
      'LiquidCrystal_I2C by Frank de Brabander'
    ],
    testingProcedure: [
      'Power the unit and hold an RFID card within 3cm of the antenna coil.',
      'Listen for the confirmation beep and verify the card UID appears on the 16x2 LCD.',
      'Check Serial Monitor at 115200 baud to see the logged UID payload.'
    ],
    troubleshooting: [
      { issue: 'RC522 card not detected', fix: 'RC522 module requires 3.3V. Connecting to 5V will permanently damage the MFRC522 chip.' }
    ],
    safetyPrecautions: [
      'Do not bend RFID smart cards excessively to avoid breaking the internal copper loop antenna.'
    ],
    demoTelemetryConfig: {
      type: 'rfid',
      sensors: [
        { key: 'totalLogs', name: 'Today Taps', unit: 'records', value: 142, min: 0, max: 500, status: 'Logged' },
        { key: 'lastUid', name: 'Last Scanned Card', unit: '', value: 'E4-A1-89-2B', min: 0, max: 0, status: 'Authorized' },
        { key: 'attendanceRate', name: 'Attendance Rate', unit: '%', value: 94.6, min: 0, max: 100, status: 'High' }
      ],
      actuators: [
        { key: 'turnstileLock', name: 'Turnstile Door Lock', state: false, pin: 'GPIO 15' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-smart-classroom',
    name: 'Smart Classroom Monitoring System',
    slug: 'smart-classroom-monitoring-system',
    category: 'AI + IoT Projects',
    subcategory: 'Educational Automation',
    difficulty: 'Advanced',
    platform: 'ESP32-CAM / ESP32',
    controller: 'ESP32 Dual Core',
    price: 4200,
    kitPrice: 4200,
    rating: 4.9,
    reviewCount: 27,
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Classroom energy and occupancy optimization system combining computer vision people counting, ambient light harvesting, and automated HVAC control.',
    description: 'The Smart Classroom Monitoring System automates educational spaces to slash unnecessary electric utility bills. Integrating an ESP32-CAM computer vision unit and PIR motion arrays, it counts room occupancy and monitors desk activity. Lights and ceiling fans automatically turn on only when occupants are detected and daylight levels fall below threshold, turning off when rooms empty.',
    features: [
      'PIR motion tracking and camera-assisted classroom occupancy detection',
      'Ambient lighting level sensing via LDR for automatic daylight harvesting',
      'Automatic relay control for classroom tube lights and ceiling fans',
      'Indoor CO2 and temperature air freshness monitoring for student comfort',
      'Energy conservation logging dashboard calculating kWh saved',
      'Emergency broadcast buzzer and lecture timer display'
    ],
    components: [
      { name: 'ESP32-CAM Module with OV2640 Camera', qty: 1, cost: 750, linkId: 'esp32' },
      { name: 'ESP32 Dual-Core DevKit (Main Hub)', qty: 1, cost: 600, linkId: 'esp32' },
      { name: 'PIR Motion Sensor Module (HC-SR501)', qty: 2, cost: 240, linkId: 'sensors' },
      { name: 'LDR Ambient Light Sensor Module', qty: 1, cost: 50, linkId: 'sensors' },
      { name: '4-Channel 5V Optocoupler Relay Board', qty: 1, cost: 350, linkId: 'relay' },
      { name: 'DHT11 Temperature & Humidity Sensor', qty: 1, cost: 150, linkId: 'temperature' },
      { name: '0.96 inch I2C OLED Display', qty: 1, cost: 350, linkId: 'display' },
      { name: '5V 3A Dual-Port Power Supply', qty: 1, cost: 350, linkId: 'power' }
    ],
    budgetBreakdown: [
      { item: 'ESP32 Core & ESP32-CAM Hardware', cost: 1350 },
      { item: 'Motion & Ambient Environment Sensors', cost: 440 },
      { item: '4-Channel Relay Control Hardware', cost: 350 },
      { item: 'OLED Display & Power Supply Subsystem', cost: 700 },
      { item: 'Industrial Enclosure & Cables', cost: 1360 }
    ],
    wiringGuide: [
      { component: 'PIR Motion Sensor 1', pin: 'OUT', microcontroller: 'GPIO 32', note: 'Front classroom sensor' },
      { component: 'PIR Motion Sensor 2', pin: 'OUT', microcontroller: 'GPIO 33', note: 'Rear classroom sensor' },
      { component: 'LDR Module', pin: 'AOUT', microcontroller: 'GPIO 34', note: 'Light intensity analog pin' },
      { component: 'Relay 1 (Fans)', pin: 'IN1', microcontroller: 'GPIO 25', note: 'Relay channel 1' },
      { component: 'Relay 2 (Lights)', pin: 'IN2', microcontroller: 'GPIO 26', note: 'Relay channel 2' }
    ],
    firmwareCode: `// Smart Classroom Automation System
#include <WiFi.h>

#define PIR_PIN 32
#define LDR_PIN 34
#define FAN_RELAY 25
#define LIGHT_RELAY 26

unsigned long lastMotionTime = 0;
const unsigned long AUTO_OFF_DELAY = 60000; // 1 min timeout

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(FAN_RELAY, OUTPUT);
  pinMode(LIGHT_RELAY, OUTPUT);
  digitalWrite(FAN_RELAY, HIGH);
  digitalWrite(LIGHT_RELAY, HIGH);
}

void loop() {
  int motion = digitalRead(PIR_PIN);
  int lightLevel = analogRead(LDR_PIN);

  if (motion == HIGH) {
    lastMotionTime = millis();
    digitalWrite(FAN_RELAY, LOW); // Fans ON
    if (lightLevel < 2000) {
      digitalWrite(LIGHT_RELAY, LOW); // Lights ON if dark
    } else {
      digitalWrite(LIGHT_RELAY, HIGH); // Lights OFF if bright daylight
    }
  } else if (millis() - lastMotionTime > AUTO_OFF_DELAY) {
    digitalWrite(FAN_RELAY, HIGH);   // Turn off when empty
    digitalWrite(LIGHT_RELAY, HIGH);
  }

  delay(1000);
}`,
    libraries: [
      'WiFi.h',
      'Adafruit GFX'
    ],
    testingProcedure: [
      'Cover LDR sensor with hand to simulate dark room; wave hand in front of PIR sensor.',
      'Verify light and fan relays trigger immediately.',
      'Leave room still for 60 seconds and verify relays automatically disengage to conserve energy.'
    ],
    troubleshooting: [
      { issue: 'PIR sensor triggers continuously without motion', fix: 'Adjust sensitivity and retrigger jumper (H mode) on the HC-SR501 module.' }
    ],
    safetyPrecautions: [
      'Secure AC lighting connections inside an insulated terminal junction box.'
    ],
    demoTelemetryConfig: {
      type: 'classroom',
      sensors: [
        { key: 'occupancy', name: 'Est. Occupancy', unit: 'students', value: 24, min: 0, max: 45, status: 'Occupied' },
        { key: 'ambientLux', name: 'Natural Light', unit: 'Lux', value: 380, min: 50, max: 1000, status: 'Daylight' },
        { key: 'roomTemp', name: 'Room Temperature', unit: '°C', value: 25.1, min: 18, max: 35, status: 'Comfortable' }
      ],
      actuators: [
        { key: 'lights', name: 'Classroom Tube Lights', state: false, pin: 'GPIO 26' },
        { key: 'fans', name: 'Ceiling Fans', state: true, pin: 'GPIO 25' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-fire-gas-detection',
    name: 'IoT-Based Fire and Gas Detection',
    slug: 'iot-based-fire-and-gas-detection',
    category: 'Sensor-Based Projects',
    subcategory: 'Safety Systems',
    difficulty: 'Beginner',
    platform: 'Arduino + ESP8266',
    controller: 'Arduino UNO / ESP8266',
    price: 1950,
    kitPrice: 1950,
    rating: 4.8,
    reviewCount: 33,
    image: 'https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Industrial kitchen and laboratory safety monitor detecting LPG/methane leaks and open flame occurrences with auto exhaust fan trigger.',
    description: 'The IoT-Based Fire and Gas Detection System ensures early hazard intervention in commercial kitchens, battery rooms, and chemical labs. Using a calibrated MQ-2 combustible gas sensor and infrared optical flame sensor, it identifies LPG/propane leakage and open flames in fractions of a second. The system immediately trips an exhaust ventilation fan relay, activates an acoustic strobe, and broadcasts cloud emergency notifications.',
    features: [
      'Dual detection: Combustible LPG/Smoke gas + Infrared flame wavelength',
      'Sub-second response time with high-sensitivity flame photodiodes',
      'Automated exhaust fan relay actuation to evacuate toxic gas build-up',
      'High-decibel acoustic buzzer alarm with emergency strobe LED',
      'Cloud alerting with automatic time-stamped incident logs',
      'Manual reset and test push button'
    ],
    components: [
      { name: 'Arduino UNO R3 / ESP8266 Board', qty: 1, cost: 500, linkId: 'arduino' },
      { name: 'MQ-2 Gas / Smoke Sensor Module', qty: 1, cost: 200, linkId: 'sensors' },
      { name: 'IR Optical Flame Sensor Module (760nm - 1100nm)', qty: 1, cost: 150, linkId: 'sensors' },
      { name: '1-Channel 5V Relay for Exhaust Ventilation', qty: 1, cost: 120, linkId: 'relay' },
      { name: 'Loud 5V Active Piezo Siren', qty: 1, cost: 60, linkId: 'other' },
      { name: 'High-Intensity Red Flashing Emergency LED', qty: 1, cost: 40, linkId: 'other' },
      { name: 'LCD 16x2 I2C Display', qty: 1, cost: 250, linkId: 'lcd' },
      { name: '5V 2A Regulated Power Supply', qty: 1, cost: 220, linkId: 'power' }
    ],
    budgetBreakdown: [
      { item: 'Microcontroller Core (Arduino/ESP)', cost: 500 },
      { item: 'MQ-2 Gas & Optical Flame Sensors', cost: 350 },
      { item: 'Exhaust Relay & Acoustic Siren', cost: 430 },
      { item: 'I2C Display & Power Supply Kit', cost: 670 }
    ],
    wiringGuide: [
      { component: 'Flame Sensor', pin: 'DO', microcontroller: 'Pin 2', note: 'Active LOW when flame detected' },
      { component: 'MQ-2 Gas Sensor', pin: 'AO', microcontroller: 'A0', note: 'Analog concentration reading' },
      { component: 'Exhaust Fan Relay', pin: 'IN', microcontroller: 'Pin 8', note: 'Active LOW' },
      { component: 'Siren Buzzer', pin: 'POS', microcontroller: 'Pin 9', note: 'Tone trigger pin' }
    ],
    firmwareCode: `// Fire and Gas Detection System
#define FLAME_PIN 2
#define GAS_PIN A0
#define RELAY_PIN 8
#define BUZZER_PIN 9

void setup() {
  Serial.begin(9600);
  pinMode(FLAME_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Relay off
}

void loop() {
  int flame = digitalRead(FLAME_PIN);
  int gasLevel = analogRead(GAS_PIN);

  bool hazard = false;
  if (flame == LOW || gasLevel > 400) {
    hazard = true;
    digitalWrite(RELAY_PIN, LOW); // Turn on exhaust fan
    digitalWrite(BUZZER_PIN, HIGH);
    Serial.println("EMERGENCY HAZARD: FIRE OR GAS DETECTED!");
  } else {
    digitalWrite(RELAY_PIN, HIGH);
    digitalWrite(BUZZER_PIN, LOW);
  }

  delay(500);
}`,
    libraries: [
      'Wire.h',
      'LiquidCrystal_I2C'
    ],
    testingProcedure: [
      'Bring a lighter flame within 30cm of the optical flame sensor.',
      'Verify the alarm sounds instantly and the exhaust relay activates.',
      'Test smoke or gas using an extinguished incense stick near the MQ-2 sensor.'
    ],
    troubleshooting: [
      { issue: 'False flame alarms', fix: 'Incandescent light bulbs emit IR. Adjust sensitivity trimpot or use shielded sensor hoods.' }
    ],
    safetyPrecautions: [
      'Never test with large open gas releases; keep fire extinguishers on hand.'
    ],
    demoTelemetryConfig: {
      type: 'fireGas',
      sensors: [
        { key: 'gasPpm', name: 'Gas Concentration', unit: 'PPM', value: 85, min: 20, max: 1000, status: 'Safe' },
        { key: 'flameStatus', name: 'Optical Flame Detector', unit: '', value: 0, min: 0, max: 1, status: 'Clear' },
        { key: 'systemStatus', name: 'Zone Status', unit: '', value: 1, min: 0, max: 1, status: 'Secure' }
      ],
      actuators: [
        { key: 'exhaustFan', name: 'Exhaust Fan', state: false, pin: 'Pin 8' },
        { key: 'siren', name: 'Alarm Siren', state: false, pin: 'Pin 9' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-esp32-weather-station',
    name: 'ESP32-Based Weather Station',
    slug: 'esp32-based-weather-station',
    category: 'ESP32 and ESP8266 Projects',
    subcategory: 'Environmental Monitoring',
    difficulty: 'Intermediate',
    platform: 'ESP32',
    controller: 'ESP32 DevKit V1',
    price: 2950,
    kitPrice: 2950,
    rating: 4.9,
    reviewCount: 48,
    image: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Precision microclimate weather station recording barometric pressure, altitude, ambient temperature, humidity, and rainfall index.',
    description: 'The ESP32-Based Weather Station offers hyper-local meteorological data logging for amateur meteorologists, farmers, and research stations. Combining an ultra-accurate Bosch BME280 sensor with optical rain detection and ambient UV/light sensors, it calculates sea-level adjusted barometric trends to forecast short-term weather changes. Live telemetry broadcasts to Weather Underground and OpenWeatherMap APIs.',
    features: [
      'High-precision barometric pressure (hPa) & altitude tracking via Bosch BME280',
      'Ambient temperature and relative humidity with dew-point calculation',
      'Precipitation intensity tracking via resistive rain-drop plate',
      'Local 1.3 inch OLED graphical weather forecast display',
      'Direct API integration with Weather Underground & ThingSpeak',
      'Low-power deep sleep mode supporting solar panel operation'
    ],
    components: [
      { name: 'ESP32 DevKit V1 Microcontroller', qty: 1, cost: 600, linkId: 'esp32' },
      { name: 'Bosch BME280 Environmental Sensor (I2C/SPI)', qty: 1, cost: 450, linkId: 'sensors' },
      { name: 'Rain Drop Liquid Precipitation Sensor Module', qty: 1, cost: 120, linkId: 'sensors' },
      { name: 'TEMT6000 Ambient Light / UV Sensor', qty: 1, cost: 150, linkId: 'sensors' },
      { name: '1.3 inch I2C OLED Display (SH1106)', qty: 1, cost: 420, linkId: 'display' },
      { name: 'TP4056 18650 Battery Charger + 2500mAh LiPo', qty: 1, cost: 450, linkId: 'power' },
      { name: 'Solar Panel 5V 1W Waterproof Panel', qty: 1, cost: 380, linkId: 'power' },
      { name: 'Louvered Stevenson Screen Weather Shield', qty: 1, cost: 380, linkId: 'other' }
    ],
    budgetBreakdown: [
      { item: 'ESP32 Core & BME280 Sensor', cost: 1050 },
      { item: 'Rain, Light & Weather Transducers', cost: 270 },
      { item: 'OLED Display & Solar Power Battery Subsystem', cost: 1250 },
      { item: 'Stevenson Louvered Shield Enclosure', cost: 380 }
    ],
    wiringGuide: [
      { component: 'BME280 Sensor', pin: 'SDA / SCL', microcontroller: 'GPIO 21 / 22', note: '3.3V power required' },
      { component: 'Rain Drop Sensor', pin: 'AOUT', microcontroller: 'GPIO 36', note: 'Analog rain intensity' },
      { component: 'OLED Display', pin: 'SDA / SCL', microcontroller: 'GPIO 21 / 22', note: 'Shares I2C bus' }
    ],
    firmwareCode: `// ESP32 Weather Station
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <WiFi.h>

Adafruit_BME280 bme;
#define RAIN_PIN 36

void setup() {
  Serial.begin(115200);
  if (!bme.begin(0x76)) {
    Serial.println("BME280 not found, checking 0x77...");
    bme.begin(0x77);
  }
}

void loop() {
  float temp = bme.readTemperature();
  float pressure = bme.readPressure() / 100.0F; // hPa
  float humidity = bme.readHumidity();
  int rainRaw = analogRead(RAIN_PIN);

  Serial.printf("Temp: %.1f C | Hum: %.1f %% | Pressure: %.1f hPa | Rain Index: %d\\n",
                temp, humidity, pressure, rainRaw);
  delay(5000);
}`,
    libraries: [
      'Adafruit BME280 Library',
      'Adafruit Unified Sensor'
    ],
    testingProcedure: [
      'Observe sea-level barometric pressure hovering around 1013.25 hPa in standard conditions.',
      'Place a single droplet of water on the rain sensor board and verify the precipitation alert.'
    ],
    troubleshooting: [
      { issue: 'BME280 fails to initialize', fix: 'Default I2C address is either 0x76 or 0x77 depending on the SDO pin connection.' }
    ],
    safetyPrecautions: [
      'Ensure the solar panel charge controller has overcharge and low-voltage cutoff protection.'
    ],
    demoTelemetryConfig: {
      type: 'weather',
      sensors: [
        { key: 'temperature', name: 'Temperature', unit: '°C', value: 27.6, min: -10, max: 50, status: 'Normal' },
        { key: 'humidity', name: 'Humidity', unit: '%', value: 62.4, min: 0, max: 100, status: 'Normal' },
        { key: 'pressure', name: 'Barometric Pressure', unit: 'hPa', value: 1012.8, min: 950, max: 1050, status: 'Fair Weather' },
        { key: 'rain', name: 'Rainfall State', unit: '', value: 0, min: 0, max: 1, status: 'Dry' }
      ],
      actuators: [
        { key: 'heaterPad', name: 'Dew Heater De-fogger', state: false, pin: 'GPIO 19' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-bluetooth-robot-car',
    name: 'Bluetooth-Controlled Robotics Car',
    slug: 'bluetooth-controlled-robotics-car',
    category: 'Robotics',
    subcategory: 'Mobile Robotics',
    difficulty: 'Beginner',
    platform: 'Arduino UNO',
    controller: 'Arduino UNO R3',
    price: 2300,
    kitPrice: 2300,
    rating: 4.8,
    reviewCount: 62,
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    shortDescription: '4-Wheel Drive robotic chassis with L298N H-Bridge motor driver and Bluetooth smartphone joystick command telemetry.',
    description: 'The Bluetooth-Controlled Robotics Car serves as the quintessential hands-on introduction to mobile robotics and embedded motor actuation. Driven by an Arduino UNO and high-power L298N Dual H-Bridge motor driver, it powers four geared DC motors with differential steering. An HC-05 Bluetooth transceiver accepts real-time directional commands from any Android or iOS Bluetooth gamepad application.',
    features: [
      '4WD dual acrylic chassis with independent DC gear motors and rubber wheels',
      'High-power L298N Dual H-Bridge motor driver module (2A per bridge)',
      'Wireless serial command parsing via HC-05 Bluetooth module',
      'PWM Variable speed acceleration and precision skid-steer navigation',
      'Dual 18650 Li-ion battery pack delivering sustained 7.4V - 8.4V power',
      'Front obstacle collision bumpers and expansion ports for ultrasonic add-ons'
    ],
    components: [
      { name: 'Arduino UNO R3 Development Board', qty: 1, cost: 500, linkId: 'arduino' },
      { name: 'L298N Dual H-Bridge Motor Driver Module', qty: 1, cost: 220, linkId: 'relay' },
      { name: 'HC-05 Wireless Bluetooth Serial Module', qty: 1, cost: 350, linkId: 'communication' },
      { name: '4x Geared BO Motors (3-6V) with Rubber Wheels', qty: 4, cost: 360, linkId: 'other' },
      { name: 'Dual-Layer Laser Cut Acrylic Car Chassis', qty: 1, cost: 380, linkId: 'other' },
      { name: '2S 18650 Battery Holder + 2x Rechargeable Cells', qty: 1, cost: 350, linkId: 'power' },
      { name: 'Hardware Standoffs, Screws, and Jumper Wires', qty: 1, cost: 140, linkId: 'other' }
    ],
    budgetBreakdown: [
      { item: 'Arduino UNO & HC-05 Bluetooth Transceiver', cost: 850 },
      { item: 'L298N Motor Driver & 4x BO Motors', cost: 580 },
      { item: '2S 18650 Battery Pack & Charging Unit', cost: 350 },
      { item: 'Acrylic Chassis Kit & Fasteners', cost: 520 }
    ],
    wiringGuide: [
      { component: 'HC-05 Bluetooth', pin: 'TX', microcontroller: 'Pin 10 (SoftSerial RX)', note: '5V tolerant' },
      { component: 'HC-05 Bluetooth', pin: 'RX', microcontroller: 'Pin 11 (SoftSerial TX)', note: 'Requires voltage divider' },
      { component: 'L298N Driver', pin: 'IN1, IN2, IN3, IN4', microcontroller: 'Pins 5, 6, 7, 8', note: 'Motor directional H-Bridge' }
    ],
    firmwareCode: `// Bluetooth Controlled Robotics Car
#include <SoftwareSerial.h>

SoftwareSerial BT(10, 11); // RX, TX
const int IN1 = 5, IN2 = 6, IN3 = 7, IN4 = 8;

void setup() {
  BT.begin(9600);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
}

void loop() {
  if (BT.available()) {
    char cmd = BT.read();
    if (cmd == 'F') { // Forward
      digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
      digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
    } else if (cmd == 'B') { // Backward
      digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH);
      digitalWrite(IN3, LOW); digitalWrite(IN4, HIGH);
    } else if (cmd == 'L') { // Left
      digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH);
      digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
    } else if (cmd == 'R') { // Right
      digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
      digitalWrite(IN3, LOW); digitalWrite(IN4, HIGH);
    } else if (cmd == 'S') { // Stop
      digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
      digitalWrite(IN3, LOW); digitalWrite(IN4, LOW);
    }
  }
}`,
    libraries: [
      'SoftwareSerial'
    ],
    testingProcedure: [
      'Pair smartphone Bluetooth with "HC-05" using PIN 1234.',
      'Open Arduino Bluetooth Controller App in Gamepad Mode.',
      'Tap forward arrow and verify all 4 wheels rotate in forward unison.'
    ],
    troubleshooting: [
      { issue: 'Car turns opposite direction', fix: 'Swap the two motor wires connected to the L298N OUT terminals.' }
    ],
    safetyPrecautions: [
      'Never short-circuit 18650 Li-ion battery terminals; use protected cells.'
    ],
    demoTelemetryConfig: {
      type: 'robotics',
      sensors: [
        { key: 'batteryVoltage', name: 'Battery Voltage', unit: 'V', value: 7.82, min: 6.4, max: 8.4, status: 'Healthy' },
        { key: 'motorSpeed', name: 'PWM Throttle', unit: '%', value: 85, min: 0, max: 100, status: 'Active' },
        { key: 'heading', name: 'Compass Heading', unit: '°', value: 184, min: 0, max: 360, status: 'South' }
      ],
      actuators: [
        { key: 'headlights', name: 'LED Headlights', state: true, pin: 'Pin 4' },
        { key: 'robotHorn', name: 'Acoustic Horn', state: false, pin: 'Pin 3' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-water-quality-monitoring',
    name: 'IoT-Based Water Quality Monitoring',
    slug: 'iot-based-water-quality-monitoring',
    category: 'Smart Agriculture',
    subcategory: 'Environmental Aquaculture',
    difficulty: 'Advanced',
    platform: 'ESP32',
    controller: 'ESP32 DevKit V1',
    price: 4600,
    kitPrice: 4600,
    rating: 4.9,
    reviewCount: 35,
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Aquaculture and drinking water quality analyzer continuously probing pH level, Total Dissolved Solids (TDS), and water temperature.',
    description: 'The IoT-Based Water Quality Monitoring System ensures safe potable water distribution and prevents aquatic mortality in fish farms and hydroponic gardens. Featuring laboratory-grade submersible probes for pH, Total Dissolved Solids (TDS/EC in PPM), and temperature compensation, the ESP32 performs multivariate chemical quality calculations. When pH shifts outside safe 6.5–8.5 brackets, emergency warnings trigger.',
    features: [
      'Submersible glass electrode analog pH sensor kit (0-14 pH)',
      'Total Dissolved Solids (TDS) meter calculating dissolved minerals (0-1000 PPM)',
      'Waterproof stainless steel DS18B20 digital thermal probe',
      'Automatic temperature compensation for TDS and pH calibration algorithms',
      'Live LCD 16x2 I2C readouts with cloud historical telemetry charts',
      'Chemical dosing pump trigger relay for automated pH correction'
    ],
    components: [
      { name: 'ESP32 Development Board (30-pin)', qty: 1, cost: 600, linkId: 'esp32' },
      { name: 'Analog pH Sensor Kit with BNC Probe & Calibration Buffer', qty: 1, cost: 1650, linkId: 'sensors' },
      { name: 'Analog TDS Sensor Meter Module (0-1000 PPM)', qty: 1, cost: 750, linkId: 'sensors' },
      { name: 'DS18B20 Waterproof Temperature Sensor', qty: 1, cost: 220, linkId: 'sensors' },
      { name: 'LCD 16x2 Display with I2C Backpack', qty: 1, cost: 250, linkId: 'lcd' },
      { name: '5V Peristaltic Dosing Pump Module', qty: 1, cost: 450, linkId: 'pump' },
      { name: 'IP65 Water-Resistant Instrument Enclosure', qty: 1, cost: 400, linkId: 'other' },
      { name: '5V 2A Regulated Wall Power Adapter', qty: 1, cost: 280, linkId: 'power' }
    ],
    budgetBreakdown: [
      { item: 'ESP32 Core Microcontroller', cost: 600 },
      { item: 'BNC pH Probe & Signal Conditioner', cost: 1650 },
      { item: 'TDS Sensor & DS18B20 Thermal Probe', cost: 970 },
      { item: 'LCD Display & Peristaltic Dosing Pump', cost: 700 },
      { item: 'Waterproof Enclosure & Power Supplies', cost: 680 }
    ],
    wiringGuide: [
      { component: 'pH Sensor Board', pin: 'Po (Analog)', microcontroller: 'GPIO 35', note: 'Calibrate with buffer 4.0 & 7.0' },
      { component: 'TDS Sensor Board', pin: 'AOUT', microcontroller: 'GPIO 34', note: 'Analog voltage reading' },
      { component: 'DS18B20 Probe', pin: 'DATA', microcontroller: 'GPIO 4', note: 'OneWire with 4.7k resistor' }
    ],
    firmwareCode: `// Water Quality Monitoring System
#include <OneWire.h>
#include <DallasTemperature.h>

#define PH_PIN 35
#define TDS_PIN 34
#define ONE_WIRE_BUS 4

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);

void setup() {
  Serial.begin(115200);
  tempSensor.begin();
}

void loop() {
  tempSensor.requestTemperatures();
  float waterTemp = tempSensor.getTempCByIndex(0);
  
  int rawPH = analogRead(PH_PIN);
  float voltagePH = rawPH * (3.3 / 4095.0);
  float phValue = 7.0 + ((2.5 - voltagePH) / 0.18); // Calibrated slope

  int rawTDS = analogRead(TDS_PIN);
  float tdsPpm = (rawTDS / 4095.0) * 1000.0;

  Serial.printf("Water Temp: %.1f C | pH: %.2f | TDS: %.0f PPM\\n", 
                waterTemp, phValue, tdsPpm);
  delay(3000);
}`,
    libraries: [
      'DallasTemperature',
      'OneWire'
    ],
    testingProcedure: [
      'Submerge pH probe in standard pH 7.0 neutral buffer solution; adjust trimpot until reading is 7.00.',
      'Immerse in tap water and verify TDS reads between 150-300 PPM.'
    ],
    troubleshooting: [
      { issue: 'pH reading jumps wildly', fix: 'The glass bulb probe is high-impedance. Ground electrical loops or run on battery power to isolate noise.' }
    ],
    safetyPrecautions: [
      'Store pH probe in 3M KCl electrode storage solution; never allow glass tip to dry out.'
    ],
    demoTelemetryConfig: {
      type: 'waterQuality',
      sensors: [
        { key: 'ph', name: 'pH Value', unit: 'pH', value: 7.24, min: 0, max: 14, status: 'Optimal' },
        { key: 'tdsPpm', name: 'Dissolved Solids (TDS)', unit: 'PPM', value: 184, min: 0, max: 1000, status: 'Potable' },
        { key: 'waterTemp', name: 'Water Temperature', unit: '°C', value: 23.8, min: 10, max: 40, status: 'Normal' }
      ],
      actuators: [
        { key: 'aeratorPump', name: 'Oxygen Aerator Pump', state: true, pin: 'GPIO 26' }
      ]
    },
    isDemo: true,
    active: 1
  },

  {
    id: 'iot-smart-helmet',
    name: 'Smart Helmet for Worker Safety',
    slug: 'smart-helmet-worker-safety',
    category: 'Industrial IoT',
    subcategory: 'Worker Safety',
    difficulty: 'Advanced',
    platform: 'Arduino Nano + ESP8266',
    controller: 'Arduino Nano + ESP-01',
    price: 3900,
    kitPrice: 3900,
    rating: 4.9,
    reviewCount: 38,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Industrial mining and construction helmet monitoring helmet-worn status, toxic gas levels, heat stress, and sudden head impact shocks.',
    description: 'The Smart Helmet for Worker Safety protects industrial labor operating in hazardous mining, refinery, and construction sites. An infrared wear-detection sensor confirms the worker is wearing the safety gear before machinery enables. Embedded MQ-4 methane sensors sniff dangerous toxic gas pockets, while a 3-axis accelerometer registers fall collisions or heavy falling-debris head impacts, broadcasting SOS coordinates.',
    features: [
      'IR optical head-contact sensor verifying helmet is actively worn',
      'Harmful methane, carbon monoxide, and flammable gas sniffer via MQ-4',
      'High-impact G-force shock sensor registering falling debris hazards',
      'Ambient heat stress index calculation combining temperature and humidity',
      'Wireless telemetry link broadcasting worker ID & status to safety control room',
      'Lightweight rechargeable lithium polymer power supply lasting 10+ hours'
    ],
    components: [
      { name: 'Arduino Nano V3.0 Microcontroller', qty: 1, cost: 280, linkId: 'arduino' },
      { name: 'ESP8266 ESP-01 WiFi Serial Module', qty: 1, cost: 180, linkId: 'esp8266' },
      { name: 'MQ-4 Methane / Combustible Gas Sensor', qty: 1, cost: 220, linkId: 'sensors' },
      { name: 'SW-420 Piezo High-Shock Sensor', qty: 1, cost: 90, linkId: 'sensors' },
      { name: 'Optical IR Reflective Proximity Sensor (TCRT5000)', qty: 1, cost: 80, linkId: 'sensors' },
      { name: 'DHT11 Thermal Comfort Sensor', qty: 1, cost: 150, linkId: 'temperature' },
      { name: 'High-Lumen Emergency Warning Strobe LED & Buzzer', qty: 1, cost: 120, linkId: 'other' },
      { name: 'Industrial Hard Hat (Yellow / White Safety Helmet)', qty: 1, cost: 550, linkId: 'other' },
      { name: '3.7V 1800mAh LiPo Battery with TP4056 Step-Up', qty: 1, cost: 450, linkId: 'power' }
    ],
    budgetBreakdown: [
      { item: 'Arduino Nano & ESP Wireless Transceiver', cost: 460 },
      { item: 'Gas, Shock & Optical Wear Sensors', cost: 690 },
      { item: 'LiPo Battery, Charger & Step-Up Subsystem', cost: 450 },
      { item: 'Certified Industrial Hard Hat Shell & Harness', cost: 850 },
      { item: 'Assembly Wire Harness & Mounts', cost: 1450 }
    ],
    wiringGuide: [
      { component: 'TCRT5000 Worn Sensor', pin: 'OUT', microcontroller: 'Pin D2', note: 'Detects forehead presence' },
      { component: 'SW-420 Shock Sensor', pin: 'DO', microcontroller: 'Pin D3', note: 'Interrupt on high-g impact' },
      { component: 'MQ-4 Gas Sensor', pin: 'AOUT', microcontroller: 'Pin A0', note: 'Methane ppm' }
    ],
    firmwareCode: `// Smart Worker Helmet
#define WORN_PIN 2
#define SHOCK_PIN 3
#define GAS_PIN A0
#define ALARM_PIN 8

void setup() {
  Serial.begin(9600);
  pinMode(WORN_PIN, INPUT);
  pinMode(SHOCK_PIN, INPUT);
  pinMode(ALARM_PIN, OUTPUT);
}

void loop() {
  bool isWorn = (digitalRead(WORN_PIN) == LOW);
  int gasPpm = analogRead(GAS_PIN);
  bool impact = (digitalRead(SHOCK_PIN) == HIGH);

  if (!isWorn) {
    Serial.println("WARNING: Worker removed safety helmet!");
  }

  if (impact || gasPpm > 450) {
    digitalWrite(ALARM_PIN, HIGH);
    Serial.println("EMERGENCY: Worker Impact or Toxic Gas Hazard!");
  } else {
    digitalWrite(ALARM_PIN, LOW);
  }

  delay(500);
}`,
    libraries: [
      'SoftwareSerial'
    ],
    testingProcedure: [
      'Put the helmet on; confirm the "Helmet Worn: YES" status indicator illuminates.',
      'Tap the top helmet shell with blunt palm force; verify the impact sensor triggers the SOS siren.'
    ],
    troubleshooting: [
      { issue: 'Worn sensor not detecting forehead', fix: 'Adjust sensitivity screw on the TCRT5000 IR sensor board to calibrate skin reflection distance.' }
    ],
    safetyPrecautions: [
      'Never drill structural mounting holes into the protective crown of safety helmets.'
    ],
    demoTelemetryConfig: {
      type: 'helmet',
      sensors: [
        { key: 'helmetWorn', name: 'Helmet Worn Status', unit: '', value: 1, min: 0, max: 1, status: 'Secured' },
        { key: 'gasLevel', name: 'Methane Level', unit: 'PPM', value: 34, min: 0, max: 500, status: 'Safe' },
        { key: 'headImpactG', name: 'Impact G-Force', unit: 'G', value: 1.0, min: 0, max: 15, status: 'Normal' },
        { key: 'workerTemp', name: 'Under-Helmet Temp', unit: '°C', value: 32.1, min: 20, max: 45, status: 'Normal' }
      ],
      actuators: [
        { key: 'sosBeacon', name: 'Helmet Strobe Beacon', state: false, pin: 'Pin 8' }
      ]
    },
    isDemo: true,
    active: 1
  }
];
