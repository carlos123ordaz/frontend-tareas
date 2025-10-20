import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, IconButton, InputAdornment } from '@mui/material';
import { Timer, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../config';

export const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'username' ? value.toUpperCase() : value
        });
        setError('');
    };

    const handleLogin = async () => {
        if (formData.username.length < 2) {
            setError('Las iniciales deben tener al menos 2 caracteres');
            return;
        }
        if (!formData.password) {
            setError('Por favor ingresa tu contraseña');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${CONFIG.uri}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                }),
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', formData.username);
                navigate('/');
            } else {
                setError(data.msg || 'Credenciales inválidas');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f7fa',
                p: 2,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    maxWidth: 400,
                    width: '100%',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    textAlign: 'center',
                }}
            >
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: '#03a9f4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                    }}
                >
                    <Timer sx={{ fontSize: 32, color: 'white' }} />
                </Box>

                <Typography variant="h5" fontWeight="700" gutterBottom color="#03a9f4">
                    TimeTracker
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Sistema de control de tiempo laboral
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    label="Iniciales del usuario"
                    name="username"
                    variant="outlined"
                    value={formData.username}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ej: FG"
                    helperText={
                        formData.username.length === 0
                            ? "Ingrese al menos 2 caracteres"
                            : formData.username.length === 1
                                ? "Falta 1 carácter más"
                                : "✓ Iniciales válidas"
                    }
                    error={formData.username.length === 1}
                    inputProps={{ maxLength: 4 }}
                    sx={{ mb: 2 }}
                    autoFocus
                />

                <TextField
                    fullWidth
                    label="Contraseña"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={formData.password}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ingresa tu contraseña"
                    sx={{ mb: 3 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleLogin}
                    disabled={formData.username.length < 2 || !formData.password || loading}
                    sx={{
                        py: 1.5,
                        bgcolor: '#03a9f4',
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        boxShadow: 'none',
                        '&:hover': {
                            bgcolor: '#0288d1',
                            boxShadow: 'none',
                        },
                        mb: 2
                    }}
                >
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>

                <Button
                    fullWidth
                    variant="text"
                    onClick={() => navigate('/register')}
                    sx={{
                        textTransform: 'none',
                        color: '#03a9f4',
                    }}
                >
                    ¿No tienes cuenta? Regístrate
                </Button>
            </Paper>
        </Box>
    );
};