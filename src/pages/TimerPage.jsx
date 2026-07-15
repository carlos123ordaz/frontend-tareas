import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Paper, Button, Typography, FormControl, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Menu, MenuItem as MenuItemComponent,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, TextField, List, ListItem, ListItemText, Divider, Collapse,
    FormControlLabel, Checkbox, Tooltip,
} from '@mui/material';
import {
    PlayArrow, Stop, Pause, MoreVert, Delete, History, Add, Settings,
    Close, Send, ExpandMore, ExpandLess, Description as DescriptionIcon, OpenInFull,
} from '@mui/icons-material';
import { CONFIG } from '../config';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';
import { invoke } from '@tauri-apps/api/core';

export const TimerPage = () => {
    const [tareasDisponibles, setTareasDisponibles] = useState([]);
    const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
    const [tiempoActual, setTiempoActual] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [entradaSeleccionada, setEntradaSeleccionada] = useState(null);
    const [dialogTarea, setDialogTarea] = useState(false);
    const [dialogGestionTareas, setDialogGestionTareas] = useState(false);
    const [nuevaTarea, setNuevaTarea] = useState({ nombre: '', color: '#0052CC' });
    const [nuevaDescripcion, setNuevaDescripcion] = useState('');
    const [expandedEntries, setExpandedEntries] = useState({});
    const [modoMini, setModoMini] = useState(() => localStorage.getItem('modoMini') === 'true');
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
            intervalo = setInterval(() => calcularTiempoActual(entradaActiva), 1000);
        }
        return () => { if (intervalo) clearInterval(intervalo); };
    }, [entradaActiva]);

    useEffect(() => {
        if (entradaActiva?.estado === 'activo') return;
        if (tareaSeleccionada) {
            const entradaPausada = historial.find(e => e.taskId === tareaSeleccionada && e.estado === 'pausado');
            setTiempoActual(entradaPausada ? entradaPausada.duracionTotal : 0);
        } else {
            setTiempoActual(0);
        }
    }, [tareaSeleccionada, historial, entradaActiva?.estado]);

    useEffect(() => {
        if (!modoMini) return;
        invoke('set_mini_mode', { enabled: true }).catch(console.error);
    }, [modoMini]);

    const cargarTareas = async () => {
        try {
            const response = await fetch(`${CONFIG.uri}/tasks/area/${user.area}`);
            if (response.ok) setTareasDisponibles(await response.json());
        } catch (error) { console.error('Error al cargar tareas:', error); }
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
        } catch (error) { console.error('Error al cargar entrada activa:', error); }
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
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id, areaId: user.area, taskId: tareaSeleccionada, fecha: fechaHoy, descripcion: nuevaDescripcion })
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
        } catch (error) { console.error('Error al iniciar:', error); }
    };

    const agregarDescripcion = async () => {
        if (!nuevaDescripcion.trim() || !entradaActiva) return;
        try {
            const response = await fetch(`${CONFIG.uri}/entries/${entradaActiva._id}/description`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descripcion: nuevaDescripcion })
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
        } catch (error) { console.error('Error al agregar descripción:', error); }
    };

    const eliminarDescripcion = async (entryId, descripcionIndex) => {
        if (!window.confirm('¿Eliminar esta descripción?')) return;
        try {
            const response = await fetch(`${CONFIG.uri}/entries/${entryId}/description`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descripcionIndex })
            });
            if (response.ok) {
                await cargarHistorial(user);
                if (entradaActiva?._id === entryId) await cargarEntradaActiva();
            }
        } catch (error) { console.error('Error al eliminar descripción:', error); }
    };

    const reanudarEntrada = async (entryId) => {
        try {
            const response = await fetch(`${CONFIG.uri}/entries/resume/${entryId}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        } catch (error) { console.error('Error al reanudar:', error); }
    };

    const completarTimer = async (entryId) => {
        try {
            const response = await fetch(`${CONFIG.uri}/entries/complete/${entryId}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id })
            });
            if (response.ok) {
                setEntradaActiva(null);
                setTareaSeleccionada(null);
                setTiempoActual(0);
                await cargarHistorial(user);
            }
        } catch (error) { console.error('Error al completar:', error); }
    };

    const crearTarea = async () => {
        if (!nuevaTarea.nombre) { alert('Ingresa el nombre de la tarea'); return; }
        try {
            await axios.post(`${CONFIG.uri}/tasks/create`, {
                userId: user._id, areaId: user.area, ...nuevaTarea, withPause: !nuevaTarea.withPause
            });
            await cargarTareas();
            setDialogTarea(false);
            setNuevaTarea({ nombre: '', color: '#0052CC' });
        } catch (error) { alert(JSON.stringify(error?.response?.data?.error || 'Error interno')); }
    };

    const eliminarTarea = async (taskId) => {
        if (!window.confirm('¿Estás seguro de eliminar esta tarea?')) return;
        try {
            const response = await fetch(`${CONFIG.uri}/tasks/${taskId}`, { method: 'DELETE' });
            if (response.ok) {
                await cargarTareas();
                if (tareaSeleccionada === taskId) setTareaSeleccionada(null);
            }
        } catch (error) { console.error('Error al eliminar tarea:', error); }
    };

    const eliminarEntrada = async () => {
        if (!entradaSeleccionada) return;
        try {
            const response = await fetch(`${CONFIG.uri}/entries/${entradaSeleccionada._id}`, { method: 'DELETE' });
            if (response.ok) {
                await cargarHistorial(user);
                handleMenuClose();
                if (entradaSeleccionada.taskId === tareaSeleccionada && !entradaActiva) setTiempoActual(0);
            }
        } catch (error) { console.error('Error al eliminar:', error); }
    };

    const handleMenuClick = (event, entrada) => { setAnchorEl(event.currentTarget); setEntradaSeleccionada(entrada); };
    const handleMenuClose = () => { setAnchorEl(null); setEntradaSeleccionada(null); };
    const toggleExpandEntry = (entryId) => setExpandedEntries(prev => ({ ...prev, [entryId]: !prev[entryId] }));

    const formatearTiempo = (segundos) => {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
    };

    const formatearHora = (timestamp) => new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const calcularTiempoHoy = () => historial.reduce((total, e) => total + e.duracionTotal, 0);

    const actualizarModoMini = async (enabled) => {
        try {
            await invoke('set_mini_mode', { enabled });
            localStorage.setItem('modoMini', String(enabled));
            setModoMini(enabled);
            window.dispatchEvent(new Event('mini-mode-changed'));
        } catch (error) { console.error('Error al cambiar modo mini:', error); alert('No se pudo cambiar al modo mini'); }
    };

    // Status chip styles following Atlassian lozenge pattern
    const getStatusProps = (estado) => {
        switch (estado) {
            case 'activo': return { label: 'En progreso', sx: { bgcolor: '#DEEBFF', color: '#0747A6', fontWeight: 700 } };
            case 'pausado': return { label: 'Pausado', sx: { bgcolor: '#FFF0B3', color: '#FF8B00', fontWeight: 700 } };
            case 'completado': return { label: 'Completado', sx: { bgcolor: '#E3FCEF', color: '#006644', fontWeight: 700 } };
            default: return { label: estado, sx: {} };
        }
    };

    if (modoMini) {
        const tareaActual = tareasDisponibles.find(t => t._id === tareaSeleccionada);
        const estaActivo = entradaActiva?.estado === 'activo';
        const estaPausado = historial.find(e => e.taskId === tareaSeleccionada && e.estado === 'pausado');

        return (
            <Box sx={{
                height: 'calc(100vh - 16px)', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: '8px',
                border: '1px solid', borderColor: 'divider',
                overflow: 'hidden',
                userSelect: 'none',
            }}>
                {/* Zona central — tiempo + tarea */}
                <Box sx={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    position: 'relative', px: 1,
                }}>
                    <Tooltip title="Vista completa">
                        <IconButton size="small" onClick={() => actualizarModoMini(false)}
                            sx={{ position: 'absolute', top: 4, right: 4, p: 0.25, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                            <OpenInFull sx={{ fontSize: 11 }} />
                        </IconButton>
                    </Tooltip>

                    {/* Tarea */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                        {tareaActual && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tareaActual.color, flexShrink: 0 }} />}
                        <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', fontWeight: 500, maxWidth: 120 }} noWrap>
                            {tareaActual?.nombre || 'Sin tarea'}
                        </Typography>
                    </Box>

                    {/* Tiempo */}
                    <Typography fontFamily="'SF Mono', 'Fira Code', monospace" fontWeight="700"
                        sx={{
                            fontSize: '1.75rem', lineHeight: 1, letterSpacing: 2,
                            color: estaActivo ? 'primary.main' : 'text.primary',
                        }}>
                        {formatearTiempo(tiempoActual)}
                    </Typography>

                    {/* Estado */}
                    {(estaActivo || estaPausado) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.375, mt: 0.375 }}>
                            <Box sx={{
                                width: 5, height: 5, borderRadius: '50%',
                                bgcolor: estaActivo ? '#36B37E' : '#FF991F',
                                ...(estaActivo && {
                                    animation: 'pulse 1.5s infinite',
                                    '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
                                }),
                            }} />
                            <Typography sx={{
                                fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                                color: estaActivo ? '#36B37E' : '#FF991F',
                            }}>
                                {estaActivo ? 'Activo' : 'Pausado'}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Botones */}
                <Box sx={{ px: 0.5, pb: 0.5, display: 'flex', gap: 0.5 }}>
                    {estaActivo ? (
                        <>
                            <IconButton onClick={() => pausarTimer(user)} size="small"
                                sx={{ flex: 1, borderRadius: 1, bgcolor: '#FF991F', color: '#fff', height: 26, '&:hover': { bgcolor: '#FF8B00' } }}>
                                <Pause sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton onClick={() => completarTimer(entradaActiva._id)} size="small"
                                sx={{ borderRadius: 1, bgcolor: '#DE350B', color: '#fff', height: 26, width: 30, '&:hover': { bgcolor: '#BF2600' } }}>
                                <Stop sx={{ fontSize: 16 }} />
                            </IconButton>
                        </>
                    ) : (
                        <IconButton onClick={iniciarTimer} disabled={!tareaSeleccionada} size="small"
                            sx={{ flex: 1, borderRadius: 1, bgcolor: 'primary.main', color: '#fff', height: 26,
                                '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'text.disabled' } }}>
                            <PlayArrow sx={{ fontSize: 16 }} />
                        </IconButton>
                    )}
                </Box>
            </Box>
        );
    }

    return (
        <>
            {/* Timer control bar */}
            <Paper sx={{ p: 2.5, mb: 2.5 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 280, flex: 1 }}>
                        <TextField
                            placeholder='¿En qué estás trabajando?'
                            value={nuevaDescripcion}
                            onChange={(e) => setNuevaDescripcion(e.target.value)}
                            disabled={!entradaActiva && !tareaSeleccionada}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    entradaActiva ? agregarDescripcion() : iniciarTimer();
                                }
                            }}
                            multiline maxRows={3}
                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.default' } }}
                        />
                    </FormControl>

                    <FormControl sx={{ minWidth: 240 }}>
                        <Select
                            value={tareaSeleccionada || ''} onChange={(e) => setTareaSeleccionada(e.target.value)}
                            displayEmpty disabled={entradaActiva?.estado === 'activo'}
                            sx={{ bgcolor: 'background.default' }}
                        >
                            <MenuItem value="" disabled><em>Seleccionar tarea...</em></MenuItem>
                            {tareasDisponibles.map((tarea) => (
                                <MenuItem key={tarea._id} value={tarea._id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: tarea.color }} />
                                        <Typography variant="body2">{tarea.nombre}</Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {user?.esLider && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Nueva tarea">
                                <Button variant="outlined" size="small" onClick={() => setDialogTarea(true)}
                                    sx={{ minWidth: 'auto', px: 1 }}>
                                    <Add fontSize="small" />
                                </Button>
                            </Tooltip>
                            <Tooltip title="Gestionar tareas">
                                <Button variant="outlined" size="small" onClick={() => setDialogGestionTareas(true)}
                                    sx={{ minWidth: 'auto', px: 1 }}>
                                    <Settings fontSize="small" />
                                </Button>
                            </Tooltip>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
                        <Box sx={{
                            px: 2, py: 0.75, borderRadius: 1,
                            bgcolor: entradaActiva?.estado === 'activo' ? '#DEEBFF' : 'background.default',
                            border: '1px solid',
                            borderColor: entradaActiva?.estado === 'activo' ? '#4C9AFF' : 'divider',
                        }}>
                            <Typography variant="h5" fontFamily="'SF Mono', 'Fira Code', monospace" fontWeight="700"
                                sx={{ minWidth: 90, textAlign: 'center', color: entradaActiva?.estado === 'activo' ? '#0052CC' : 'text.primary' }}>
                                {formatearTiempo(tiempoActual)}
                            </Typography>
                        </Box>

                        {entradaActiva?.estado === 'activo' ? (
                            <>
                                {nuevaDescripcion.trim() && (
                                    <Tooltip title="Agregar nota">
                                        <Button variant="outlined" onClick={agregarDescripcion} size="small"
                                            sx={{ minWidth: 'auto', px: 1.5 }}>
                                            <Send fontSize="small" />
                                        </Button>
                                    </Tooltip>
                                )}
                                <Button variant="contained" onClick={() => pausarTimer(user)}
                                    sx={{ bgcolor: '#FF991F', '&:hover': { bgcolor: '#FF8B00' } }}
                                    startIcon={<Pause />}>
                                    Pausar
                                </Button>
                                <Button variant="contained" onClick={() => completarTimer(entradaActiva._id)}
                                    sx={{ bgcolor: '#DE350B', '&:hover': { bgcolor: '#BF2600' } }}
                                    startIcon={<Stop />}>
                                    Detener
                                </Button>
                            </>
                        ) : (
                            <Button variant="contained" onClick={iniciarTimer} disabled={!tareaSeleccionada}
                                startIcon={<PlayArrow />}>
                                {historial.find(e => e.taskId === tareaSeleccionada && e.estado === 'pausado') ? 'Reanudar' : 'Iniciar'}
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Active session notes */}
                {entradaActiva?.descripciones?.length > 0 && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#DEEBFF', borderRadius: 1, border: '1px solid #B3D4FF' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#0747A6' }}>
                            NOTAS DE SESIÓN
                        </Typography>
                        {entradaActiva.descripciones.map((desc, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
                                <Typography variant="caption" sx={{ minWidth: 42, fontWeight: 700, color: '#0052CC' }}>
                                    {formatearHora(desc.timestamp)}
                                </Typography>
                                <Typography variant="body2" sx={{ flex: 1, color: '#172B4D' }}>{desc.texto}</Typography>
                                <IconButton size="small" onClick={() => eliminarDescripcion(entradaActiva._id, idx)}
                                    sx={{ p: 0.25, color: '#626F86' }}>
                                    <Delete sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>

            {/* Stats row */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                {[
                    { label: 'TIEMPO HOY', value: formatearTiempo(calcularTiempoHoy()), mono: true, accent: '#0052CC' },
                    { label: 'ENTRADAS', value: historial.length, accent: '#36B37E' },
                    { label: 'TAREAS', value: tareasDisponibles.length, accent: '#6554C0' },
                ].map((stat) => (
                    <Paper key={stat.label} sx={{ p: 2, flex: 1, minWidth: 140 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{stat.label}</Typography>
                        <Typography variant="h5" fontWeight="700"
                            sx={{ fontFamily: stat.mono ? "'SF Mono', 'Fira Code', monospace" : 'inherit', color: stat.accent }}>
                            {stat.value}
                        </Typography>
                    </Paper>
                ))}
            </Box>

            {/* Entries table */}
            <Paper sx={{ overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight={600}>Entradas de hoy</Typography>
                    <Typography variant="caption" color="text.secondary">{fechaHoy}</Typography>
                </Box>

                {historial.length === 0 ? (
                    <Box sx={{ p: 5, textAlign: 'center' }}>
                        <History sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Sin entradas registradas
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            Selecciona una tarea e inicia el timer
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>TAREA</TableCell>
                                    <TableCell>ESTADO</TableCell>
                                    <TableCell>SESIONES</TableCell>
                                    <TableCell>NOTAS</TableCell>
                                    <TableCell align="right">DURACIÓN</TableCell>
                                    <TableCell width={48}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historial.map((entrada) => {
                                    const statusProps = getStatusProps(entrada.estado);
                                    return (
                                        <React.Fragment key={entrada._id}>
                                            <TableRow>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: entrada.color, flexShrink: 0 }} />
                                                        <Typography variant="body2" fontWeight={500}>{entrada.tarea}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                        <Chip size="small" label={statusProps.label} sx={statusProps.sx} />
                                                        {entrada.estado === 'pausado' && (
                                                            <>
                                                                <Tooltip title="Reanudar">
                                                                    <IconButton size="small" onClick={() => reanudarEntrada(entrada._id)}
                                                                        sx={{ color: '#0052CC' }}>
                                                                        <PlayArrow sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Completar">
                                                                    <IconButton size="small" onClick={() => completarTimer(entrada._id)}
                                                                        sx={{ color: '#DE350B' }}>
                                                                        <Stop sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{entrada.segmentos.length}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {entrada.descripciones?.length > 0 ? (
                                                        <Button size="small" onClick={() => toggleExpandEntry(entrada._id)}
                                                            sx={{ minWidth: 'auto', color: 'text.secondary', fontSize: '0.75rem' }}
                                                            endIcon={expandedEntries[entrada._id] ? <ExpandLess sx={{ fontSize: '14px !important' }} /> : <ExpandMore sx={{ fontSize: '14px !important' }} />}>
                                                            <DescriptionIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                                            {entrada.descripciones.length}
                                                        </Button>
                                                    ) : (
                                                        <Typography variant="body2" color="text.disabled">—</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontFamily="'SF Mono', 'Fira Code', monospace" fontWeight={600}>
                                                        {formatearTiempo(entrada.duracionTotal)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton size="small" onClick={(e) => handleMenuClick(e, entrada)}>
                                                        <MoreVert sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                            {entrada.descripciones?.length > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} sx={{ py: 0, px: 0, borderBottom: expandedEntries[entrada._id] ? undefined : 'none' }}>
                                                        <Collapse in={expandedEntries[entrada._id]} timeout="auto" unmountOnExit>
                                                            <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                                                                <Typography variant="subtitle2" sx={{ mb: 1 }}>NOTAS</Typography>
                                                                {entrada.descripciones.map((desc, idx) => (
                                                                    <Box key={idx} sx={{
                                                                        display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75,
                                                                        p: 1, bgcolor: 'background.paper', borderRadius: 1,
                                                                        border: '1px solid', borderColor: 'divider',
                                                                    }}>
                                                                        <Typography variant="caption" sx={{ minWidth: 42, fontWeight: 700, color: 'primary.main' }}>
                                                                            {formatearHora(desc.timestamp)}
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ flex: 1 }}>{desc.texto}</Typography>
                                                                        {entrada.estado !== 'completado' && (
                                                                            <IconButton size="small" onClick={() => eliminarDescripcion(entrada._id, idx)}
                                                                                sx={{ p: 0.25, color: 'text.secondary' }}>
                                                                                <Delete sx={{ fontSize: 14 }} />
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
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Context menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
                PaperProps={{ sx: { minWidth: 160, borderRadius: 1 } }}>
                <MenuItemComponent onClick={eliminarEntrada} sx={{ color: 'error.main', fontSize: '0.875rem' }}>
                    <Delete fontSize="small" sx={{ mr: 1 }} /> Eliminar
                </MenuItemComponent>
            </Menu>

            {/* Create task dialog */}
            <Dialog open={dialogTarea} onClose={() => setDialogTarea(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Crear tarea</DialogTitle>
                <DialogContent>
                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, color: '#626F86' }}>NOMBRE</Typography>
                    <TextField fullWidth value={nuevaTarea.nombre} placeholder="Nombre de la tarea"
                        onChange={(e) => setNuevaTarea({ ...nuevaTarea, nombre: e.target.value })}
                        sx={{ mb: 2 }} autoFocus />
                    <Typography variant="subtitle2" sx={{ mb: 0.5, color: '#626F86' }}>COLOR</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        {['#0052CC', '#00B8D9', '#36B37E', '#FF991F', '#FF5630', '#6554C0', '#8993A4', '#172B4D'].map(c => (
                            <Box key={c} onClick={() => setNuevaTarea({ ...nuevaTarea, color: c })}
                                sx={{
                                    width: 32, height: 32, borderRadius: 1, bgcolor: c, cursor: 'pointer',
                                    border: nuevaTarea.color === c ? '2px solid #0052CC' : '2px solid transparent',
                                    outline: nuevaTarea.color === c ? '2px solid #B3D4FF' : 'none',
                                    transition: 'all 0.1s',
                                }} />
                        ))}
                    </Box>
                    <FormControlLabel
                        control={<Checkbox checked={nuevaTarea.withPause || false}
                            onChange={(e) => setNuevaTarea({ ...nuevaTarea, withPause: e.target.checked })} />}
                        label={<Typography variant="body2">No pausar automáticamente</Typography>}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogTarea(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
                    <Button onClick={crearTarea} variant="contained">Crear</Button>
                </DialogActions>
            </Dialog>

            {/* Manage tasks dialog */}
            <Dialog open={dialogGestionTareas} onClose={() => setDialogGestionTareas(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Gestionar tareas</Typography>
                        <IconButton onClick={() => setDialogGestionTareas(false)} size="small"><Close fontSize="small" /></IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {tareasDisponibles.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">No hay tareas creadas</Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {tareasDisponibles.map((tarea, index) => (
                                <React.Fragment key={tarea._id}>
                                    <ListItem secondaryAction={
                                        <Tooltip title="Eliminar">
                                            <IconButton edge="end" onClick={() => eliminarTarea(tarea._id)} sx={{ color: '#DE350B' }}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    }>
                                        <Box sx={{ width: 14, height: 14, borderRadius: 1, bgcolor: tarea.color, mr: 2, flexShrink: 0 }} />
                                        <ListItemText primary={tarea.nombre}
                                            secondary={`Creada el ${new Date(tarea.createdAt).toLocaleDateString('es-ES')}`}
                                            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                                            secondaryTypographyProps={{ fontSize: '0.75rem' }} />
                                    </ListItem>
                                    {index < tareasDisponibles.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
