import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, IconButton, InputAdornment } from '@mui/material';
import { Timer, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import userService from '../api/UserService';


export const LoginPage = () => {
    const navigate = useNavigate();
    const { handleSubmit, control, watch, formState: { errors } } = useForm({
        defaultValues: {
            username: '',
            password: ''
        }
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const username = watch('username');
    const password = watch('password');

    const onSubmit = async (data) => {
        setLoading(true);
        setError('');

        try {
            const response = await userService.login({
                username: data.username,
                password: data.password
            });

            localStorage.setItem('user', JSON.stringify(response));
            navigate('/');
        } catch (err) {
            const errorMessage = err.response?.data?.msg || 'Error de conexión con el servidor';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(onSubmit)();
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

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Controller
                        name="username"
                        control={control}
                        rules={{
                            required: 'Las iniciales son requeridas',
                            minLength: {
                                value: 2,
                                message: 'Las iniciales deben tener al menos 2 caracteres'
                            },
                            maxLength: {
                                value: 4,
                                message: 'Las iniciales no pueden tener más de 4 caracteres'
                            }
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Iniciales del usuario"
                                variant="outlined"
                                placeholder="Ej: FG"
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    field.onChange(value);
                                    setError('');
                                }}
                                onKeyPress={handleKeyPress}
                                helperText={
                                    errors.username?.message ||
                                    (username.length === 0
                                        ? "Ingrese al menos 2 caracteres"
                                        : username.length === 1
                                            ? "Falta 1 carácter más"
                                            : "✓ Iniciales válidas")
                                }
                                error={!!errors.username || username.length === 1}
                                inputProps={{ maxLength: 4 }}
                                sx={{ mb: 2 }}
                                autoFocus
                            />
                        )}
                    />

                    <Controller
                        name="password"
                        control={control}
                        rules={{
                            required: 'La contraseña es requerida'
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Contraseña"
                                type={showPassword ? 'text' : 'password'}
                                variant="outlined"
                                placeholder="Ingresa tu contraseña"
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                onKeyPress={handleKeyPress}
                                onChange={(e) => {
                                    field.onChange(e);
                                    setError('');
                                }}
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
                        )}
                    />

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={username.length < 2 || !password || loading}
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
                </form>

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