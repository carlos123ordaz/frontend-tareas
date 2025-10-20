import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, IconButton, InputAdornment } from '@mui/material';
import { PersonAdd, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../config';

export const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        lname: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        let newValue = value;
        // Para username (iniciales): solo letras en mayúsculas
        if (name === 'username') {
            newValue = value.replace(/[^a-zA-Z]/g, '').toUpperCase();
        }

        setFormData({
            ...formData,
            [name]: newValue
        });
        setError('');
    };

    const handleRegister = async () => {
        // Validaciones
        if (formData.username.length < 2) {
            setError('Las iniciales deben tener al menos 2 caracteres');
            return;
        }

        if (!formData.name.trim() || !formData.lname.trim()) {
            setError('Por favor completa tu nombre y apellido');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${CONFIG.uri}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    lname: formData.lname.trim(),
                    username: formData.username,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Usuario registrado exitosamente. Redirigiendo al login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(data.msg || 'Error al registrar usuario');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
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
                    maxWidth: 450,
                    width: '100%',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            bgcolor: '#03a9f4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}
                    >
                        <PersonAdd sx={{ fontSize: 32, color: 'white' }} />
                    </Box>

                    <Typography variant="h5" fontWeight="700" color="#03a9f4" gutterBottom>
                        Registro de Usuario
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Crea tu cuenta en TimeTracker
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    label="Iniciales del usuario"
                    name="username"
                    variant="outlined"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Ej: FG"
                    helperText={
                        formData.username.length === 0
                            ? "Ingrese las iniciales de su nombre y apellido"
                            : formData.username.length === 1
                                ? "Falta 1 carácter más"
                                : "✓ Iniciales válidas"
                    }
                    error={formData.username.length === 1}
                    inputProps={{ maxLength: 4 }}
                    sx={{ mb: 2 }}
                    required
                    autoFocus
                />

                <TextField
                    fullWidth
                    label="Nombre(s)"
                    name="name"
                    variant="outlined"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej: Fernando"
                    sx={{ mb: 2 }}
                    required
                />

                <TextField
                    fullWidth
                    label="Apellido(s)"
                    name="lname"
                    variant="outlined"
                    value={formData.lname}
                    onChange={handleChange}
                    placeholder="Ej: García"
                    sx={{ mb: 2 }}
                    required
                />

                <TextField
                    fullWidth
                    label="Contraseña"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    sx={{ mb: 2 }}
                    required
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

                <TextField
                    fullWidth
                    label="Confirmar Contraseña"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                    sx={{ mb: 3 }}
                    required
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    edge="end"
                                >
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleRegister}
                    disabled={loading || formData.username.length < 2}
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
                    {loading ? 'Registrando...' : 'Registrarse'}
                </Button>

                <Button
                    fullWidth
                    variant="text"
                    onClick={() => navigate('/login')}
                    sx={{
                        textTransform: 'none',
                        color: '#03a9f4',
                    }}
                >
                    ¿Ya tienes cuenta? Inicia sesión
                </Button>
            </Paper>
        </Box>
    );
};