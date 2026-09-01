const fs = require('fs');

const file = 'c:\\Users\\Lohith R\\creat-project\\src\\data\\projects.js';
let content = fs.readFileSync(file, 'utf8');

const imageMap = {
  'esp32-smart-home': '/images/esp32-smart-home.jpg',
  'iot-smart-agriculture': '/images/iot-smart-agriculture.jpg',
  'esp32-weather-station': '/images/esp32-weather-station.jpg',
  'smart-energy-meter': '/images/smart-energy-meter.jpg',
  'rfid-attendance': '/images/rfid-attendance.jpg',
  'auto-irrigation': 'https://images.unsplash.com/photo-1592424001806-19349e2195bb?w=800&q=80',
  'esp32-gps-tracker': 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80',
  'iot-water-level': 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&q=80',
  'smart-parking': 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80',
  'esp32-security': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&q=80',
  'line-following-robot': '/images/line-following-robot.jpg',
  'web-controlled-robot': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
  'air-quality-monitor': 'https://images.unsplash.com/photo-1611273426858-450d8e3c9cce?w=800&q=80',
  'industrial-iot': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
  'mqtt-dashboard': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80'
};

for (const [id, imageUrl] of Object.entries(imageMap)) {
  const regex = new RegExp(`(id:\\s*'${id}',[\\s\\S]*?image:\\s*)'[^']*'`, 'g');
  content = content.replace(regex, `$1'${imageUrl}'`);
}

fs.writeFileSync(file, content);
console.log('Successfully updated images!');
