import { useEffect, useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, IconButton, InputAdornment, MenuItem, Select, FormControl, FormHelperText } from '@mui/material';
import { Timer, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import userService from '../api/UserService';
import areaService from '../api/AreaService';

export const RegisterPage = () => {
    const navigate = useNavigate();
    const { handleSubmit, control, watch, formState: { errors } } = useForm({
        defaultValues: { username: '', name: '', lname: '', area: '', password: '', confirmPassword: '' }
    });
    const [areas, setAreas] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const username = watch('username');
    const password = watch('password');

    useEffect(() => {
        areaService.getAll().then(setAreas).catch(() => setError('Error de conexión con el servidor'));
    }, []);

    const onSubmit = async (data) => {
        setLoading(true);
        setError('');
        try {
            await userService.register({
                name: data.name.trim(),
                lname: data.lname.trim(),
                username: data.username,
                area: data.area,
                password: data.password
            });
            setSuccess('Usuario registrado exitosamente. Redirigiendo...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const FieldLabel = ({ children }) => (
        <Typography variant="subtitle2" sx={{ mb: 0.5, color: '#626F86' }}>
            {children}
        </Typography>
    );

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: '#FAFBFC', p: 2,
        }}>
            <Box sx={{ width: '100%', maxWidth: 440 }}>
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
                        Crear cuenta
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#626F86' }}>
                        Regístrate en TimeTracker
                    </Typography>
                </Box>

                <Paper sx={{ p: 4 }}>
                    {error && (
                        <Alert severity="error" sx={{
                            mb: 2.5, borderRadius: 1,
                            bgcolor: '#FFEBE6', color: '#BF2600',
                            '& .MuiAlert-icon': { color: '#DE350B' },
                        }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{
                            mb: 2.5, borderRadius: 1,
                            bgcolor: '#E3FCEF', color: '#006644',
                            '& .MuiAlert-icon': { color: '#36B37E' },
                        }}>
                            {success}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <FieldLabel>INICIALES</FieldLabel>
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
                                    fullWidth placeholder="Ej: FG"
                                    onChange={(e) => { field.onChange(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase()); setError(''); }}
                                    error={!!errors.username}
                                    helperText={errors.username?.message}
                                    inputProps={{ maxLength: 4 }}
                                    sx={{ mb: 2 }}
                                    autoFocus
                                />
                            )}
                        />

                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <FieldLabel>NOMBRE</FieldLabel>
                                <Controller
                                    name="name"
                                    control={control}
                                    rules={{ required: 'Requerido', validate: v => v.trim() !== '' || 'No puede estar vacío' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field} fullWidth placeholder="Fernando"
                                            error={!!errors.name} helperText={errors.name?.message}
                                            onChange={(e) => { field.onChange(e); setError(''); }}
                                        />
                                    )}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <FieldLabel>APELLIDO</FieldLabel>
                                <Controller
                                    name="lname"
                                    control={control}
                                    rules={{ required: 'Requerido', validate: v => v.trim() !== '' || 'No puede estar vacío' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field} fullWidth placeholder="García"
                                            error={!!errors.lname} helperText={errors.lname?.message}
                                            onChange={(e) => { field.onChange(e); setError(''); }}
                                        />
                                    )}
                                />
                            </Box>
                        </Box>

                        <FieldLabel>ÁREA</FieldLabel>
                        <Controller
                            name="area"
                            control={control}
                            rules={{ required: 'El área es requerida' }}
                            render={({ field }) => (
                                <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.area}>
                                    <Select
                                        {...field}
                                        displayEmpty
                                        onChange={(e) => { field.onChange(e); setError(''); }}
                                        renderValue={(v) => {
                                            if (!v) return <Typography sx={{ color: '#A5ADBA' }}>Selecciona un área</Typography>;
                                            return areas?.find(a => a._id === v)?.name || v;
                                        }}
                                    >
                                        {areas?.map((area) => (
                                            <MenuItem key={area._id} value={area._id}>{area.name}</MenuItem>
                                        ))}
                                    </Select>
                                    {errors.area && <FormHelperText>{errors.area.message}</FormHelperText>}
                                </FormControl>
                            )}
                        />

                        <FieldLabel>CONTRASEÑA</FieldLabel>
                        <Controller
                            name="password"
                            control={control}
                            rules={{ required: 'Requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } }}
                            render={({ field }) => (
                                <TextField
                                    {...field} fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Mínimo 6 caracteres"
                                    error={!!errors.password} helperText={errors.password?.message}
                                    sx={{ mb: 2 }}
                                    onChange={(e) => { field.onChange(e); setError(''); }}
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

                        <FieldLabel>CONFIRMAR CONTRASEÑA</FieldLabel>
                        <Controller
                            name="confirmPassword"
                            control={control}
                            rules={{ required: 'Confirma tu contraseña', validate: v => v === password || 'No coinciden' }}
                            render={({ field }) => (
                                <TextField
                                    {...field} fullWidth
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Repite tu contraseña"
                                    error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message}
                                    sx={{ mb: 3 }}
                                    onChange={(e) => { field.onChange(e); setError(''); }}
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                                                        {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }
                                    }}
                                />
                            )}
                        />

                        <Button
                            fullWidth type="submit" variant="contained"
                            disabled={loading || username.length < 2}
                            sx={{ py: 1, fontSize: '0.875rem', fontWeight: 600, mb: 2 }}
                        >
                            {loading ? 'Registrando...' : 'Crear cuenta'}
                        </Button>
                    </form>

                    <Box sx={{ textAlign: 'center' }}>
                        <Button variant="text" onClick={() => navigate('/login')}
                            sx={{ color: 'primary.main', fontSize: '0.8125rem' }}
                        >
                            ¿Ya tienes cuenta? Inicia sesión
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};
