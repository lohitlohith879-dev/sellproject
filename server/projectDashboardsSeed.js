// server/projectDashboardsSeed.js
// Pre-seeded Showcase Projects for IoT & Web Development Dashboards

export const initialProjectDashboards = [
  // ============================================================
  // 1. IoT Projects
  // ============================================================
  {
    id: 'iot-echoscribe-ai',
    title: 'EchoScribe AI – Smart Meeting Summarizer',
    slug: 'echoscribe-ai-meeting-summarizer',
    category: 'iot',
    subcategory: 'AI + Embedded Hardware',
    status: 'Completed',
    coverImage: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: 'Edge-AI embedded meeting assistant capturing high-fidelity multi-mic audio, generating real-time speaker diarization, automated meeting minutes, and action items via local DSP & cloud LLM integration.',
    hardwareComponents: JSON.stringify([
      'ESP32-S3 Dual-Core SoC (16MB Flash, 8MB PSRAM)',
      'INMP441 I2S Digital MEMS Omnidirectional Microphone Array',
      '1.3-inch OLED I2C Display (SH1106, 128x64)',
      'MicroSD Card Module with SPI Interface',
      'TP4056 1A LiPo Battery Charging Module',
      '3.7V 2000mAh Lithium Polymer Battery',
      'Custom 3D-Printed Acoustic Tabletop Enclosure'
    ]),
    technologies: JSON.stringify([
      'C++',
      'FreeRTOS',
      'ESP-IDF',
      'Whisper AI (OpenAI)',
      'FastAPI',
      'Python',
      'WebSocket',
      'Node.js',
      'DSP Audio Filtering'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/echoscribe-ai-smart-hardware',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/#/projects/iot',
    overview: 'EchoScribe AI is a smart desktop hardware device designed to remove the friction of manual note-taking in engineering scrums, boardroom conferences, and academic seminars. Operating on an ESP32-S3 microcontroller with an I2S MEMS microphone array, the system streams encrypted, low-latency audio chunks, performs real-time acoustic beamforming, and integrates with cloud speech recognition pipelines to output structured meeting transcripts, executive summaries, and task lists.',
    problemStatement: 'During lengthy technical and strategic meetings, participants often lose critical action items or become distracted by manual documentation. Traditional recording apps lack real-time acoustic voice beamforming, physical meeting room status displays, and automated speaker separation.',
    proposedSolution: 'A standalone physical IoT appliance that sits on conference tables. It features physical one-touch start/stop tactile controls, an OLED telemetry screen showing active speaker channels, on-device audio buffering, and automated generation of Markdown summaries delivered straight to Slack and email.',
    componentList: JSON.stringify([
      { name: 'ESP32-S3-WROOM-1 Module', specs: 'Xtensa 32-bit LX7, 240MHz, 8MB PSRAM', qty: 1 },
      { name: 'INMP441 MEMS Microphones', specs: 'I2S digital output, 61dB SNR', qty: 2 },
      { name: 'SH1106 OLED 1.3"', specs: 'I2C 128x64 pixel monochrome', qty: 1 },
      { name: 'MicroSD Card Adapter', specs: 'SPI bus with 3.3V logic level', qty: 1 },
      { name: 'TP4056 Charger with Protection', specs: '1A constant current, Micro-USB/Type-C', qty: 1 },
      { name: 'Tactile Push Buttons', specs: 'Momentary 12mm buttons with pull-up resistors', qty: 3 }
    ]),
    circuitDiagram: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    workingPrinciple: 'Audio is sampled via the dual INMP441 MEMS microphones at 16kHz 16-bit PCM through the ESP32-S3 I2S peripheral. FreeRTOS DMA transfers buffers to internal PSRAM while applying high-pass digital noise suppression. The chunks are compressed and streamed through secure WebSockets to a Python backend, where Whisper AI transcribes the dialog and an LLM extracts action items, dates, and assignees.',
    results: 'Achieved 96.4% word error rate accuracy in 6-person conference room testing with background HVAC noise under 50dB. Reduced meeting synthesis time from 35 minutes to less than 20 seconds.',
    features: JSON.stringify([
      'Real-time dual-mic I2S beamforming audio capture',
      'Onboard 1.3-inch OLED meeting duration and audio level VU meter',
      'Local MicroSD offline backup recording with FAT32 journaling',
      'Automated speaker diarization and meeting minutes extraction',
      'Instant cloud synchronization with export to Markdown, PDF, and Slack webhook'
    ]),
    published: 1
  },

  {
    id: 'iot-smart-farm-monitor',
    title: 'Smart Autonomous Farm Monitoring System',
    slug: 'smart-autonomous-farm-monitoring',
    category: 'iot',
    subcategory: 'Smart Agriculture',
    status: 'Completed',
    coverImage: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: 'Autonomous solar-powered precision agricultural node with soil volumetric moisture, NPK fertility telemetry, weather forecasting, and automated solar-pump regulation.',
    hardwareComponents: JSON.stringify([
      'ESP32 DevKit V1 Microcontroller',
      'Capacitive Soil Moisture Sensor v1.2',
      'RS485 Modbus NPK Soil Fertility Probe',
      'DHT22 High-Accuracy Temperature & Humidity Sensor',
      'BMP280 Atmospheric Barometer',
      '12V Solar Panel (20W) + MPPT Solar Charge Controller',
      '5V Optocoupler Solid-State Relay Module'
    ]),
    technologies: JSON.stringify([
      'C++',
      'Arduino Core',
      'Modbus RTU',
      'MQTT Protocol',
      'ThingSpeak',
      'InfluxDB',
      'Grafana',
      'ESP-NOW Mesh'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/smart-autonomous-farm-iot',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/#/projects/iot',
    overview: 'The Smart Autonomous Farm Monitoring System is an industrial-grade precision agritech node built to address water scarcity and over-fertilization. By continuously sampling soil moisture, nitrogen-phosphorus-potassium (NPK) concentrations, temperature, and atmospheric pressure, the node activates micro-irrigation solenoids based on agronomic thresholds.',
    problemStatement: 'Unregulated agricultural irrigation wastes up to 60% of water in arid regions, while improper chemical fertilizer dosage causes soil salinization and ground water contamination.',
    proposedSolution: 'A rugged, solar-powered field station transmitting long-range telemetry over ESP-NOW and cellular/WiFi gateways, utilizing closed-loop feedback algorithms to dispense irrigation water only when root-zone moisture drops below optimal levels.',
    componentList: JSON.stringify([
      { name: 'ESP32 DevKit V1 Board', specs: '2.4GHz WiFi & Bluetooth dual-mode', qty: 1 },
      { name: 'RS485 NPK Sensor', specs: 'Detects Nitrogen, Phosphorus, Potassium 0-1999 mg/kg', qty: 1 },
      { name: 'MAX485 TTL to RS485 Transceiver', specs: '5V half-duplex serial converter', qty: 1 },
      { name: 'Capacitive Moisture Sensor v1.2', specs: 'Corrosion resistant analog probe', qty: 2 },
      { name: '12V 20W Monocrystalline Solar Panel', specs: 'Peak voltage 18V with MPPT step-down', qty: 1 },
      { name: 'Submersible 12V DC Pump', specs: '240 Liters/hour flow rate', qty: 1 }
    ]),
    circuitDiagram: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    workingPrinciple: 'The ESP32 queries the RS485 NPK probe every 10 minutes via Modbus RTU serial commands. Analog voltages from capacitive sensors represent soil dielectric permittivity. If soil moisture falls below 35%, the microcontroller energizes the relay driver to irrigate until moisture reaches 65%, logging all event telemetry to the central broker.',
    results: 'Demonstrated a 42% reduction in water consumption and 28% fertilizer savings over a 90-day field trial in tomato cultivation.',
    features: JSON.stringify([
      'Solar-powered self-sustaining telemetry node with MPPT charging',
      'Multi-depth soil moisture and NPK chemical fertility profiling',
      'Automated closed-loop drip irrigation relay control',
      'Frost and heat stress predictive SMS notifications for farmers',
      'Interactive Grafana dashboard visualizing field microclimates'
    ]),
    published: 1
  },

  {
    id: 'iot-motor-voltage-regulation',
    title: 'Agricultural Motor Voltage Monitoring and Regulation',
    slug: 'motor-voltage-monitoring-regulation',
    category: 'iot',
    subcategory: 'Industrial Automation',
    status: 'Completed',
    coverImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: '3-Phase electrical motor protection and monitoring controller detecting phase failure, over/under voltage transients, and dry-run conditions with automated GSM/IoT trip alerts.',
    hardwareComponents: JSON.stringify([
      'Arduino Mega 2560 / STM32F103 Microcontroller',
      'ZMPT101B Precision AC Voltage Sensor Modules (3x Phase Monitor)',
      'ACS712 30A Hall-Effect AC/DC Current Sensor Modules (3x)',
      'SIM800L GPRS/GSM Quad-Band Cellular Module',
      '3-Phase Heavy Duty Contactor & Overload Relay',
      '20x4 Character LCD Display with I2C Backpack',
      'Optocoupled Triac Gate Driver Circuitry'
    ]),
    technologies: JSON.stringify([
      'Embedded C++',
      'Root-Mean-Square (RMS) Calculation',
      'GSM AT Commands',
      'Analog Signal Conditioning',
      'MQTT Telemetry',
      'Hardware Interrupts (Timer1)'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/motor-voltage-regulation-iot',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/#/projects/iot',
    overview: 'The Agricultural Motor Voltage Monitoring and Regulation unit protects high-horsepower 3-phase induction water pump motors from burnout caused by voltage fluctuations, phase unbalance, phase reversal, and dry running in rural power grids.',
    problemStatement: 'Rural electricity distribution often suffers from extreme voltage dips (down to 140V) and sudden surges (up to 300V), leading to winding coil burnout in farm pumps, incurring costly rewinding expenses and irrigation downtime.',
    proposedSolution: 'A ruggedized real-time protective instrument that continuously computes True RMS voltages and phase currents across R-Y-B lines. Upon detecting brownouts, voltage spikes, or current collapse (dry run), it disengages the primary contactor within 15 milliseconds and dispatches an automated voice call / SMS alert to the farmer.',
    componentList: JSON.stringify([
      { name: 'Arduino Mega 2560 Pro', specs: 'ATmega2560, 54 I/O pins, 16MHz', qty: 1 },
      { name: 'ZMPT101B Voltage Transformer Module', specs: 'Measures up to 250V AC RMS with op-amp gain', qty: 3 },
      { name: 'ACS712-30A Current Sensor', specs: 'Hall effect current measurement up to 30A', qty: 3 },
      { name: 'SIM800L GSM Module', specs: 'Quad-band 850/900/1800/1900MHz with external antenna', qty: 1 },
      { name: '24V / 230V AC Industrial Contactor Relay', specs: 'Rated for 7.5 HP 3-phase motor', qty: 1 },
      { name: 'LCD 2004 with I2C Interface', specs: '20 characters x 4 lines blue backlight', qty: 1 }
    ]),
    circuitDiagram: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    workingPrinciple: 'Analog AC sinusoids from the ZMPT101B transformers are sampled by the 10-bit ADC at 1kHz. Fast Fourier Transform / True RMS algorithms compute instantaneous voltages. If phase voltage drops below 180V or exceeds 260V for more than 500ms, a digital interrupt cuts contactor drive voltage to isolate the motor windings.',
    results: 'Validated zero motor failure incidents across 15 agricultural installations over a 6-month testing period with over 450 detected brownout fault trips.',
    features: JSON.stringify([
      'True RMS calculation across 3-phase R, Y, B line voltages and currents',
      'Ultra-fast 15ms contactor isolation on catastrophic phase loss',
      'Dry-run protection algorithm sensing no-load motor power factor collapse',
      'Automated GSM SMS and phone call alerts with remote SMS motor ON/OFF control',
      'High-contrast 20x4 LCD displaying live voltages, line frequencies, and fault logs'
    ]),
    published: 1
  },

  {
    id: 'iot-rfid-attendance-system',
    title: 'RFID-Based Student Attendance System',
    slug: 'rfid-student-attendance-system',
    category: 'iot',
    subcategory: 'Embedded Systems',
    status: 'Completed',
    coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: 'Contactless automated campus attendance tracking terminal with 13.56MHz RFID authentication, RTC logging, instant parent SMS dispatch, and cloud database synchronization.',
    hardwareComponents: JSON.stringify([
      'NodeMCU ESP8266 WiFi Development Board',
      'RC522 13.56MHz RFID Reader with SPI Interface',
      'Mifare Classic 1K RFID Cards & Keyfobs',
      'DS3231 High-Precision Real-Time Clock Module with Battery Backup',
      '16x2 I2C Character LCD Display',
      'Active Piezo Buzzer & Dual Status Bi-color LEDs',
      'Micro-USB 5V Regulated Power Supply'
    ]),
    technologies: JSON.stringify([
      'C++',
      'ESP8266 Core',
      'REST APIs',
      'JSON Serialization',
      'Node.js Backend',
      'SQLite / MySQL',
      'Twilio SMS API',
      'Bootstrap Admin Portal'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/rfid-student-attendance-iot',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/#/projects/iot',
    overview: 'The RFID-Based Student Attendance System streamlines classroom roll-call by allowing students to tap their university smart cards onto an IoT wall-mounted terminal. The terminal authenticates card UIDs in less than 300 milliseconds, validates timestamps against scheduled class slots via an onboard DS3231 RTC, registers attendance into the campus database, and triggers real-time presence SMS notifications.',
    problemStatement: 'Manual paper roll-call takes 10 to 15 minutes per lecture, is susceptible to proxy attendance, and delays absence notifications to parents and academic advisors.',
    proposedSolution: 'A standalone IoT terminal connected to campus WiFi that provides instant audio-visual confirmation upon card tap, logs offline entries if network connectivity drops, and syncs seamlessly with administrative attendance spreadsheets.',
    componentList: JSON.stringify([
      { name: 'NodeMCU ESP8266', specs: '80MHz Tensilica L106, Integrated 802.11 b/g/n', qty: 1 },
      { name: 'RC522 RFID Module', specs: '13.56MHz SPI reader, ISO/IEC 14443 A/MIFARE', qty: 1 },
      { name: 'DS3231 I2C RTC Module', specs: 'Temperature-compensated crystal oscillator', qty: 1 },
      { name: 'I2C 1602 LCD Display', specs: 'HD44780 controller with PCF8574 backpack', qty: 1 },
      { name: 'Active Buzzer 5V', specs: '85dB audible beep confirmation', qty: 1 },
      { name: 'RFID Smart Cards', specs: 'Mifare 1K S50 13.56MHz contactless cards', qty: 10 }
    ]),
    circuitDiagram: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    workingPrinciple: 'The RC522 modulates a 13.56MHz electromagnetic field. When an RFID tag enters proximity, tag antenna induction powers its internal chip, transmitting its unique 4-byte UID. The ESP8266 reads the UID over SPI, grabs the current time from the DS3231, and posts an HTTP POST payload to the cloud API endpoint.',
    results: 'Tested across 250 daily student roll-calls. Reduced class check-in time from 12 minutes to under 45 seconds per classroom with zero proxy check-ins.',
    features: JSON.stringify([
      'Sub-second 300ms contactless RFID card authentication',
      'Dual-color visual feedback (Green = Verified, Red = Duplicate/Invalid)',
      'Offline attendance caching with automated sync upon WiFi reconnection',
      'Integrated real-time clock maintaining accuracy during power outages',
      'Cloud web dashboard with student analytics and automated parent SMS'
    ]),
    published: 1
  },

  {
    id: 'iot-smart-parking-system',
    title: 'AI-Based Smart Parking System',
    slug: 'ai-based-smart-parking-system',
    category: 'iot',
    subcategory: 'Smart Cities',
    status: 'Completed',
    coverImage: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: 'Computer vision and ultrasonic multi-tiered intelligent parking management system providing automated license plate recognition (ALPR), live slot availability, and boom barrier actuation.',
    hardwareComponents: JSON.stringify([
      'Raspberry Pi 4 Model B (4GB RAM) Edge Compute',
      'Arduino Nano Microcontroller Sub-controller',
      'HC-SR04 Ultrasonic Distance Sensors (6x Slot Detectors)',
      'SG90 & MG995 High-Torque Servo Motor Barrier Gates',
      'Infrared (IR) Obstacle Entry & Exit Proximity Sensors',
      'High-Resolution USB / CSI Camera Module',
      '0.96-inch I2C OLED Slot Status Indicator Displays'
    ]),
    technologies: JSON.stringify([
      'Python',
      'OpenCV',
      'YOLOv8',
      'Tesseract OCR',
      'WebSockets',
      'HTML5 Canvas',
      'Serial PySerial',
      'Flask'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/ai-smart-parking-system',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/#/projects/iot',
    overview: 'The AI-Based Smart Parking System tackles urban traffic congestion by combining edge computer vision and ultrasonic sensor arrays. As vehicles approach, camera feeds are processed via a YOLOv8 and Tesseract ALPR pipeline to recognize license plates, check entry permissions, open servo boom barriers, and route drivers to empty parking slots indicated on live web maps.',
    problemStatement: 'Up to 30% of urban traffic congestion is caused by drivers circling commercial parking garages searching for vacant spaces, producing excessive carbon emissions and driver frustration.',
    proposedSolution: 'An intelligent hybrid architecture with Raspberry Pi handling neural network vision recognition and an Arduino Nano managing real-time ultrasonic slot monitoring and physical barrier servos.',
    componentList: JSON.stringify([
      { name: 'Raspberry Pi 4 Model B', specs: 'Broadcom BCM2711 quad-core Cortex-A72, 4GB LPDDR4', qty: 1 },
      { name: 'Arduino Nano V3', specs: 'ATmega328P, 16MHz, 5V logic', qty: 1 },
      { name: 'HC-SR04 Ultrasonic Sensors', specs: '2cm to 400cm non-contact range', qty: 6 },
      { name: 'MG995 Metal Gear Servo', specs: '10kg/cm torque at 6V for barrier arm', qty: 2 },
      { name: 'USB 1080p HD Webcam', specs: 'Manual focus, low-light compensation', qty: 1 },
      { name: 'IR Beam Obstacle Sensors', specs: 'Adjustable range 2-30cm', qty: 4 }
    ]),
    circuitDiagram: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    workingPrinciple: 'The entrance IR sensor triggers the camera to capture a frame. OpenCV isolates the license plate bounding box and Tesseract OCR converts alphanumeric characters into text. Upon valid plate verification, the servo lifts the barrier. Ultrasonic sensors above each slot beam continuous status updates to the local web app.',
    results: 'Recognized Indian license plates with 94.2% accuracy under varying illumination. Reduced average vehicle park-time from 8.5 minutes to under 90 seconds.',
    features: JSON.stringify([
      'Automated License Plate Recognition (ALPR) utilizing deep learning YOLOv8',
      'Ultrasonic per-slot occupancy sensing with dual RGB status LEDs',
      'Physical servo boom barrier gate automation with obstacle collision safety',
      'Live interactive web map highlighting free, occupied, and reserved spaces',
      'Automated parking duration billing and digital receipt generation'
    ]),
    published: 1
  },

  {
    id: 'iot-arduino-radar-system',
    title: 'Arduino Radar Detection System',
    slug: 'arduino-radar-detection-system',
    category: 'iot',
    subcategory: 'Robotics & Sensors',
    status: 'Completed',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: '180-degree ultrasonic sweep radar tracking dynamic spatial obstacles with real-time sonar polar radar sweep visualization on Processing IDE.',
    hardwareComponents: JSON.stringify([
      'Arduino UNO R3 Microcontroller Board',
      'HC-SR04 Ultrasonic Distance Sensor Module',
      'SG90 180-Degree Micro Servo Motor',
      'Laser-Cut Acrylic Radar Turntable Mount Assembly',
      'Solderless Prototyping Breadboard & Wires',
      'USB Type-B High-Speed Data Cable'
    ]),
    technologies: JSON.stringify([
      'Arduino C++',
      'Processing 4 IDE',
      'Serial Communication (115200 baud)',
      'Trigonometric Polar Mapping',
      'Digital Filtering'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/arduino-ultrasonic-radar',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/#/projects/iot',
    overview: 'The Arduino Radar Detection System replicates naval and aviation sonar tracking using acoustic ultrasonic waves. An HC-SR04 distance transducer mounted on an SG90 servo motor oscillates smoothly between 15° and 165°, measuring distances up to 400 centimeters and streaming polar coordinate packets to an interactive computer radar screen.',
    problemStatement: 'Autonomous robotic navigation and security perimeter surveillance require affordable, non-optical obstacle detection systems that remain functional in zero-light, smoky, or foggy conditions.',
    proposedSolution: 'An acoustic echolocation radar pairing a low-cost microcontroller with a visual GUI that plots detected obstacles as glowing red targets on a military-grade green polar grid.',
    componentList: JSON.stringify([
      { name: 'Arduino UNO R3 Board', specs: 'ATmega328P, 16MHz clock, 5V', qty: 1 },
      { name: 'HC-SR04 Ultrasonic Sensor', specs: '40kHz transducer frequency, 15° beam angle', qty: 1 },
      { name: 'TowerPro SG90 Servo', specs: '1.8 kg/cm torque, 0.1s/60° operating speed', qty: 1 },
      { name: 'Rotational Radar Bracket', specs: 'Acrylic mount with servo horn connector', qty: 1 },
      { name: 'Breadboard & Wire Harness', specs: 'Male-to-male and male-to-female jumper cables', qty: 1 }
    ]),
    circuitDiagram: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    workingPrinciple: 'The Arduino commands the servo motor to step 1 degree at a time. At each angle, a 10-microsecond pulse excites the ultrasonic transmitter. The return echo duration is measured via `pulseIn()`, converted into centimeters (`distance = duration * 0.034 / 2`), and formatted as `angle,distance.` over UART serial.',
    results: 'Accurately mapped obstacles within a 4-meter range with an angular resolution of 1° and an average distance error margin of less than 1.5%.',
    features: JSON.stringify([
      'Smooth 180-degree sweep scanning with customizable sweep speeds',
      'Real-time polar coordinate plotting with distance rings (10cm, 20cm, 30cm, 40cm)',
      'Glowing vector radar beam visualizer with obstacle persistence trails',
      'Audible alarm trigger when obstacles breach a configurable safety perimeter',
      'Complete compatibility with Processing 4 graphical desktop application'
    ]),
    published: 1
  },

  {
    id: 'iot-rain-sensing-roof',
    title: 'Automatic Rain-Sensing Roof System',
    slug: 'automatic-rain-sensing-roof-system',
    category: 'iot',
    subcategory: 'Home Automation',
    status: 'Completed',
    coverImage: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: 'Weather-adaptive retractable awning and skylight shutter controller using resistive raindrop detection, wind velocity monitoring, and dual-direction motorized rack-and-pinion actuation.',
    hardwareComponents: JSON.stringify([
      'Arduino UNO / ATmega328P Microcontroller',
      'FC-37 Resistive Raindrop Sensor Board with LM393 Comparator',
      'L298N Dual H-Bridge Motor Driver Module',
      '12V High-Torque DC Geared Motor (100 RPM)',
      'Miniature Mechanical End-Stop Limit Switches (2x)',
      '16x2 I2C Character LCD Display',
      'Manual Override Rocker Switches (Open / Close / Auto)'
    ]),
    technologies: JSON.stringify([
      'Embedded C++',
      'Pulse-Width Modulation (PWM)',
      'Hardware Interrupts (INT0 / INT1)',
      'Debouncing Algorithms',
      'Analog Comparator Thresholding'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/rain-sensing-roof-system',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/#/projects/iot',
    overview: 'The Automatic Rain-Sensing Roof System is an architectural automation mechanism for skylights, outdoor restaurant seating, greenhouses, and drying terraces. It instantly detects rainwater droplets, activates high-torque motor drivers to slide protective roof panels into closed positions, and retracts them once weather conditions dry.',
    problemStatement: 'Unanticipated rainfall damages outdoor furniture, clothes drying terraces, industrial storage bays, and open architectural skylights when occupants are away or asleep.',
    proposedSolution: 'A responsive electromechanical roof system combining nickel-plated sensor pads, dual limit switches to prevent motor stalling, and an H-bridge driver delivering bidirectional movement.',
    componentList: JSON.stringify([
      { name: 'Arduino UNO R3 Board', specs: '16MHz ATmega328P with 5V onboard regulation', qty: 1 },
      { name: 'FC-37 Rain Drop Sensor Module', specs: '5x4cm nickel-plated track with LM393 sensitivity pot', qty: 1 },
      { name: 'L298N Motor Driver Module', specs: 'Dual H-Bridge, supports up to 2A per channel', qty: 1 },
      { name: '12V DC Metal Gear Motor', specs: '100 RPM, 3.5 kg-cm stall torque', qty: 1 },
      { name: 'KW12 Micro Limit Switches', specs: 'Roller lever SPDT microswitch', qty: 2 },
      { name: '12V 2A Regulated Power Adapter', specs: 'Supplies motor driver and Arduino VIN', qty: 1 }
    ]),
    circuitDiagram: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    workingPrinciple: 'The FC-37 sensor surface consists of interleaved conductive tracks. Raindrops bridge the tracks, drastically lowering electrical resistance and causing the LM393 comparator output to swing LOW. The Arduino detects this digital interrupt, checks the limit switch, and commands the L298N driver to rotate the motor forward until the closed limit switch triggers.',
    results: 'Demonstrated complete roof closure in under 4.2 seconds from the first detected raindrop, successfully withstanding over 500 mechanical test cycles without false triggers.',
    features: JSON.stringify([
      'Instantaneous rain detection with adjustable potentiometer sensitivity',
      'Dual limit-switch hardware safety preventing motor gear wear and burnout',
      'Three operational modes: Fully Automatic, Manual Open, and Manual Close',
      'Integrated heater trace compatibility to evaporate morning dew drops',
      'LCD status readout reporting current weather state and motor position'
    ]),
    published: 1
  },

  // ============================================================
  // 2. Web Development Projects
  // ============================================================
  {
    id: 'web-circuitkart-ecommerce',
    title: 'CircuitKart — Embedded & IoT Projects E-Commerce Platform',
    slug: 'circuitkart-ecommerce-platform',
    category: 'web',
    subcategory: 'E-Commerce Applications',
    status: 'Completed',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: 'Full-stack engineering marketplace featuring modular project customizers, live driver GPS tracking, role-based admin controls, and Flipkart-inspired customer profile management.',
    hardwareComponents: '',
    technologies: JSON.stringify([
      'JavaScript (ES Modules)',
      'Node.js',
      'Express',
      'SQLite (WAL Mode)',
      'Socket.IO',
      'Vanilla CSS3 Grid/Flexbox',
      'Leaflet.js',
      'JWT Authentication'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/sellproject',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/',
    overview: 'CircuitKart is a modern, high-performance web platform tailored for engineering students and makers purchasing embedded hardware kits. It features an interactive component customizer, real-time dispatch tracking with simulated GPS telemetry, a pure Flipkart-style user profile management dashboard, and GST tax invoice generation.',
    problemStatement: 'Engineering students struggle to find verified, pre-tested microcontroller project kits bundled with authentic schematics, verified firmware code, and reliable delivery tracking.',
    proposedSolution: 'A responsive single-page web app built with zero frontend framework overhead, backed by an Express REST API and persistent SQLite database for lightning-fast page transitions and reliable checkout.',
    componentList: JSON.stringify([]),
    circuitDiagram: '',
    workingPrinciple: 'The frontend operates as a clean hash-based single page application. Real-time updates for driver positions and order status transitions are synchronized over WebSockets using Socket.IO rooms. State management is coordinated through a lightweight reactive Pub/Sub store.',
    results: 'Deployed on Vercel with 99.8% uptime, sub-500ms initial page load speeds, and full mobile/desktop cross-browser compatibility.',
    features: JSON.stringify([
      'Flipkart-inspired clean customer profile, order history, and address manager',
      'Interactive project customizer calculating component prices dynamically',
      'Real-time GPS delivery tracking with live Leaflet map updates',
      'Role-based admin management portal with live inventory controls',
      'Printable and downloadable GST tax invoices with itemized breakdowns'
    ]),
    published: 1
  },

  {
    id: 'web-iot-telemetry-hub',
    title: 'IoT Live Telemetry & Device Monitoring Hub',
    slug: 'iot-live-telemetry-monitoring-hub',
    category: 'web',
    subcategory: 'Real-Time Monitoring Websites',
    status: 'Completed',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: 'Sub-second sensor streaming portal featuring real-time Chart.js gauges, automated threshold trip triggers, remote actuator toggles, and multi-node fleet telemetry.',
    hardwareComponents: '',
    technologies: JSON.stringify([
      'HTML5 Canvas',
      'Chart.js',
      'Socket.IO Client',
      'Node.js',
      'Express',
      'CSS Glassmorphism',
      'MQTT over WebSockets'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/sellproject',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/#/iot-projects',
    overview: 'An interactive streaming dashboard built to monitor remote industrial microcontrollers and farm nodes. It displays live time-series charts for temperature, soil moisture, voltage, and motor RPM, complete with remote actuator controls for relays and pumps.',
    problemStatement: 'Hardware developers often lack easy-to-use web dashboards to test remote IoT prototypes without setting up heavyweight enterprise SCADA systems.',
    proposedSolution: 'A responsive glassmorphism web console capable of subscribing to MQTT and WebSocket streams to plot telemetry with zero perceptible latency.',
    componentList: JSON.stringify([]),
    circuitDiagram: '',
    workingPrinciple: 'IoT nodes push JSON metrics to the backend, which fans out updates to connected clients using Socket.IO broadcasts. The client renders incoming packets on smooth rolling 60-frame buffers.',
    results: 'Maintains steady 60 FPS graph rendering during high-frequency 20Hz sensor packet updates.',
    features: JSON.stringify([
      'Interactive real-time line charts, gauge meters, and digital LED indicators',
      'Two-way remote actuator control buttons with instant feedback',
      'Configurable warning and critical alarm threshold banners',
      'CSV telemetry export for scientific analysis in MATLAB and Excel',
      'Dark cyberpunk glassmorphism UI optimized for engineering control rooms'
    ]),
    published: 1
  },

  {
    id: 'web-echoscribe-cloud-portal',
    title: 'EchoScribe AI Meeting Web Portal',
    slug: 'echoscribe-ai-web-portal',
    category: 'web',
    subcategory: 'AI-Powered Web Applications',
    status: 'In Progress',
    coverImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: 'AI-powered meeting intelligence portal with audio stream transcription, multi-speaker diarization timeline, action item extraction, and Notion export.',
    hardwareComponents: '',
    technologies: JSON.stringify([
      'React',
      'Python',
      'FastAPI',
      'Whisper AI',
      'LangChain',
      'WebRTC Audio',
      'TailwindCSS'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/sellproject',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/',
    overview: 'The web companion portal for EchoScribe AI devices, offering users an organized digital workspace to review past meeting transcripts, search technical discussions, and generate follow-up emails.',
    problemStatement: 'Engineers spend excessive hours re-listening to hours of recorded discussions to extract technical decisions and Jira backlog tickets.',
    proposedSolution: 'A clean, modern web application providing searchable audio timelines, semantic topic clustering, and one-click task export to Jira, Trello, and Notion.',
    componentList: JSON.stringify([]),
    circuitDiagram: '',
    workingPrinciple: 'Audio uploaded from the IoT device or browser microphone is processed by Whisper AI. The resulting transcript is partitioned into speaker segments and summarized using LangChain prompts.',
    results: 'Currently in active beta with 45 registered engineering student teams.',
    features: JSON.stringify([
      'Interactive synchronized audio player with highlighted text transcript',
      'Speaker diarization breakdown showing speaking time distributions',
      'AI-generated executive summaries and priority action matrices',
      'Export to Markdown, PDF, and automated email dispatch'
    ]),
    published: 1
  },

  {
    id: 'web-admin-portal',
    title: 'Engineering Executive Admin Dashboard',
    slug: 'engineering-admin-portal',
    category: 'web',
    subcategory: 'Admin Dashboards',
    status: 'Completed',
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: 'Role-based control portal providing order dispatch simulation, real-time driver fleet location tracking, user role management, and inventory stock monitoring.',
    hardwareComponents: '',
    technologies: JSON.stringify([
      'JavaScript',
      'Node.js',
      'Express',
      'Leaflet.js',
      'Socket.IO',
      'SQLite',
      'CSS Cyberpunk Dark Theme'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/sellproject',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/#/admin-login',
    overview: 'The administrative command center for the CircuitKart ecosystem, allowing store managers to oversee customer orders, simulate real-time driver coordinates on Bangalore roads, and add new projects to the catalog.',
    problemStatement: 'E-commerce administrators require an intuitive, centralized interface to manage both products and live delivery fleets without jumping between disparate services.',
    proposedSolution: 'A responsive administrative dashboard with live WebSocket feeds, real-time driver waypoint simulation, and role-guarded CRUD tools.',
    componentList: JSON.stringify([]),
    circuitDiagram: '',
    workingPrinciple: 'Admins authenticate via JWT credentials. The dashboard displays live statistics and provides interactive controls to advance order stages from placed to delivered.',
    results: 'Handles concurrent admin connections with real-time sync across open tabs.',
    features: JSON.stringify([
      'Live driver dispatch tracking with interactive Leaflet map controls',
      'One-click order status progression (Confirmed, Packed, Shipped, Delivered)',
      'Product and component inventory stock management',
      'System activity audit log broadcasting events in real time'
    ]),
    published: 1
  },

  {
    id: 'web-engineering-portfolio',
    title: 'Futuristic Engineering Student Portfolio',
    slug: 'engineering-student-portfolio',
    category: 'web',
    subcategory: 'Portfolio Websites',
    status: 'Completed',
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: 'High-aesthetic engineering portfolio showcasing hardware schematics, embedded projects, and web applications with interactive filtering and live demonstration embeds.',
    hardwareComponents: '',
    technologies: JSON.stringify([
      'HTML5',
      'CSS3 Glassmorphism',
      'Vanilla JavaScript',
      'Vite',
      'Lucide Icons',
      'Responsive Web Design'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/sellproject',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/#/projects',
    overview: 'A premium portfolio showcase designed specifically for electronics and software engineering students. It highlights project problem statements, schematics, component costs, and GitHub repositories in an engaging futuristic UI.',
    problemStatement: 'Traditional software portfolios only showcase frontend websites and lack dedicated templates to display microcontroller circuits, hardware pinouts, and embedded firmware.',
    proposedSolution: 'A dual-dashboard project management system separating IoT hardware from web development software while uniting them under one cohesive engineering theme.',
    componentList: JSON.stringify([]),
    circuitDiagram: '',
    workingPrinciple: 'Modular components render clean cards with dynamic technology filters, real-time search, and dedicated project breakdown views.',
    results: 'Demonstrated exceptional recruiter engagement with interactive project details and live demo buttons.',
    features: JSON.stringify([
      'Dual IoT & Web Development project dashboards with separate categorization',
      'Real-time technology stack and project status filtering',
      'Glassmorphism aesthetic with subtle animations and dark cyberpunk palette',
      'Admin capability to create, edit, publish, and delete projects seamlessly'
    ]),
    published: 1
  },

  {
    id: 'web-agritech-cloud-platform',
    title: 'AgriTech Cloud Analytics Platform',
    slug: 'agritech-cloud-analytics-platform',
    category: 'web',
    subcategory: 'Full-Stack Web Applications',
    status: 'Planned',
    coverImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    screenshots: JSON.stringify([
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
    ]),
    shortDescription: 'Full-stack cloud portal aggregating field microclimate data, satellite soil moisture indices, and automated irrigation schedules across regional agricultural zones.',
    hardwareComponents: '',
    technologies: JSON.stringify([
      'React',
      'Node.js',
      'Express',
      'PostgreSQL / SQLite',
      'OpenWeatherMap API',
      'Leaflet.js',
      'Chart.js'
    ]),
    githubUrl: 'https://github.com/lohitlohith879-dev/sellproject',
    demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    liveWebsiteUrl: 'https://sellproject-wv5s.vercel.app/',
    overview: 'An expansive enterprise agricultural analytics application intended to monitor hundreds of distributed IoT farm nodes, providing automated irrigation scheduling, disease risk alerts, and harvest yield predictions.',
    problemStatement: 'Farmers with dispersed land parcels struggle to correlate localized weather predictions with actual root-zone soil telemetry.',
    proposedSolution: 'A geospatial mapping web platform that correlates live in-field sensor nodes with satellite weather forecasts to recommend optimal watering times.',
    componentList: JSON.stringify([]),
    circuitDiagram: '',
    workingPrinciple: 'Collects incoming sensor telemetry, runs statistical moisture depletion curves, and delivers actionable alerts via web push and SMS.',
    results: 'Architecture planned and ready for deployment upon field sensor rollout.',
    features: JSON.stringify([
      'Geospatial farm parcel mapping with interactive sensor markers',
      'Automated irrigation water requirement calculations (Evapotranspiration ET0)',
      'Historical trend comparison charts across planting seasons',
      'Multi-farm management with role-based agronomist access'
    ]),
    published: 1
  }
];
