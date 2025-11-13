import React, { useState, useEffect, useContext } from 'react';
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
    Collapse,
    FormControlLabel,
    Checkbox,
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
    Send,
    ExpandMore,
    ExpandLess,
    Description as DescriptionIcon,
} from '@mui/icons-material';
import { CONFIG } from '../config';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

export const TimerPage = () => {
    const [tareasDisponibles, setTareasDisponibles] = useState([]);
    const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
    const [tiempoActual, setTiempoActual] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [entradaSeleccionada, setEntradaSeleccionada] = useState(null);
    const [dialogTarea, setDialogTarea] = useState(false);
    const [dialogGestionTareas, setDialogGestionTareas] = useState(false);
    const [nuevaTarea, setNuevaTarea] = useState({ nombre: '', color: '#607D8B' });
    const [nuevaDescripcion, setNuevaDescripcion] = useState('');
    const [expandedEntries, setExpandedEntries] = useState({});
    const fechaHoy = new Date().toISOString().split('T')[0];
    const { user, entradaActiva, setEntradaActiva, historial, pausarTimer, cargarHistorial } = useContext(AuthContext);

    useEffect(() => {
        if (user) {
            cargarTareas();
            cargarEntradaActiva();
            cargarHistorial(user);
        }
    }, [user]);

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
            const response = await fetch(`${CONFIG.uri}/tasks/area/${user.area}`);
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
            const response = await fetch(`${CONFIG.uri}/entries/active/${user._id}`);
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
                    userId: user._id,
                    areaId: user.area,
                    taskId: tareaSeleccionada,
                    fecha: fechaHoy,
                    descripcion: nuevaDescripcion
                })
            });

            if (response.ok) {
                const data = await response.json();
                setEntradaActiva(data.entry);
                setNuevaDescripcion('');
                await cargarHistorial(user);
            } else {
                const error = await response.json();
                alert(error.error || 'Error al iniciar timer');
            }
        } catch (error) {
            console.error('Error al iniciar:', error);
        }
    };

    const agregarDescripcion = async () => {
        if (!nuevaDescripcion.trim() || !entradaActiva) return;

        try {
            const response = await fetch(`${CONFIG.uri}/entries/${entradaActiva._id}/description`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descripcion: nuevaDescripcion
                })
            });

            if (response.ok) {
                const data = await response.json();
                setEntradaActiva(data.entry);
                setNuevaDescripcion('');
                await cargarHistorial(user);
            } else {
                const error = await response.json();
                alert(error.error || 'Error al agregar descripción');
            }
        } catch (error) {
            console.error('Error al agregar descripción:', error);
        }
    };

    const eliminarDescripcion = async (entryId, descripcionIndex) => {
        if (!window.confirm('¿Eliminar esta descripción?')) return;

        try {
            const response = await fetch(`${CONFIG.uri}/entries/${entryId}/description`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descripcionIndex })
            });

            if (response.ok) {
                await cargarHistorial(user);
                if (entradaActiva?._id === entryId) {
                    await cargarEntradaActiva();
                }
            }
        } catch (error) {
            console.error('Error al eliminar descripción:', error);
        }
    };

    const reanudarEntrada = async (entryId) => {
        try {
            const response = await fetch(`${CONFIG.uri}/entries/resume/${entryId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id })
            });

            if (response.ok) {
                const data = await response.json();
                setEntradaActiva(data.entry);
                setTareaSeleccionada(data.entry.taskId);
                await cargarHistorial(user);
            } else {
                const error = await response.json();
                alert(error.error || 'Error al reanudar');
            }
        } catch (error) {
            console.error('Error al reanudar:', error);
        }
    };

    const completarTimer = async (entryId) => {
        try {
            const response = await fetch(`${CONFIG.uri}/entries/complete/${entryId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id })
            });

            if (response.ok) {
                setEntradaActiva(null);
                setTareaSeleccionada(null);
                setTiempoActual(0);
                await cargarHistorial(user);
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
            await axios.post(`${CONFIG.uri}/tasks/create`, {
                userId: user._id,
                areaId: user.area,
                ...nuevaTarea,
                withPause: !nuevaTarea.withPause
            });
            await cargarTareas();
            setDialogTarea(false);
            setNuevaTarea({ nombre: '', color: '#607D8B' });
        } catch (error) {
            console.log('error: ', error)
            alert(JSON.stringify(error?.response?.data?.error || 'Error interno'));
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
                await cargarHistorial(user);
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

    const toggleExpandEntry = (entryId) => {
        setExpandedEntries(prev => ({
            ...prev,
            [entryId]: !prev[entryId]
        }));
    };

    const formatearTiempo = (segundos) => {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
    };

    const formatearHora = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calcularTiempoHoy = () => {
        return historial.reduce((total, e) => total + e.duracionTotal, 0);
    };
    return (
        <>
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 300, flex: 1 }}>
                        <TextField
                            placeholder='¿Qué estás trabajando?'
                            value={nuevaDescripcion}
                            onChange={(e) => setNuevaDescripcion(e.target.value)}
                            disabled={!entradaActiva && !tareaSeleccionada}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    if (entradaActiva) {
                                        agregarDescripcion();
                                    } else {
                                        iniciarTimer();
                                    }
                                }
                            }}
                            multiline
                            maxRows={3}
                        />
                    </FormControl>
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
                    {
                        user && user.esLider && (
                            <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={() => setDialogTarea(true)}
                                sx={{ textTransform: 'none', minWidth: 140 }}
                            >
                                Nueva tarea
                            </Button>
                        )
                    }
                    {
                        user && user.esLider && (
                            <Button
                                variant="outlined"
                                startIcon={<Settings />}
                                onClick={() => setDialogGestionTareas(true)}
                                sx={{ textTransform: 'none', minWidth: 140 }}
                            >
                                Gestionar tareas
                            </Button>
                        )
                    }
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
                        <Typography variant="h5" fontFamily="monospace" fontWeight="700" sx={{ minWidth: 100, textAlign: 'center' }}>
                            {formatearTiempo(tiempoActual)}
                        </Typography>
                        {entradaActiva?.estado === 'activo' ? (
                            <>
                                {nuevaDescripcion.trim() && (
                                    <Button
                                        variant="outlined"
                                        onClick={agregarDescripcion}
                                        sx={{
                                            minWidth: 110,
                                            textTransform: 'none',
                                        }}
                                        startIcon={<Send />}
                                    >
                                        Agregar nota
                                    </Button>
                                )}
                                <Button
                                    variant="contained"
                                    onClick={() => pausarTimer(user)}
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

                {/* Mostrar descripciones de la entrada activa */}
                {entradaActiva && entradaActiva.descripciones && entradaActiva.descripciones.length > 0 && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Notas de esta sesión:
                        </Typography>
                        {entradaActiva.descripciones.map((desc, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                <Typography variant="caption" color="primary" sx={{ minWidth: 45, fontWeight: 600 }}>
                                    {formatearHora(desc.timestamp)}
                                </Typography>
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                    {desc.texto}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => eliminarDescripcion(entradaActiva._id, idx)}
                                    sx={{ color: 'text.secondary', p: 0.5 }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                )}
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
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>NOTAS</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>DURACIÓN</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historial.map((entrada) => (
                                    <React.Fragment key={entrada._id}>
                                        <TableRow hover>
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
                                            <TableCell>
                                                {entrada.descripciones && entrada.descripciones.length > 0 ? (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => toggleExpandEntry(entrada._id)}
                                                    >
                                                        <DescriptionIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                        <Typography variant="caption">
                                                            {entrada.descripciones.length}
                                                        </Typography>
                                                        {expandedEntries[entrada._id] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                                    </IconButton>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">-</Typography>
                                                )}
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
                                        {entrada.descripciones && entrada.descripciones.length > 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} sx={{ py: 0, px: 0, borderBottom: expandedEntries[entrada._id] ? '1px solid' : 'none', borderColor: 'divider' }}>
                                                    <Collapse in={expandedEntries[entrada._id]} timeout="auto" unmountOnExit>
                                                        <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                                                Historial de notas:
                                                            </Typography>
                                                            {entrada.descripciones.map((desc, idx) => (
                                                                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                                                    <Typography variant="caption" color="primary" sx={{ minWidth: 45, fontWeight: 600 }}>
                                                                        {formatearHora(desc.timestamp)}
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ flex: 1 }}>
                                                                        {desc.texto}
                                                                    </Typography>
                                                                    {entrada.estado !== 'completado' && (
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => eliminarDescripcion(entrada._id, idx)}
                                                                            sx={{ color: 'text.secondary', p: 0.5 }}
                                                                        >
                                                                            <Delete fontSize="small" />
                                                                        </IconButton>
                                                                    )}
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
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
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={nuevaTarea.withPause || false}
                                onChange={(e) =>
                                    setNuevaTarea({ ...nuevaTarea, withPause: e.target.checked })
                                }
                            />
                        }
                        label="No pausar automáticamente"
                        sx={{ mt: 2 }}
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