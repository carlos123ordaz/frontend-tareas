import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Paper, Typography, Grid, Avatar, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, LinearProgress, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, Button, Collapse,
    List, ListItem, ListItemText, Divider, Stack, Tooltip,
} from '@mui/material';
import {
    People, Timer, Assignment, Visibility, Refresh, ExpandMore, ExpandLess,
    PlayArrow, Pause, CheckCircle, Today, ChevronLeft, ChevronRight,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { CONFIG } from '../config';
import { AuthContext } from '../contexts/AuthContext';

export const TeamDashboard = () => {
    const [actividadEquipo, setActividadEquipo] = useState([]);
    const [entradasActivas, setEntradasActivas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogDetalle, setDialogDetalle] = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [detalleUsuario, setDetalleUsuario] = useState(null);
    const [expandedUsers, setExpandedUsers] = useState({});
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
    const [rangoFechasDetalle, setRangoFechasDetalle] = useState({
        inicio: new Date().toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    });
    const { user } = useContext(AuthContext);

    useEffect(() => { cargarDatos(); }, [fechaSeleccionada]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [resActivas, resEquipo] = await Promise.all([
                fetch(`${CONFIG.uri}/entries/team/active/area/${user.area}`),
                fetch(`${CONFIG.uri}/entries/team/date/${fechaSeleccionada}/area/${user.area}`)
            ]);
            if (resActivas.ok) setEntradasActivas(await resActivas.json());
            if (resEquipo.ok) setActividadEquipo(await resEquipo.json());
        } catch (error) { console.error('Error al cargar datos:', error); }
        finally { setLoading(false); }
    };

    const verDetalleUsuario = async (usuario) => {
        try {
            setUsuarioSeleccionado(usuario);
            setDialogDetalle(true);
            const response = await fetch(`${CONFIG.uri}/entries/team/user/${usuario.entradas[0].userId._id}/range/${rangoFechasDetalle.inicio}/${rangoFechasDetalle.fin}`);
            if (response.ok) setDetalleUsuario(await response.json());
        } catch (error) { console.error('Error al cargar detalle:', error); }
    };

    const toggleExpandUser = (username) => setExpandedUsers(prev => ({ ...prev, [username]: !prev[username] }));
    const irAHoy = () => setFechaSeleccionada(new Date().toISOString().split('T')[0]);
    const irAyer = () => { const d = new Date(); d.setDate(d.getDate() - 1); setFechaSeleccionada(d.toISOString().split('T')[0]); };
    const cambiarDia = (dias) => { const d = new Date(fechaSeleccionada); d.setDate(d.getDate() + dias); setFechaSeleccionada(d.toISOString().split('T')[0]); };

    const formatearFechaLegible = (fecha) => {
        const hoy = new Date().toISOString().split('T')[0];
        if (fecha === hoy) return 'Hoy';
        const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
        if (fecha === ayer.toISOString().split('T')[0]) return 'Ayer';
        return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatearTiempo = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const formatearTiempoCorto = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };
    const formatearHora = (iso) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const calcularTiempoActivo = (entry) => {
        if (!entry.segmentos?.length) return 0;
        return entry.segmentos.reduce((total, seg) => {
            const inicio = new Date(seg.inicio);
            const fin = seg.fin ? new Date(seg.fin) : new Date();
            return total + Math.floor((fin - inicio) / 1000);
        }, 0);
    };

    const getStatusProps = (estado) => {
        switch (estado) {
            case 'activo': return { label: 'En progreso', sx: { bgcolor: '#DEEBFF', color: '#0747A6', fontWeight: 700 } };
            case 'pausado': return { label: 'Pausado', sx: { bgcolor: '#FFF0B3', color: '#FF8B00', fontWeight: 700 } };
            case 'completado': return { label: 'Completado', sx: { bgcolor: '#E3FCEF', color: '#006644', fontWeight: 700 } };
            default: return { label: estado, sx: {} };
        }
    };

    const totalTiempoEquipo = actividadEquipo.reduce((sum, u) => sum + u.tiempoTotal, 0);
    const totalEntradas = actividadEquipo.reduce((sum, u) => sum + u.entradas.length, 0);
    const esHoy = fechaSeleccionada === new Date().toISOString().split('T')[0];

    const statCards = [
        { label: esHoy ? 'ACTIVOS AHORA' : 'USUARIOS', value: esHoy ? entradasActivas.length : actividadEquipo.length, color: '#36B37E', icon: <PlayArrow /> },
        { label: 'TIEMPO TOTAL', value: formatearTiempoCorto(totalTiempoEquipo), sub: formatearTiempo(totalTiempoEquipo), color: '#0052CC', icon: <Timer /> },
        { label: 'MIEMBROS', value: actividadEquipo.length, color: '#FF991F', icon: <People /> },
        { label: 'ENTRADAS', value: totalEntradas, color: '#6554C0', icon: <Assignment /> },
    ];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={600}>Equipo</Typography>
                    <Typography variant="body2" color="text.secondary">{formatearFechaLegible(fechaSeleccionada)}</Typography>
                </Box>
                <Tooltip title="Actualizar">
                    <IconButton onClick={cargarDatos} disabled={loading} size="small"><Refresh fontSize="small" /></IconButton>
                </Tooltip>
            </Box>

            {/* Date navigation */}
            <Paper sx={{ p: 1.5, mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Stack direction="row" spacing={0.75}>
                    <Button size="small" onClick={irAHoy}
                        sx={{
                            fontSize: '0.75rem', px: 1.5,
                            ...(esHoy ? { bgcolor: '#DEEBFF', color: '#0052CC', fontWeight: 600 } : { color: 'text.secondary' }),
                        }}>
                        Hoy
                    </Button>
                    <Button size="small" onClick={irAyer} sx={{ fontSize: '0.75rem', px: 1.5, color: 'text.secondary' }}>
                        Ayer
                    </Button>
                </Stack>

                <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton size="small" onClick={() => cambiarDia(-1)}><ChevronLeft fontSize="small" /></IconButton>
                    <DatePicker
                        value={dayjs(fechaSeleccionada)}
                        onChange={(val) => val && setFechaSeleccionada(val.format('YYYY-MM-DD'))}
                        maxDate={dayjs()}
                        slotProps={{ textField: { size: 'small', sx: { '& input': { fontSize: '0.8125rem', py: 0.5 } } } }}
                    />
                    <IconButton size="small" onClick={() => cambiarDia(1)} disabled={esHoy}><ChevronRight fontSize="small" /></IconButton>
                </Stack>
            </Paper>

            {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1, height: 2, bgcolor: '#DEEBFF', '& .MuiLinearProgress-bar': { bgcolor: '#0052CC' } }} />}

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                {statCards.map((card) => (
                    <Grid key={card.label} size={{ xs: 6, md: 3 }}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Box sx={{ color: card.color, display: 'flex', '& svg': { fontSize: 18 } }}>{card.icon}</Box>
                                <Typography variant="subtitle2">{card.label}</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={700} sx={{ color: card.color }}>
                                {card.value}
                            </Typography>
                            {card.sub && <Typography variant="caption" color="text.secondary">{card.sub}</Typography>}
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Real-time activity */}
            {esHoy && entradasActivas.length > 0 && (
                <Paper sx={{ p: 2.5, mb: 2.5, border: '1px solid #57D9A3', bgcolor: '#E3FCEF08' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Box sx={{
                            width: 8, height: 8, borderRadius: '50%', bgcolor: '#36B37E',
                            animation: 'pulse 2s infinite',
                            '@keyframes pulse': { '0%': { opacity: 1 }, '50%': { opacity: 0.4 }, '100%': { opacity: 1 } }
                        }} />
                        <Typography variant="body1" fontWeight={600}>En tiempo real</Typography>
                        <Chip size="small" label={`${entradasActivas.length} activo${entradasActivas.length > 1 ? 's' : ''}`}
                            sx={{ bgcolor: '#E3FCEF', color: '#006644', fontWeight: 700, ml: 0.5 }} />
                    </Box>
                    <Grid container spacing={2}>
                        {entradasActivas.map((entry) => (
                            <Grid size={{ xs: 12, md: 6 }} key={entry._id}>
                                <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ bgcolor: '#36B37E', width: 36, height: 36, fontSize: '0.8125rem' }}>
                                            {entry.userId?.username?.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={600}>{entry.userId?.username}</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: entry.color, flexShrink: 0 }} />
                                                <Typography variant="caption" color="text.secondary" noWrap>{entry.tarea}</Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="body1" fontFamily="'SF Mono', 'Fira Code', monospace" fontWeight={700} sx={{ color: '#36B37E' }}>
                                            {formatearTiempo(calcularTiempoActivo(entry))}
                                        </Typography>
                                    </Box>
                                    {entry.descripciones?.length > 0 && (
                                        <Box sx={{ mt: 1.5, p: 1, bgcolor: 'action.hover', borderRadius: 1, borderLeft: '3px solid #36B37E' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                <strong>{formatearHora(entry.descripciones[entry.descripciones.length - 1].timestamp)}</strong>{' '}
                                                {entry.descripciones[entry.descripciones.length - 1].texto}
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Team table */}
            <Paper sx={{ overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight={600}>Actividad del equipo</Typography>
                    <Typography variant="caption" color="text.secondary">{fechaSeleccionada}</Typography>
                </Box>

                {actividadEquipo.length === 0 ? (
                    <Box sx={{ p: 5, textAlign: 'center' }}>
                        <People sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Sin actividad registrada</Typography>
                        {!esHoy && (
                            <Button size="small" onClick={irAHoy} sx={{ mt: 1 }}>Ver hoy</Button>
                        )}
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>USUARIO</TableCell>
                                    <TableCell>ENTRADAS</TableCell>
                                    <TableCell>TAREAS</TableCell>
                                    <TableCell align="right">TIEMPO</TableCell>
                                    <TableCell width={80} align="right">ACCIONES</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {actividadEquipo.map((usuario) => (
                                    <React.Fragment key={usuario.usuario}>
                                        <TableRow>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                                                        {usuario.usuario.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{usuario.usuario}</Typography>
                                                        {usuario.email && <Typography variant="caption" color="text.secondary">{usuario.email}</Typography>}
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Typography variant="body2">{usuario.entradas.length}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{usuario.cantidadTareas}</Typography></TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontFamily="'SF Mono', 'Fira Code', monospace" fontWeight={600}>
                                                    {formatearTiempo(usuario.tiempoTotal)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Expandir">
                                                    <IconButton size="small" onClick={() => toggleExpandUser(usuario.usuario)}>
                                                        {expandedUsers[usuario.usuario] ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Historial">
                                                    <IconButton size="small" onClick={() => verDetalleUsuario(usuario)}>
                                                        <Visibility sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded entries */}
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ py: 0, px: 0, borderBottom: expandedUsers[usuario.usuario] ? undefined : 'none' }}>
                                                <Collapse in={expandedUsers[usuario.usuario]} timeout="auto" unmountOnExit>
                                                    <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                            ENTRADAS DE {usuario.usuario.toUpperCase()}
                                                        </Typography>
                                                        {usuario.entradas.map((entrada) => {
                                                            const sp = getStatusProps(entrada.estado);
                                                            return (
                                                                <Box key={entrada._id} sx={{
                                                                    mb: 1, p: 1.5, bgcolor: 'background.paper', borderRadius: 1,
                                                                    border: '1px solid', borderColor: 'divider',
                                                                }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: entrada.color }} />
                                                                            <Typography variant="body2" fontWeight={600}>{entrada.tarea}</Typography>
                                                                        </Box>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Chip size="small" label={sp.label} sx={sp.sx} />
                                                                            <Typography variant="body2" fontFamily="'SF Mono', 'Fira Code', monospace" fontWeight={600}>
                                                                                {formatearTiempo(entrada.duracionTotal)}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {entrada.segmentos.length} {entrada.segmentos.length === 1 ? 'sesión' : 'sesiones'}
                                                                        {entrada.segmentos.length > 0 && ` · ${formatearHora(entrada.segmentos[0].inicio)}`}
                                                                        {entrada.segmentos.length > 0 && entrada.segmentos[entrada.segmentos.length - 1].fin && ` — ${formatearHora(entrada.segmentos[entrada.segmentos.length - 1].fin)}`}
                                                                    </Typography>
                                                                    {entrada.descripciones?.length > 0 && (
                                                                        <Box sx={{ mt: 1, pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                                                                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                                                                NOTAS ({entrada.descripciones.length})
                                                                            </Typography>
                                                                            {entrada.descripciones.slice(-3).map((desc, idx) => (
                                                                                <Typography key={idx} variant="caption" display="block" color="text.secondary" sx={{ mb: 0.25 }}>
                                                                                    <strong>{formatearHora(desc.timestamp)}</strong> {desc.texto}
                                                                                </Typography>
                                                                            ))}
                                                                            {entrada.descripciones.length > 3 && (
                                                                                <Typography variant="caption" color="primary">
                                                                                    +{entrada.descripciones.length - 3} más
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            );
                                                        })}
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* User detail dialog */}
            <Dialog open={dialogDetalle} onClose={() => setDialogDetalle(false)} maxWidth="md" fullWidth>
                <DialogTitle>Historial — {usuarioSeleccionado?.usuario}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2.5, display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1, alignItems: 'flex-end' }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 0.5, color: '#626F86' }}>DESDE</Typography>
                            <DatePicker
                                value={dayjs(rangoFechasDetalle.inicio)}
                                onChange={(val) => val && setRangoFechasDetalle({ ...rangoFechasDetalle, inicio: val.format('YYYY-MM-DD') })}
                                slotProps={{ textField: { size: 'small' } }}
                            />
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 0.5, color: '#626F86' }}>HASTA</Typography>
                            <DatePicker
                                value={dayjs(rangoFechasDetalle.fin)}
                                onChange={(val) => val && setRangoFechasDetalle({ ...rangoFechasDetalle, fin: val.format('YYYY-MM-DD') })}
                                slotProps={{ textField: { size: 'small' } }}
                            />
                        </Box>
                        <Button variant="contained" size="small" sx={{ height: 40 }}
                            onClick={() => usuarioSeleccionado && verDetalleUsuario(usuarioSeleccionado)}>
                            Aplicar
                        </Button>
                    </Box>

                    {detalleUsuario && (
                        <>
                            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                                {[
                                    { label: 'Entradas', value: detalleUsuario.estadisticas.totalEntradas, color: 'text.primary' },
                                    { label: 'Tiempo total', value: formatearTiempoCorto(detalleUsuario.estadisticas.tiempoTotal), sub: formatearTiempo(detalleUsuario.estadisticas.tiempoTotal), color: '#0052CC' },
                                    { label: 'Completadas', value: detalleUsuario.estadisticas.entradasCompletadas, color: '#36B37E' },
                                    { label: 'Activas', value: detalleUsuario.estadisticas.entradasActivas, color: '#0052CC' },
                                    { label: 'Pausadas', value: detalleUsuario.estadisticas.entradasPausadas, color: '#FF991F' },
                                    { label: 'Tareas únicas', value: detalleUsuario.estadisticas.tareasUnicas, color: '#6554C0' },
                                ].map((s, i) => (
                                    <Grid key={i} size={{ xs: 6, md: 4 }}>
                                        <Paper sx={{ p: 1.5 }}>
                                            <Typography variant="subtitle2">{s.label.toUpperCase()}</Typography>
                                            <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                                            {s.sub && <Typography variant="caption" color="text.secondary">{s.sub}</Typography>}
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>

                            <Typography variant="subtitle2" sx={{ mb: 1 }}>ENTRADAS RECIENTES</Typography>
                            <List sx={{ maxHeight: 360, overflow: 'auto' }} disablePadding>
                                {detalleUsuario.entries.slice(0, 15).map((entry) => {
                                    const sp = getStatusProps(entry.estado);
                                    return (
                                        <React.Fragment key={entry._id}>
                                            <ListItem sx={{ py: 1.5 }}>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                            <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: entry.color }} />
                                                            <Typography variant="body2" fontWeight={600}>{entry.tarea}</Typography>
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(entry.fecha).toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' })} · {formatearTiempo(entry.duracionTotal)} · {entry.segmentos.length} sesión{entry.segmentos.length !== 1 && 'es'}
                                                        </Typography>
                                                    }
                                                />
                                                <Chip size="small" label={sp.label} sx={sp.sx} />
                                            </ListItem>
                                            <Divider />
                                        </React.Fragment>
                                    );
                                })}
                            </List>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogDetalle(false)} sx={{ color: 'text.secondary' }}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
