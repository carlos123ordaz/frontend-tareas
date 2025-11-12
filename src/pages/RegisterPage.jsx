import { useEffect, useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, IconButton, InputAdornment, MenuItem, Select, FormControl, InputLabel, FormHelperText } from '@mui/material';
import { PersonAdd, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import userService from '../api/UserService';
import areaService from '../api/AreaService';

export const RegisterPage = () => {
    const navigate = useNavigate();
    const { handleSubmit, control, watch, formState: { errors } } = useForm({
        defaultValues: {
            username: '',
            name: '',
            lname: '',
            area: '',
            password: '',
            confirmPassword: ''
        }
    });
    const [areas, setAreas] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const username = watch('username');
    const password = watch('password');
    const getAreas = async () => {
        try {
            const response = await areaService.getAll();
            setAreas(response);
        } catch (error) {
            setError('Error de conexión con el servidor');
        }
    }
    useEffect(() => {
        getAreas();
    }, []);
    const onSubmit = async (data) => {
        setLoading(true);
        setError('');
        try {
            const formData = {
                name: data.name.trim(),
                lname: data.lname.trim(),
                username: data.username,
                area: data.area,
                password: data.password
            }
            await userService.register(formData);
            setSuccess('Usuario registrado exitosamente. Redirigiendo al login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
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
                                    const value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                                    field.onChange(value);
                                    setError('');
                                }}
                                helperText={
                                    errors.username?.message ||
                                    (username.length === 0
                                        ? "Ingrese las iniciales de su nombre y apellido"
                                        : username.length === 1
                                            ? "Falta 1 carácter más"
                                            : "✓ Iniciales válidas")
                                }
                                error={!!errors.username || username.length === 1}
                                inputProps={{ maxLength: 4 }}
                                sx={{ mb: 2 }}
                                required
                                autoFocus
                            />
                        )}
                    />

                    <Controller
                        name="name"
                        control={control}
                        rules={{
                            required: 'El nombre es requerido',
                            validate: (value) => value.trim() !== '' || 'El nombre no puede estar vacío'
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Nombre(s)"
                                variant="outlined"
                                placeholder="Ej: Fernando"
                                error={!!errors.name}
                                helperText={errors.name?.message}
                                sx={{ mb: 2 }}
                                required
                                onChange={(e) => {
                                    field.onChange(e);
                                    setError('');
                                }}
                            />
                        )}
                    />

                    <Controller
                        name="lname"
                        control={control}
                        rules={{
                            required: 'El apellido es requerido',
                            validate: (value) => value.trim() !== '' || 'El apellido no puede estar vacío'
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Apellido(s)"
                                variant="outlined"
                                placeholder="Ej: García"
                                error={!!errors.lname}
                                helperText={errors.lname?.message}
                                sx={{ mb: 2 }}
                                required
                                onChange={(e) => {
                                    field.onChange(e);
                                    setError('');
                                }}
                            />
                        )}
                    />

                    <Controller
                        name="area"
                        control={control}
                        rules={{
                            required: 'El área es requerida'
                        }}
                        render={({ field }) => (
                            <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.area}>
                                <InputLabel>Área</InputLabel>
                                <Select
                                    {...field}
                                    label="Área"
                                    onChange={(e) => {
                                        field.onChange(e);
                                        setError('');
                                    }}
                                >
                                    {
                                        areas?.map((area) => (
                                            <MenuItem key={area._id} value={area._id}>{area.name}</MenuItem>
                                        ))
                                    }
                                </Select>
                                {errors.area && (
                                    <FormHelperText>{errors.area.message}</FormHelperText>
                                )}
                            </FormControl>
                        )}
                    />

                    <Controller
                        name="password"
                        control={control}
                        rules={{
                            required: 'La contraseña es requerida',
                            minLength: {
                                value: 6,
                                message: 'La contraseña debe tener al menos 6 caracteres'
                            }
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Contraseña"
                                type={showPassword ? 'text' : 'password'}
                                variant="outlined"
                                placeholder="Mínimo 6 caracteres"
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                sx={{ mb: 2 }}
                                required
                                onChange={(e) => {
                                    field.onChange(e);
                                    setError('');
                                }}
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

                    <Controller
                        name="confirmPassword"
                        control={control}
                        rules={{
                            required: 'Confirma tu contraseña',
                            validate: (value) => value === password || 'Las contraseñas no coinciden'
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Confirmar Contraseña"
                                type={showConfirmPassword ? 'text' : 'password'}
                                variant="outlined"
                                placeholder="Repite tu contraseña"
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword?.message}
                                sx={{ mb: 3 }}
                                required
                                onChange={(e) => {
                                    field.onChange(e);
                                    setError('');
                                }}
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
                        )}
                    />

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading || username.length < 2}
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
                </form>

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