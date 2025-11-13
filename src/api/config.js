import axios from "axios";
import { CONFIG } from "../config";

const axiosInstance = axios.create({
    baseURL: CONFIG.uri,
    timeout: 10000
});

export default axiosInstance;