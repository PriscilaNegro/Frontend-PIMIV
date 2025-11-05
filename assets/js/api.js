const api = axios.create({
  baseURL: "http://localhost:7202/api", // endereço do backend
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
