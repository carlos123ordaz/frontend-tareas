import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Button,
    Typography,
    FormControl,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Menu,
    MenuItem as MenuItemComponent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    TextField,
    List,
    ListItem,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    PlayArrow,
    Stop,
    Pause,
    MoreVert,
    Delete,
    History,
    Add,
    Settings,
    Close,
} from '@mui/icons-material';
import { CONFIG } from '../config';

export const TimerPage = () => {
    const [tareasDisponibles, setTareasDisponibles] = useState([]);
    const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
    const [entradaActiva, setEntradaActiva] = useState(null);
    const [tiempoActual, setTiempoActual] = useState(0);
    const [historial, setHistorial] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [entradaSeleccionada, setEntradaSeleccionada] = useState(null);
    const [dialogTarea, setDialogTarea] = useState(false);
    const [dialogGestionTareas, setDialogGestionTareas] = useState(false);
    const [nuevaTarea, setNuevaTarea] = useState({ nombre: '', color: '#607D8B' });
    const userId = localStorage.getItem('token');
    const fechaHoy = new Date().toISOString().split('T')[0];

    useEffect(() => {
        cargarTareas();
        cargarEntradaActiva();
        cargarHistorial();
    }, []);

    useEffect(() => {
        let intervalo;
        if (entradaActiva?.estado === 'activo') {
            intervalo = setInterval(() => {
                calcularTiempoActual(entradaActiva);
            }, 1000);
        }
        return () => {
            if (intervalo) clearInterval(intervalo);
        };
    }, [entradaActiva]);

    useEffect(() => {
        if (entradaActiva?.estado === 'activo') {
            return;
        }
        if (tareaSeleccionada) {
            const entradaPausada = historial.find(
                e => e.taskId === tareaSeleccionada && e.estado === 'pausado'
            );

            if (entradaPausada) {
                setTiempoActual(entradaPausada.duracionTotal);
            } else {
                setTiempoActual(0);
            }
        } else {
            setTiempoActual(0);
        }
    }, [tareaSeleccionada, historial, entradaActiva?.estado]);

    const cargarTareas = async () => {
        try {
            const response = await fetch(`${CONFIG.uri}/tasks/user/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setTareasDisponibles(data);
            }
        } catch (error) {
            console.error('Error al cargar tareas:', error);
        }
    };

    const cargarEntradaActiva = async () => {
        try {
            const response = await fetch(`${CONFIG.uri}/entries/active/${userId}`);
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    setEntradaActiva(data);
                    setTareaSeleccionada(data.taskId);
                    calcularTiempoActual(data);
                }
            }
        } catch (error) {
            console.error('Error al cargar entrada activa:', error);
        }
    };

    const cargarHistorial = async () => {
        try {
            const response = await fetch(`${CONFIG.uri}/entries/user/${userId}/date/${fechaHoy}`);
            if (response.ok) {
                const data = await response.json();
                setHistorial(data);
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
        }
    };

    const calcularTiempoActual = (entrada) => {
        if (!entrada) return;
        let total = 0;
        entrada.segmentos.forEach(seg => {
            const inicio = new Date(seg.inicio);
            const fin = seg.fin ? new Date(seg.fin) : new Date();
            total += Math.floor((fin - inicio) / 1000);
        });
        setTiempoActual(total);
    };

    const iniciarTimer = async () => {
        if (!tareaSeleccionada) return;

        try {
            const response = await fetch(`${CONFIG.uri}/entries/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    taskId: tareaSeleccionada,
                    fecha: fechaHoy
                })
            });

            if (response.ok) {
                const data = await response.json();
                setEntradaActiva(data.entry);
                await cargarHistorial();
            } else {
                const error = await response.json();
                alert(error.error || 'Error al iniciar timer');
            }
        } catch (error) {
            console.error('Error al iniciar:', error);
        }
    };

    const reanudarEntrada = async (entryId) => {
        try {
            const response = await fetch(`${CONFIG.uri}/entries/resume/${entryId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (response.ok) {
                const data = await response.json();
                setEntradaActiva(data.entry);
                setTareaSeleccionada(data.entry.taskId);
                await cargarHistorial();
            } else {
                const error = await response.json();
                alert(error.error || 'Error al reanudar');
            }
        } catch (error) {
            console.error('Error al reanudar:', error);
        }
    };

    const pausarTimer = async () => {
        try {
            const response = await fetch(`${CONFIG.uri}/entries/pause`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (response.ok) {
                const data = await response.json();
                setEntradaActiva(data.entry);
                await cargarHistorial();
            }
        } catch (error) {
            console.error('Error al pausar:', error);
        }
    };

    const completarTimer = async (entryId) => {
        try {
            const response = await fetch(`${CONFIG.uri}/entries/complete/${entryId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (response.ok) {
                setEntradaActiva(null);
                setTareaSeleccionada(null);
                setTiempoActual(0);
                await cargarHistorial();
            }
        } catch (error) {
            console.error('Error al completar:', error);
        }
    };

    const crearTarea = async () => {
        if (!nuevaTarea.nombre) {
            alert('Ingresa el nombre de la tarea');
            return;
        }

        try {
            const response = await fetch(`${CONFIG.uri}/tasks/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    ...nuevaTarea
                })
            });

            if (response.ok) {
                await cargarTareas();
                setDialogTarea(false);
                setNuevaTarea({ nombre: '', color: '#607D8B' });
            } else {
                const error = await response.json();
                alert(error.msg || 'Error al crear tarea');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const eliminarTarea = async (taskId) => {
        if (!window.confirm('¿Estás seguro de eliminar esta tarea? No podrás recuperarla.')) {
            return;
        }
        try {
            const response = await fetch(`${CONFIG.uri}/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await cargarTareas();
                if (tareaSeleccionada === taskId) {
                    setTareaSeleccionada(null);
                }
            }
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
        }
    };

    const eliminarEntrada = async () => {
        if (!entradaSeleccionada) return;

        try {
            const response = await fetch(`${CONFIG.uri}/entries/${entradaSeleccionada._id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await cargarHistorial();
                handleMenuClose();
                if (entradaSeleccionada.taskId === tareaSeleccionada && !entradaActiva) {
                    setTiempoActual(0);
                }
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    };

    const handleMenuClick = (event, entrada) => {
        setAnchorEl(event.currentTarget);
        setEntradaSeleccionada(entrada);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setEntradaSeleccionada(null);
    };

    const formatearTiempo = (segundos) => {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
    };

    const calcularTiempoHoy = () => {
        return historial.reduce((total, e) => total + e.duracionTotal, 0);
    };

    return (
        <>
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 300, flex: 1 }}>
                        <Select
                            value={tareaSeleccionada || ''}
                            onChange={(e) => setTareaSeleccionada(e.target.value)}
                            displayEmpty
                            disabled={entradaActiva?.estado === 'activo'}
                        >
                            <MenuItem value="" disabled>
                                <em>Seleccionar tarea...</em>
                            </MenuItem>
                            {tareasDisponibles.map((tarea) => (
                                <MenuItem key={tarea._id} value={tarea._id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: tarea.color }} />
                                        <Typography variant="body1">{tarea.nombre}</Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => setDialogTarea(true)}
                        sx={{ textTransform: 'none', minWidth: 140 }}
                    >
                        Nueva tarea
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<Settings />}
                        onClick={() => setDialogGestionTareas(true)}
                        sx={{ textTransform: 'none', minWidth: 140 }}
                    >
                        Gestionar tareas
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
                        <Typography variant="h5" fontFamily="monospace" fontWeight="700" sx={{ minWidth: 100, textAlign: 'center' }}>
                            {formatearTiempo(tiempoActual)}
                        </Typography>
                        {entradaActiva?.estado === 'activo' ? (
                            <>
                                <Button
                                    variant="contained"
                                    onClick={pausarTimer}
                                    sx={{
                                        bgcolor: '#FF9800',
                                        minWidth: 110,
                                        textTransform: 'none',
                                        boxShadow: 'none',
                                        '&:hover': { bgcolor: '#F57C00', boxShadow: 'none' }
                                    }}
                                    startIcon={<Pause />}
                                >
                                    Pausar
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => completarTimer(entradaActiva._id)}
                                    sx={{
                                        bgcolor: '#f44336',
                                        minWidth: 110,
                                        textTransform: 'none',
                                        boxShadow: 'none',
                                        '&:hover': { bgcolor: '#d32f2f', boxShadow: 'none' }
                                    }}
                                    startIcon={<Stop />}
                                >
                                    Detener
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={iniciarTimer}
                                disabled={!tareaSeleccionada}
                                sx={{
                                    bgcolor: '#03a9f4',
                                    minWidth: 120,
                                    textTransform: 'none',
                                    boxShadow: 'none',
                                    fontSize: '1rem',
                                    '&:hover': { bgcolor: '#0288d1', boxShadow: 'none' }
                                }}
                                startIcon={<PlayArrow />}
                            >
                                {historial.find(e => e.taskId === tareaSeleccionada && e.estado === 'pausado')
                                    ? 'Reanudar'
                                    : 'Iniciar'}
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Paper elevation={0} sx={{ p: 2, flex: 1, minWidth: 150, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">TIEMPO HOY</Typography>
                    <Typography variant="h5" fontWeight="700" fontFamily="monospace">
                        {formatearTiempo(calcularTiempoHoy())}
                    </Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 2, flex: 1, minWidth: 150, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">ENTRADAS</Typography>
                    <Typography variant="h5" fontWeight="700">{historial.length}</Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 2, flex: 1, minWidth: 150, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">TAREAS DISPONIBLES</Typography>
                    <Typography variant="h5" fontWeight="700">{tareasDisponibles.length}</Typography>
                </Paper>
            </Box>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight="600">Entradas de tiempo - {fechaHoy}</Typography>
                </Box>

                {historial.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <History sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">No hay entradas de tiempo registradas hoy</Typography>
                        <Typography variant="caption" color="text.secondary">Selecciona una tarea e inicia el timer</Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>TAREA</TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>ESTADO</TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>SESIONES</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>DURACIÓN</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historial.map((entrada) => (
                                    <TableRow key={entrada._id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entrada.color }} />
                                                <Typography variant="body2" fontWeight={500}>{entrada.tarea}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    label={entrada.estado}
                                                    size="small"
                                                    color={entrada.estado === 'activo' ? 'success' : entrada.estado === 'pausado' ? 'warning' : 'default'}
                                                />
                                                {entrada.estado === 'pausado' && (
                                                    <>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => reanudarEntrada(entrada._id)}
                                                            sx={{ color: '#03a9f4' }}
                                                        >
                                                            <PlayArrow fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => completarTimer(entrada._id)}
                                                            sx={{ color: '#f44336' }}
                                                        >
                                                            <Stop fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{entrada.segmentos.length}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                                                {formatearTiempo(entrada.duracionTotal)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={(e) => handleMenuClick(e, entrada)}>
                                                <MoreVert fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItemComponent onClick={eliminarEntrada}>
                    <Delete fontSize="small" sx={{ mr: 1 }} />
                    Eliminar
                </MenuItemComponent>
            </Menu>

            <Dialog open={dialogTarea} onClose={() => setDialogTarea(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Crear nueva tarea</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Nombre de la tarea"
                        value={nuevaTarea.nombre}
                        onChange={(e) => setNuevaTarea({ ...nuevaTarea, nombre: e.target.value })}
                        sx={{ mt: 2, mb: 2 }}
                        autoFocus
                    />
                    <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">Color de la tarea</Typography>
                    </Box>
                    <TextField
                        fullWidth
                        type="color"
                        value={nuevaTarea.color}
                        onChange={(e) => setNuevaTarea({ ...nuevaTarea, color: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogTarea(false)}>Cancelar</Button>
                    <Button onClick={crearTarea} variant="contained">Crear</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={dialogGestionTareas}
                onClose={() => setDialogGestionTareas(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Gestionar Tareas</Typography>
                        <IconButton onClick={() => setDialogGestionTareas(false)} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {tareasDisponibles.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                No tienes tareas creadas
                            </Typography>
                        </Box>
                    ) : (
                        <List>
                            {tareasDisponibles.map((tarea, index) => (
                                <React.Fragment key={tarea._id}>
                                    <ListItem
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                onClick={() => eliminarTarea(tarea._id)}
                                                sx={{ color: '#f44336' }}
                                            >
                                                <Delete />
                                            </IconButton>
                                        }
                                    >
                                        <Box
                                            sx={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: '50%',
                                                bgcolor: tarea.color,
                                                mr: 2
                                            }}
                                        />
                                        <ListItemText
                                            primary={tarea.nombre}
                                            secondary={`Creada el ${new Date(tarea.createdAt).toLocaleDateString('es-ES')}`}
                                        />
                                    </ListItem>
                                    {index < tareasDisponibles.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogGestionTareas(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};