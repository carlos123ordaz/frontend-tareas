import axiosInstance from "./config";

const areaService = {
    getAll: async () => {
        try {
            const response = await axiosInstance.get('/areas');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default areaService;