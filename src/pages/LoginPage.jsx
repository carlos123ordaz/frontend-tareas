import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, IconButton, InputAdornment } from '@mui/material';
import { Timer, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import userService from '../api/UserService';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { handleSubmit, control, watch, formState: { errors } } = useForm({
        defaultValues: { username: '', password: '' }
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
        if (e.key === 'Enter') handleSubmit(onSubmit)();
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#FAFBFC',
            p: 2,
        }}>
            <Box sx={{ width: '100%', maxWidth: 400 }}>
                {/* Brand */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{
                        width: 48, height: 48, borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0052CC 0%, #4C9AFF 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <Timer sx={{ fontSize: 28, color: '#fff' }} />
                    </Box>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#172B4D', mb: 0.5 }}>
                        TimeTracker
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#626F86' }}>
                        Inicia sesión para continuar
                    </Typography>
                </Box>

                <Paper sx={{ p: 4 }}>
                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 2.5, borderRadius: 1,
                                bgcolor: '#FFEBE6', color: '#BF2600',
                                '& .MuiAlert-icon': { color: '#DE350B' },
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5, color: '#626F86' }}>
                            INICIALES
                        </Typography>
                        <Controller
                            name="username"
                            control={control}
                            rules={{
                                required: 'Las iniciales son requeridas',
                                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                                maxLength: { value: 4, message: 'Máximo 4 caracteres' }
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    fullWidth
                                    placeholder="Ej: FG"
                                    onChange={(e) => {
                                        field.onChange(e.target.value.toUpperCase());
                                        setError('');
                                    }}
                                    onKeyPress={handleKeyPress}
                                    error={!!errors.username}
                                    helperText={errors.username?.message}
                                    inputProps={{ maxLength: 4 }}
                                    sx={{ mb: 2.5 }}
                                    autoFocus
                                />
                            )}
                        />

                        <Typography variant="subtitle2" sx={{ mb: 0.5, color: '#626F86' }}>
                            CONTRASEÑA
                        </Typography>
                        <Controller
                            name="password"
                            control={control}
                            rules={{ required: 'La contraseña es requerida' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Ingresa tu contraseña"
                                    error={!!errors.password}
                                    helperText={errors.password?.message}
                                    onKeyPress={handleKeyPress}
                                    onChange={(e) => { field.onChange(e); setError(''); }}
                                    sx={{ mb: 3 }}
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }
                                    }}
                                />
                            )}
                        />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            disabled={username.length < 2 || !password || loading}
                            sx={{ py: 1, fontSize: '0.875rem', fontWeight: 600, mb: 2 }}
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                        </Button>
                    </form>

                    <Box sx={{ textAlign: 'center' }}>
                        <Button
                            variant="text"
                            onClick={() => navigate('/register')}
                            sx={{ color: 'primary.main', fontSize: '0.8125rem' }}
                        >
                            ¿No tienes cuenta? Regístrate
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};
