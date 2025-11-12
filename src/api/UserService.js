import axiosInstance from "./config";

const userService = {
    register: async (params = {}) => {
        try {
            const response = await axiosInstance.post('/users/register', params);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    login: async (params = {}) => {
        try {
            const response = await axiosInstance.post('/users/login', params);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default userService;