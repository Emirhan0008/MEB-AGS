#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Argümanları al
const args = process.argv.slice(2);
let channel = args[0];

// Eğer kanal belirtilmemişse veya geçersizse, varsayılan olarak preview kanalını kullan
if (!channel || (channel !== 'preview' && channel !== 'production')) {
  console.log('Geçerli bir kanal belirtilmedi. Varsayılan olarak "preview" kanalı kullanılacak.');
  channel = 'preview';
}

// app.json dosyasının yolunu belirle
const appJsonPath = path.resolve(__dirname, '../app.json');

try {
  // app.json dosyasını oku
  const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
  const appJson = JSON.parse(appJsonContent);

  // Mevcut kanalı kontrol et
  const currentChannel = appJson.expo.updates.channel;
  
  if (currentChannel === channel) {
    console.log(`Uygulama zaten ${channel} kanalını kullanıyor.`);
    process.exit(0);
  }

  // Kanalı güncelle
  appJson.expo.updates.channel = channel;

  // Değişiklikleri kaydet
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

  console.log(`Kanal başarıyla ${channel} olarak değiştirildi.`);
  console.log('Şimdi yeni bir build oluşturabilirsiniz:');
  
  if (channel === 'preview') {
    console.log('eas build --profile preview --platform android');
  } else {
    console.log('eas build --profile production --platform android');
  }
  
  // Expo Updates kanalını da güncelle
  try {
    console.log(`Expo Updates kanalını ${channel} olarak güncelleniyor...`);
    execSync(`npx expo channel:switch ${channel}`, { stdio: 'inherit' });
  } catch (error) {
    console.warn('Expo Updates kanalı güncellenirken bir hata oluştu. Manuel olarak güncellemeniz gerekebilir.');
    console.warn('npx expo channel:switch ' + channel);
  }

} catch (error) {
  console.error('Hata:', error.message);
  process.exit(1);
} 