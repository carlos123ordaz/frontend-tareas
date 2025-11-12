import axios from "axios";

const axiosInstance = axios.create({
    baseURL: 'https://backend-tareas-production-281c.up.railway.app/api',
    timeout: 10000
});

export default axiosInstance;