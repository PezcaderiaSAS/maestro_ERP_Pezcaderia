// scripts/test_pollinations_api.js
import http from 'https';

console.log('--- Probando Conectividad con la API de Pollinations AI ---');

const testPrompt = encodeURIComponent('fresh red raw tuna steak on ice, food photography');
const url = `https://image.pollinations.ai/prompt/${testPrompt}?width=100&height=100&nologo=true&seed=123`;

console.log(`Enviando petición a: ${url}\n`);

const req = http.get(url, (res) => {
  const { statusCode } = res;
  const contentType = res.headers['content-type'];

  console.log(`Código de Estado Recibido: ${statusCode}`);
  console.log(`Tipo de Contenido Recibido (Content-Type): ${contentType}`);

  let error;
  if (statusCode !== 200) {
    error = new Error(`Petición fallida.\nCódigo de estado: ${statusCode}`);
  } else if (!contentType || !contentType.startsWith('image/')) {
    error = new Error(`Tipo de contenido inválido.\nEsperaba un tipo de imagen, pero se recibió: ${contentType}`);
  }

  if (error) {
    console.error(`❌ Error en la prueba: ${error.message}`);
    process.exit(1);
  }

  console.log('✅ ¡Prueba Exitosa! La API responde correctamente con una imagen.');
  process.exit(0);
});

req.on('error', (e) => {
  console.error(`❌ Error de red durante la petición: ${e.message}`);
  process.exit(1);
});
