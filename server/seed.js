import db from './db.js';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Support CommonJS require in ES Module
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function runSeed() {
  console.log('Starting data migration...');

  try {
    const pricing = {
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
        'MQTT': 0,
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
      }
    };

    // Insert Components
    const insertComp = db.prepare('INSERT INTO components (category, name, price) VALUES (?, ?, ?)');
    let compCount = 0;
    
    // Clear existing components just in case
    db.exec('DELETE FROM components');
    
    for (const [category, items] of Object.entries(pricing)) {
      if (category === 'customizationBaseCharge') continue;
      for (const [name, price] of Object.entries(items)) {
        insertComp.run(category, name, price);
        compCount++;
      }
    }
    console.log(`✅ Inserted ${compCount} components/pricing rules.`);

    // 2. Seed Settings
    db.exec('DELETE FROM settings');
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('upi_id', '8123670980@ybl');
    insertSetting.run('customizationBaseCharge', '500');
    console.log(`✅ Inserted settings.`);

    // 3. Seed Projects
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const projectsPath = join(__dirname, '../src/data/projects.js');
    
    let projectsCode = fs.readFileSync(projectsPath, 'utf-8');
    projectsCode = projectsCode.replace('export const projects =', 'const projects =');
    projectsCode += '\nmodule.exports = projects;';
    
    const tempFile = join(__dirname, 'temp_projects.cjs');
    fs.writeFileSync(tempFile, projectsCode);
    
    const projects = require('./temp_projects.cjs');
    
    fs.unlinkSync(tempFile);

    const insertProject = db.prepare(`
      INSERT INTO projects (
        id, name, slug, category, subcategory, description, shortDescription, 
        difficulty, rating, reviewCount, price, image, images, controller, 
        sensors, communication, display, software, powerSystem, hardware, 
        features, applications, components, blockDiagram, circuitDiagram, 
        softwareDetails, whatsIncluded, sourceCode, documentation, tags, 
        deliveryTime, popular, featured, active
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    db.exec('DELETE FROM projects');
    
    let projCount = 0;
    for (const p of projects) {
      insertProject.run(
        p.id,
        p.name,
        p.slug,
        p.category || '',
        p.subcategory || '',
        p.description || '',
        p.shortDescription || '',
        p.difficulty || 'Beginner',
        p.rating || 5.0,
        p.reviewCount || 0,
        p.price || 0,
        p.image || '',
        JSON.stringify(p.images || []),
        p.controller || '',
        JSON.stringify(p.sensors || []),
        JSON.stringify(p.communication || []),
        JSON.stringify(p.display || []),
        JSON.stringify(p.software || []),
        p.powerSystem || '',
        p.hardware || '',
        JSON.stringify(p.features || []),
        JSON.stringify(p.applications || []),
        JSON.stringify(p.components || []),
        p.blockDiagram || '',
        p.circuitDiagram || '',
        p.softwareDetails || '',
        JSON.stringify(p.whatsIncluded || []),
        p.sourceCode ? 1 : 0,
        p.documentation ? 1 : 0,
        JSON.stringify(p.tags || []),
        p.deliveryTime || '3-5 days',
        p.popular ? 1 : 0,
        p.featured ? 1 : 0,
        1 
      );
      projCount++;
    }
    console.log(`✅ Inserted ${projCount} projects.`);
    
    console.log('Migration complete!');

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runSeed();
