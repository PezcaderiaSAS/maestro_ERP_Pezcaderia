import express from 'express';
import cors from 'cors';
import { 
  registrarMermaDespieceAction, 
  registrarEntradaStockAction,
  sincronizarCajaOutboxAction
} from '@la-pezcaderia/database-shared';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Ruta de salud de la API
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MaestroPescaderia API Server' });
});

// Rutas de WMS (Warehouse Management System)
app.post('/api/wms/merma', async (req, res) => {
  try {
    const payload = req.body;
    const response = await registrarMermaDespieceAction(payload);
    
    // El objeto response ya trae la estructura ApiResponse<T> con su statusCode
    res.status(response.statusCode).json(response);
  } catch (error) {
    console.error('Error no capturado en el handler:', error);
    res.status(500).json({
      success: false,
      message: 'Error de servidor desconocido',
      statusCode: 500
    });
  }
});

app.post('/api/wms/entrada-stock', async (req, res) => {
  try {
    const payload = req.body;
    const response = await registrarEntradaStockAction(payload);
    res.status(response.statusCode).json(response);
  } catch (error) {
    console.error('Error no capturado en el handler:', error);
    res.status(500).json({
      success: false,
      message: 'Error de servidor desconocido',
      statusCode: 500
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Server corriendo en http://localhost:${PORT}`);
});
