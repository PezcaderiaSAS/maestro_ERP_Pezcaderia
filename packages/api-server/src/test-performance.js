import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de la prueba de carga
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Rampa hasta 50 usuarios concurrentes
    { duration: '1m', target: 50 },   // Mantener 50 usuarios por 1 minuto
    { duration: '30s', target: 0 },   // Bajar a 0 usuarios
  ],
  thresholds: {
    // El 95% de las peticiones deben ser atendidas en menos de 500ms
    http_req_duration: ['p(95)<500'],
    // La tasa de fallo debe ser inferior al 1%
    http_req_failed: ['rate<0.01'],
  },
};

const API_URL = 'http://localhost:3001/api/wms/merma';

export default function () {
  const payload = JSON.stringify({
    empresaId: '00000000-0000-0000-0000-000000000000',
    usuarioId: '00000000-0000-0000-0000-000000000000',
    bodegaId: '00000000-0000-0000-0000-000000000001',
    productoId: '00000000-0000-0000-0000-000000000002',
    cantidad: 1.5,
    observacion: 'Prueba de carga K6 - Mermas concurrentes'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Se lanza la petición de merma
  const res = http.post(API_URL, payload, params);

  // Verificamos que el servidor responda correctamente (200 o 201)
  // Nota: Si los datos no existen en la BD, la API puede devolver 400 (Bad Request) o 404.
  // En ese caso, evaluamos que la API no colapse (status 500).
  check(res, {
    'status es distinto a 500 (API no colapsa)': (r) => r.status !== 500,
    'tiempo de respuesta es aceptable': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
