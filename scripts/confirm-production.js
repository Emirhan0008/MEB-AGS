#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\x1b[33m%s\x1b[0m', '⚠️  DİKKAT: Production kanalına geçmek üzeresiniz!');
console.log('\x1b[33m%s\x1b[0m', 'Bu işlem, tüm kullanıcıları etkileyecek bir güncelleme yayınlamanıza olanak tanır.');
console.log('\x1b[33m%s\x1b[0m', 'Devam etmeden önce, lütfen aşağıdakileri kontrol edin:');
console.log('\x1b[36m%s\x1b[0m', '1. Preview kanalında tüm değişiklikleri test ettiniz mi?');
console.log('\x1b[36m%s\x1b[0m', '2. Kritik hatalar veya sorunlar var mı?');
console.log('\x1b[36m%s\x1b[0m', '3. Tüm ekip üyeleri bu güncellemeyi onayladı mı?');
console.log();

rl.question('\x1b[1m%s\x1b[0m ', 'Production kanalına geçmek istediğinizden emin misiniz? (evet/hayır):', (answer) => {
  if (answer.toLowerCase() === 'evet') {
    console.log('\x1b[32m%s\x1b[0m', '✅ Production kanalına geçiş onaylandı.');
    rl.close();
    process.exit(0); // Başarılı çıkış
  } else {
    console.log('\x1b[31m%s\x1b[0m', '❌ Production kanalına geçiş iptal edildi.');
    rl.close();
    process.exit(1); // Hatalı çıkış
  }
}); 