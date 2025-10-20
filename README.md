# ⏱️ TimeTracker

**TimeTracker** es una aplicación web moderna para el seguimiento de tiempo y gestión de tareas. Permite registrar, pausar y analizar el tiempo dedicado a diferentes actividades, con una interfaz intuitiva y reportes exportables.

![TimeTracker Banner](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Node](https://img.shields.io/badge/Node-18+-brightgreen)

---

## 🚀 Características

- ✅ **Registro de tiempo en tiempo real** - Inicia, pausa y detén temporizadores
- 📊 **Dashboard interactivo** - Visualiza tus estadísticas de tiempo
- 🎨 **Gestión de tareas** - Crea y organiza tareas con colores personalizados
- 📈 **Reportes exportables** - Descarga tus datos en formato CSV
- 🌙 **Tema claro/oscuro** - Interfaz adaptable a tus preferencias
- 📱 **Diseño responsive** - Funciona perfectamente en desktop y móvil
- 🔐 **Autenticación segura** - Sistema de login y registro de usuarios

---

## 🛠️ Tecnologías

### Frontend
- **React** 18 - Biblioteca de UI
- **Material-UI (MUI)** - Componentes de interfaz
- **React Router** - Navegación
- **Vite** - Build tool y dev server

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB

---

## 📦 Instalación

### Prerrequisitos

- Node.js 18 o superior
- npm o yarn
- MongoDB Atlas (o MongoDB local)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/timetracker.git
cd timetracker
```

### 2. Configurar el Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` en la carpeta `backend`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/timetracker?retryWrites=true&w=majority

# Servidor
PORT=4000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT (opcional, para autenticación)
JWT_SECRET=tu_secreto_super_seguro_aqui
```

Inicia el servidor:

```bash
npm start
# o para desarrollo con hot reload
npm run dev
```

El backend estará corriendo en `http://localhost:4000`

### 3. Configurar el Frontend

```bash
cd frontend
npm install
```

Crea un archivo `src/config.js`:

```javascript
export const CONFIG = {
    uri: 'http://localhost:4000/api'
};
```

Inicia el frontend:

```bash
npm run dev
```

El frontend estará corriendo en `http://localhost:5173`

---

## 🌐 Despliegue

### Backend (Railway)

1. Crea una cuenta en [Railway](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno:
   ```
   MONGODB_URI=tu_connection_string
   PORT=8080
   NODE_ENV=production
   FRONTEND_URL=tu_url_frontend
   ```
4. Railway desplegará automáticamente

### Frontend (Vercel/Netlify)

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
```bash
npm run build
# Sube la carpeta dist/ a Netlify
```

No olvides actualizar `src/config.js` con la URL de producción del backend.

---

## 📖 Uso

### 1. Registro e inicio de sesión
- Crea una cuenta nueva o inicia sesión con tus credenciales

### 2. Crear tareas
- Ve a **Timer** → **Nueva tarea**
- Asigna un nombre y color a tu tarea

### 3. Registrar tiempo
- Selecciona una tarea del dropdown
- Presiona **Iniciar** para comenzar a contar tiempo
- Usa **Pausar** para hacer una pausa
- Usa **Detener** para finalizar la entrada

### 4. Ver estadísticas
- Accede al **Dashboard** para ver gráficos y análisis
- Consulta tu historial de entradas por fecha

### 5. Exportar reportes
- Ve a **Reportes**
- Selecciona el período a exportar
- Descarga el archivo CSV con todos tus datos

---

## 🗂️ Estructura del Proyecto

```
timetracker/
├── backend/
│   ├── models/          # Modelos de Mongoose
│   ├── routes/          # Rutas de la API
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Middlewares personalizados
│   └── index.js         # Punto de entrada
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas principales
│   │   ├── layouts/     # Layouts (MainLayout)
│   │   ├── config.js    # Configuración
│   │   ├── ThemeContext.jsx  # Contexto de tema
│   │   └── App.jsx      # Componente principal
│   └── public/          # Archivos estáticos
│
└── README.md
```

---

## 🔌 API Endpoints

### Usuarios
- `POST /api/users/register` - Registrar nuevo usuario
- `POST /api/users/login` - Iniciar sesión

### Tareas
- `GET /api/tasks/user/:userId` - Obtener tareas del usuario
- `POST /api/tasks/create` - Crear nueva tarea
- `DELETE /api/tasks/:taskId` - Eliminar tarea

### Entradas de Tiempo
- `GET /api/entries/user/:userId/date/:date` - Obtener entradas por fecha
- `GET /api/entries/active/:userId` - Obtener entrada activa
- `POST /api/entries/start` - Iniciar entrada
- `POST /api/entries/pause` - Pausar entrada
- `POST /api/entries/resume/:entryId` - Reanudar entrada
- `POST /api/entries/complete/:entryId` - Completar entrada
- `DELETE /api/entries/:entryId` - Eliminar entrada
- `GET /api/entries/user/:userId/range/:start/:end` - Obtener entradas por rango

---

## 🎨 Capturas de Pantalla

### Tema Claro
![Timer Page Light](https://via.placeholder.com/800x400?text=Timer+Page+Light+Mode)

### Tema Oscuro
![Timer Page Dark](https://via.placeholder.com/800x400?text=Timer+Page+Dark+Mode)

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 🐛 Reporte de Bugs

Si encuentras un bug, por favor abre un [issue](https://github.com/tu-usuario/timetracker/issues) con:
- Descripción del problema
- Pasos para reproducirlo
- Comportamiento esperado vs actual
- Screenshots (si aplica)

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- LinkedIn: [Tu Perfil](https://linkedin.com/in/tu-perfil)
- Email: tu-email@ejemplo.com

---

## 🙏 Agradecimientos

- [Material-UI](https://mui.com/) por los componentes de interfaz
- [MongoDB](https://www.mongodb.com/) por la base de datos
- [Railway](https://railway.app/) por el hosting del backend
- [React](https://react.dev/) por la biblioteca de UI

---

## 📊 Roadmap

- [ ] Integración con Google Calendar
- [ ] Notificaciones push
- [ ] Modo offline con sync
- [ ] App móvil nativa
- [ ] Reportes avanzados con gráficos personalizables
- [ ] Integración con Slack/Discord
- [ ] Timer Pomodoro integrado
- [ ] Equipos y proyectos colaborativos

---

## ⚙️ Configuración Avanzada

### MongoDB Atlas Setup

1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un nuevo cluster
3. Ve a **Network Access** → Agrega `0.0.0.0/0` para permitir todas las IPs
4. Ve a **Database Access** → Crea un usuario con permisos de lectura/escritura
5. Copia el connection string y reemplaza `<password>` con tu contraseña

### Variables de Entorno en Producción

Para Railway, configura las siguientes variables en el dashboard:

```env
MONGODB_URI=mongodb+srv://...
PORT=8080
NODE_ENV=production
FRONTEND_URL=https://tu-app.vercel.app
JWT_SECRET=un_secreto_muy_seguro_en_produccion
```

---

## 💡 Tips de Uso

- Usa **Pausar** en lugar de **Detener** si planeas continuar con la misma tarea
- Las entradas pausadas pueden reanudarse desde el historial
- Los reportes CSV son compatibles con Excel y Google Sheets
- Puedes tener múltiples entradas pausadas, pero solo una activa
- El tema (claro/oscuro) se guarda automáticamente en tu navegador

---

## 🔒 Seguridad

- Las contraseñas se almacenan hasheadas
- Los tokens JWT expiran automáticamente
- CORS configurado para dominios específicos
- Variables sensibles en archivos `.env` (no versionados)

---

## 📞 Soporte

¿Necesitas ayuda? 
- 📧 Email: soporte@timetracker.com
- 💬 Discord: [Únete a nuestra comunidad](https://discord.gg/tu-servidor)
- 📖 Documentación: [docs.timetracker.com](https://docs.timetracker.com)

---

