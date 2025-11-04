// pages/TeamDashboard.jsx

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Avatar,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Collapse,
    List,
    ListItem,
    ListItemText,
    Divider,
    Stack,
    ButtonGroup,
    Tooltip,
} from '@mui/material';
import {
    People,
    Timer,
    Assignment,
    Visibility,
    Refresh,
    ExpandMore,
    ExpandLess,
    PlayArrow,
    Pause,
    CheckCircle,
    Today,
    DateRange,
    CalendarMonth,
} from '@mui/icons-material';
import { CONFIG } from '../config';

export const TeamDashboard = () => {
    const [actividadEquipo, setActividadEquipo] = useState([]);
    const [entradasActivas, setEntradasActivas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogDetalle, setDialogDetalle] = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [detalleUsuario, setDetalleUsuario] = useState(null);
    const [expandedUsers, setExpandedUsers] = useState({});

    // Estados para filtros de fecha
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
    const [rangoFechasDetalle, setRangoFechasDetalle] = useState({
        inicio: new Date().toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        cargarDatos();
    }, [fechaSeleccionada]);

    const cargarDatos = async () => {
        try {
            setLoading(true);

            // Cargar entradas activas (siempre del día actual)
            const responseActivas = await fetch(`${CONFIG.uri}/entries/team/active`);
            if (responseActivas.ok) {
                const dataActivas = await responseActivas.json();
                setEntradasActivas(dataActivas);
            }

            // Cargar actividad de la fecha seleccionada
            const responseEquipo = await fetch(`${CONFIG.uri}/entries/team/date/${fechaSeleccionada}`);
            if (responseEquipo.ok) {
                const dataEquipo = await responseEquipo.json();
                setActividadEquipo(dataEquipo);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const verDetalleUsuario = async (usuario) => {
        try {
            setUsuarioSeleccionado(usuario);
            setDialogDetalle(true);

            const response = await fetch(
                `${CONFIG.uri}/entries/team/user/${usuario.entradas[0].userId._id}/range/${rangoFechasDetalle.inicio}/${rangoFechasDetalle.fin}`
            );

            if (response.ok) {
                const data = await response.json();
                setDetalleUsuario(data);
            }
        } catch (error) {
            console.error('Error al cargar detalle:', error);
        }
    };

    const toggleExpandUser = (username) => {
        setExpandedUsers(prev => ({
            ...prev,
            [username]: !prev[username]
        }));
    };

    // Funciones de filtro rápido
    const irAHoy = () => {
        setFechaSeleccionada(new Date().toISOString().split('T')[0]);
    };

    const irAyer = () => {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        setFechaSeleccionada(ayer.toISOString().split('T')[0]);
    };

    const irEstaSemana = () => {
        // Ir al lunes de esta semana
        const hoy = new Date();
        const dia = hoy.getDay();
        const diff = dia === 0 ? -6 : 1 - dia; // Si es domingo (0), retroceder 6 días
        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() + diff);
        setFechaSeleccionada(lunes.toISOString().split('T')[0]);
    };

    const cambiarDia = (dias) => {
        const nuevaFecha = new Date(fechaSeleccionada);
        nuevaFecha.setDate(nuevaFecha.getDate() + dias);
        setFechaSeleccionada(nuevaFecha.toISOString().split('T')[0]);
    };

    const formatearFechaLegible = (fecha) => {
        const date = new Date(fecha + 'T00:00:00');
        const hoy = new Date().toISOString().split('T')[0];

        if (fecha === hoy) {
            return 'Hoy';
        }

        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        if (fecha === ayer.toISOString().split('T')[0]) {
            return 'Ayer';
        }

        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatearTiempo = (segundos) => {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
    };

    const formatearTiempoCorto = (segundos) => {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        if (horas > 0) {
            return `${horas}h ${minutos}m`;
        }
        return `${minutos}m`;
    };

    const formatearHora = (isoString) => {
        return new Date(isoString).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calcularTiempoActivo = (entry) => {
        if (!entry.segmentos || entry.segmentos.length === 0) return 0;

        let total = 0;
        entry.segmentos.forEach(seg => {
            const inicio = new Date(seg.inicio);
            const fin = seg.fin ? new Date(seg.fin) : new Date();
            total += Math.floor((fin - inicio) / 1000);
        });
        return total;
    };

    const totalTiempoEquipo = actividadEquipo.reduce((sum, user) => sum + user.tiempoTotal, 0);
    const totalUsuariosActivos = entradasActivas.length;
    const totalEntradas = actividadEquipo.reduce((sum, user) => sum + user.entradas.length, 0);
    const esHoy = fechaSeleccionada === new Date().toISOString().split('T')[0];

    return (
        <Box>
            {/* Header con controles */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight="600">
                    Dashboard del Equipo
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <IconButton onClick={cargarDatos} disabled={loading}>
                        <Refresh />
                    </IconButton>
                </Box>
            </Box>

            {/* Filtros de fecha */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Tooltip title="Hoy">
                            <Button
                                variant={esHoy ? "contained" : "outlined"}
                                size="small"
                                startIcon={<Today />}
                                onClick={irAHoy}
                                sx={{ textTransform: 'none' }}
                            >
                                Hoy
                            </Button>
                        </Tooltip>

                        <Tooltip title="Ayer">
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={irAyer}
                                sx={{ textTransform: 'none' }}
                            >
                                Ayer
                            </Button>
                        </Tooltip>

                        <Tooltip title="Esta semana">
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CalendarMonth />}
                                onClick={irEstaSemana}
                                sx={{ textTransform: 'none' }}
                            >
                                Esta Semana
                            </Button>
                        </Tooltip>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title="Día anterior">
                            <IconButton size="small" onClick={() => cambiarDia(-1)}>
                                <ExpandLess sx={{ transform: 'rotate(-90deg)' }} />
                            </IconButton>
                        </Tooltip>

                        <TextField
                            type="date"
                            value={fechaSeleccionada}
                            onChange={(e) => setFechaSeleccionada(e.target.value)}
                            size="small"
                            sx={{ minWidth: 150 }}
                        />

                        <Tooltip title="Día siguiente">
                            <IconButton
                                size="small"
                                onClick={() => cambiarDia(1)}
                                disabled={esHoy}
                            >
                                <ExpandMore sx={{ transform: 'rotate(-90deg)' }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="600" color="primary">
                        {formatearFechaLegible(fechaSeleccionada)}
                    </Typography>
                </Box>
            </Paper>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Tarjetas de resumen */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <PlayArrow sx={{ color: '#4CAF50' }} />
                                <Typography variant="caption" color="text.secondary">
                                    {esHoy ? 'USUARIOS ACTIVOS AHORA' : 'USUARIOS QUE TRABAJARON'}
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="700">
                                {esHoy ? totalUsuariosActivos : actividadEquipo.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Timer sx={{ color: '#03a9f4' }} />
                                <Typography variant="caption" color="text.secondary">
                                    TIEMPO TOTAL
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="700" fontFamily="monospace">
                                {formatearTiempoCorto(totalTiempoEquipo)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatearTiempo(totalTiempoEquipo)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <People sx={{ color: '#FF9800' }} />
                                <Typography variant="caption" color="text.secondary">
                                    MIEMBROS ACTIVOS
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="700">
                                {actividadEquipo.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Assignment sx={{ color: '#9C27B0' }} />
                                <Typography variant="caption" color="text.secondary">
                                    ENTRADAS TOTALES
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="700">
                                {totalEntradas}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Usuarios activos en tiempo real - SOLO si estamos viendo HOY */}
            {esHoy && entradasActivas.length > 0 && (
                <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'success.main', borderRadius: 2, bgcolor: 'success.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Box sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                            animation: 'pulse 2s infinite',
                            '@keyframes pulse': {
                                '0%': { opacity: 1 },
                                '50%': { opacity: 0.5 },
                                '100%': { opacity: 1 }
                            }
                        }} />
                        <Typography variant="subtitle1" fontWeight="600">
                            Actividad en tiempo real
                        </Typography>
                    </Box>
                    <Grid container spacing={2}>
                        {entradasActivas.map((entry) => (
                            <Grid size={{ xs: 12, md: 6 }} key={entry._id}>
                                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'success.main', borderRadius: 2, bgcolor: 'background.paper' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <Avatar sx={{ bgcolor: 'success.main' }}>
                                                {entry.userId?.username?.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle1" fontWeight="600">
                                                    {entry.userId?.username}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {entry.tarea}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Typography variant="h6" fontFamily="monospace" fontWeight="600" color="success.main">
                                                {formatearTiempo(calcularTiempoActivo(entry))}
                                            </Typography>
                                        </Box>
                                        {entry.descripciones && entry.descripciones.length > 0 && (
                                            <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    <strong>Última nota ({formatearHora(entry.descripciones[entry.descripciones.length - 1].timestamp)}):</strong> {entry.descripciones[entry.descripciones.length - 1].texto}
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Tabla de actividad del equipo */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight="600">
                        Actividad del equipo - {formatearFechaLegible(fechaSeleccionada)}
                    </Typography>
                </Box>

                {actividadEquipo.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <People sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            No hay actividad registrada para esta fecha
                        </Typography>
                        {!esHoy && (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={irAHoy}
                                sx={{ mt: 2, textTransform: 'none' }}
                            >
                                Ver actividad de hoy
                            </Button>
                        )}
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>
                                        USUARIO
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>
                                        ENTRADAS
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>
                                        TAREAS
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>
                                        TIEMPO TOTAL
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>
                                        ACCIONES
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {actividadEquipo.map((usuario) => (
                                    <React.Fragment key={usuario.usuario}>
                                        <TableRow hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                                        {usuario.usuario.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="600">
                                                            {usuario.usuario}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {usuario.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{usuario.entradas.length}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{usuario.cantidadTareas}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontFamily="monospace" fontWeight="600">
                                                    {formatearTiempo(usuario.tiempoTotal)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatearTiempoCorto(usuario.tiempoTotal)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Expandir entradas">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => toggleExpandUser(usuario.usuario)}
                                                    >
                                                        {expandedUsers[usuario.usuario] ? <ExpandLess /> : <ExpandMore />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Ver detalle histórico">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => verDetalleUsuario(usuario)}
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ py: 0, px: 0, borderBottom: expandedUsers[usuario.usuario] ? '1px solid' : 'none', borderColor: 'divider' }}>
                                                <Collapse in={expandedUsers[usuario.usuario]} timeout="auto" unmountOnExit>
                                                    <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                                            Entradas de {usuario.usuario}:
                                                        </Typography>
                                                        {usuario.entradas.map((entrada) => (
                                                            <Box key={entrada._id} sx={{ mb: 1, p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entrada.color }} />
                                                                        <Typography variant="body2" fontWeight="600">
                                                                            {entrada.tarea}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Chip
                                                                            label={entrada.estado}
                                                                            size="small"
                                                                            color={
                                                                                entrada.estado === 'activo' ? 'success' :
                                                                                    entrada.estado === 'pausado' ? 'warning' : 'default'
                                                                            }
                                                                            icon={
                                                                                entrada.estado === 'activo' ? <PlayArrow fontSize="small" /> :
                                                                                    entrada.estado === 'pausado' ? <Pause fontSize="small" /> :
                                                                                        <CheckCircle fontSize="small" />
                                                                            }
                                                                        />
                                                                        <Typography variant="body2" fontFamily="monospace" fontWeight="600">
                                                                            {formatearTiempo(entrada.duracionTotal)}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {entrada.segmentos.length} {entrada.segmentos.length === 1 ? 'sesión' : 'sesiones'}
                                                                    {entrada.segmentos.length > 0 && ` • Inicio: ${formatearHora(entrada.segmentos[0].inicio)}`}
                                                                    {entrada.segmentos.length > 0 && entrada.segmentos[entrada.segmentos.length - 1].fin && ` • Fin: ${formatearHora(entrada.segmentos[entrada.segmentos.length - 1].fin)}`}
                                                                </Typography>
                                                                {entrada.descripciones && entrada.descripciones.length > 0 && (
                                                                    <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                                                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                                                            Notas ({entrada.descripciones.length}):
                                                                        </Typography>
                                                                        {entrada.descripciones.slice(-3).map((desc, idx) => (
                                                                            <Typography key={idx} variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                                                                                • <strong>{formatearHora(desc.timestamp)}:</strong> {desc.texto}
                                                                            </Typography>
                                                                        ))}
                                                                        {entrada.descripciones.length > 3 && (
                                                                            <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic' }}>
                                                                                ... y {entrada.descripciones.length - 3} más
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        ))}
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

            {/* Dialog de detalle histórico */}
            <Dialog
                open={dialogDetalle}
                onClose={() => setDialogDetalle(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Detalle histórico - {usuarioSeleccionado?.usuario}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            label="Fecha Inicio"
                            type="date"
                            value={rangoFechasDetalle.inicio}
                            onChange={(e) => setRangoFechasDetalle({ ...rangoFechasDetalle, inicio: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                        />
                        <TextField
                            label="Fecha Fin"
                            type="date"
                            value={rangoFechasDetalle.fin}
                            onChange={(e) => setRangoFechasDetalle({ ...rangoFechasDetalle, fin: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                        />
                        <Button
                            variant="contained"
                            onClick={() => usuarioSeleccionado && verDetalleUsuario(usuarioSeleccionado)}
                            sx={{ textTransform: 'none' }}
                        >
                            Aplicar
                        </Button>
                    </Box>

                    {detalleUsuario && (
                        <>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 6 }}>
                                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                        <CardContent>
                                            <Typography variant="caption" color="text.secondary">
                                                Total Entradas
                                            </Typography>
                                            <Typography variant="h5" fontWeight="600">
                                                {detalleUsuario.estadisticas.totalEntradas}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                        <CardContent>
                                            <Typography variant="caption" color="text.secondary">
                                                Tiempo Total
                                            </Typography>
                                            <Typography variant="h5" fontWeight="600" fontFamily="monospace">
                                                {formatearTiempoCorto(detalleUsuario.estadisticas.tiempoTotal)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatearTiempo(detalleUsuario.estadisticas.tiempoTotal)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                        <CardContent>
                                            <Typography variant="caption" color="text.secondary">
                                                Completadas
                                            </Typography>
                                            <Typography variant="h6" fontWeight="600" color="success.main">
                                                {detalleUsuario.estadisticas.entradasCompletadas}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                        <CardContent>
                                            <Typography variant="caption" color="text.secondary">
                                                Activas
                                            </Typography>
                                            <Typography variant="h6" fontWeight="600" color="primary.main">
                                                {detalleUsuario.estadisticas.entradasActivas}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                        <CardContent>
                                            <Typography variant="caption" color="text.secondary">
                                                Pausadas
                                            </Typography>
                                            <Typography variant="h6" fontWeight="600" color="warning.main">
                                                {detalleUsuario.estadisticas.entradasPausadas}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                        <CardContent>
                                            <Typography variant="caption" color="text.secondary">
                                                Tareas Únicas Trabajadas
                                            </Typography>
                                            <Typography variant="h6" fontWeight="600">
                                                {detalleUsuario.estadisticas.tareasUnicas}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                                Entradas recientes (últimas 15)
                            </Typography>
                            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {detalleUsuario.entries.slice(0, 15).map((entry) => (
                                    <React.Fragment key={entry._id}>
                                        <ListItem>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
                                                        <Typography variant="body2" fontWeight="600">
                                                            {entry.tarea}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(entry.fecha).toLocaleDateString('es-ES', {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })} • {formatearTiempo(entry.duracionTotal)} • {entry.segmentos.length} {entry.segmentos.length === 1 ? 'sesión' : 'sesiones'}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                            <Chip
                                                label={entry.estado}
                                                size="small"
                                                color={
                                                    entry.estado === 'activo' ? 'success' :
                                                        entry.estado === 'pausado' ? 'warning' : 'default'
                                                }
                                            />
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogDetalle(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};