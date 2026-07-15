import { useState, useEffect, useContext } from 'react';
import {
    Box, Paper, Typography, Button, ButtonGroup, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { DateRange, AccessTime, Assignment, TrendingUp, Timer } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { CONFIG } from '../config';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

export const DashboardPage = () => {
    const [filtro, setFiltro] = useState('hoy');
    const [entradas, setEntradas] = useState([]);
    const [dialogRango, setDialogRango] = useState(false);
    const [rangoFechas, setRangoFechas] = useState({
        inicio: new Date().toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    });
    const { user } = useContext(AuthContext);

    useEffect(() => { cargarDatos(); }, [filtro, rangoFechas]);

    const cargarDatos = async () => {
        try {
            const { fechaInicio, fechaFin } = obtenerRangoFechas();
            const response = await axios.get(`${CONFIG.uri}/entries/user/${user._id}/range/${fechaInicio}/${fechaFin}`);
            setEntradas(response.data);
        } catch (error) { console.error('Error al cargar datos:', error); }
    };

    const obtenerRangoFechas = () => {
        const hoy = new Date();
        let fechaInicio, fechaFin;
        switch (filtro) {
            case 'hoy': fechaInicio = fechaFin = hoy.toISOString().split('T')[0]; break;
            case 'semana':
                const inicioSemana = new Date(hoy);
                inicioSemana.setDate(hoy.getDate() - hoy.getDay());
                fechaInicio = inicioSemana.toISOString().split('T')[0];
                fechaFin = hoy.toISOString().split('T')[0]; break;
            case 'mes':
                fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
                fechaFin = hoy.toISOString().split('T')[0]; break;
            case 'rango': fechaInicio = rangoFechas.inicio; fechaFin = rangoFechas.fin; break;
            default: fechaInicio = fechaFin = hoy.toISOString().split('T')[0];
        }
        return { fechaInicio, fechaFin };
    };

    const calcularEstadisticas = () => {
        const stats = {};
        let totalSegundos = 0, totalEntradas = 0;
        const tareasUnicas = new Set();
        entradas.forEach(entrada => {
            if (!stats[entrada.taskId]) stats[entrada.taskId] = { nombre: entrada.tarea, color: entrada.color, tiempo: 0, entradas: 0 };
            stats[entrada.taskId].tiempo += entrada.duracionTotal;
            stats[entrada.taskId].entradas += 1;
            totalSegundos += entrada.duracionTotal;
            totalEntradas += 1;
            tareasUnicas.add(entrada.taskId);
        });
        return { porTarea: Object.values(stats), totalSegundos, totalEntradas, totalTareas: tareasUnicas.size };
    };

    const formatearTiempo = (segundos) => {
        const h = Math.floor(segundos / 3600), m = Math.floor((segundos % 3600) / 60), s = segundos % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const formatearTiempoCorto = (segundos) => {
        const h = Math.floor(segundos / 3600), m = Math.floor((segundos % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const estadisticas = calcularEstadisticas();
    const dataPie = estadisticas.porTarea.map(item => ({ name: item.nombre, value: item.tiempo, color: item.color }));
    const dataBar = estadisticas.porTarea.sort((a, b) => b.tiempo - a.tiempo)
        .map(item => ({ nombre: item.nombre.length > 15 ? item.nombre.substring(0, 15) + '...' : item.nombre, horas: parseFloat((item.tiempo / 3600).toFixed(2)), color: item.color }));

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="13" fontWeight="600">{`${(percent * 100).toFixed(0)}%`}</text>;
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload?.length) {
            return (
                <Paper sx={{ p: 1.5 }}>
                    <Typography variant="body2" fontWeight={600}>{payload[0].payload.name || payload[0].name}</Typography>
                    <Typography variant="body2" color="text.secondary">{formatearTiempoCorto(payload[0].value)}</Typography>
                </Paper>
            );
        }
        return null;
    };

    const filtros = [
        { key: 'hoy', label: 'Hoy' },
        { key: 'semana', label: 'Semana' },
        { key: 'mes', label: 'Mes' },
    ];

    const statCards = [
        { label: 'TIEMPO TOTAL', value: formatearTiempoCorto(estadisticas.totalSegundos), sub: formatearTiempo(estadisticas.totalSegundos), color: '#0052CC', icon: <AccessTime /> },
        { label: 'ENTRADAS', value: estadisticas.totalEntradas, sub: 'Sesiones registradas', color: '#36B37E', icon: <Assignment /> },
        { label: 'TAREAS', value: estadisticas.totalTareas, sub: 'Diferentes tareas', color: '#FF991F', icon: <TrendingUp /> },
        { label: 'PROMEDIO', value: estadisticas.totalEntradas > 0 ? formatearTiempoCorto(Math.floor(estadisticas.totalSegundos / estadisticas.totalEntradas)) : '0m', sub: 'Por entrada', color: '#6554C0', icon: <Timer /> },
    ];

    return (
        <Box>
            {/* Header with filters */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {filtro === 'rango' ? `${rangoFechas.inicio} — ${rangoFechas.fin}` :
                            filtro === 'hoy' ? 'Hoy' : filtro === 'semana' ? 'Esta semana' : 'Este mes'}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <ButtonGroup size="small" sx={{
                        '& .MuiButton-root': { borderColor: 'divider', color: 'text.secondary', fontSize: '0.75rem', px: 1.5 },
                    }}>
                        {filtros.map(f => (
                            <Button key={f.key}
                                onClick={() => setFiltro(f.key)}
                                sx={{
                                    ...(filtro === f.key && { bgcolor: '#DEEBFF', color: '#0052CC !important', borderColor: '#4C9AFF !important', fontWeight: 600 }),
                                }}>
                                {f.label}
                            </Button>
                        ))}
                    </ButtonGroup>
                    <Button size="small" variant="outlined" startIcon={<DateRange sx={{ fontSize: '16px !important' }} />}
                        onClick={() => setDialogRango(true)}
                        sx={{
                            borderColor: 'divider', color: 'text.secondary', fontSize: '0.75rem',
                            ...(filtro === 'rango' && { bgcolor: '#DEEBFF', color: '#0052CC', borderColor: '#4C9AFF', fontWeight: 600 }),
                        }}>
                        Rango
                    </Button>
                </Box>
            </Box>

            {/* Stats cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {statCards.map((card) => (
                    <Grid key={card.label} size={{ xs: 6, md: 3 }}>
                        <Paper sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <Box sx={{ color: card.color, display: 'flex', '& svg': { fontSize: 18 } }}>{card.icon}</Box>
                                <Typography variant="subtitle2">{card.label}</Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: card.color, mb: 0.25 }}>
                                {card.value}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{card.sub}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Charts */}
            {estadisticas.totalSegundos > 0 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>Distribución de tiempo</Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={dataPie} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel}
                                        outerRadius={110} innerRadius={50} dataKey="value" strokeWidth={2} stroke="#fff">
                                        {dataPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
                                {dataPie.map((item, i) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: item.color }} />
                                        <Typography variant="caption" color="text.secondary">{item.name}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>Horas por tarea</Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dataBar} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" vertical={false} />
                                    <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80}
                                        tick={{ fontSize: 11, fill: '#626F86' }} axisLine={{ stroke: '#EBECF0' }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#626F86' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Bar dataKey="horas" radius={[3, 3, 0, 0]}>
                                        {dataBar.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Task detail breakdown */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>Detalle por tarea</Typography>
                {estadisticas.porTarea.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Sin datos en el período seleccionado
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {estadisticas.porTarea.sort((a, b) => b.tiempo - a.tiempo).map((item, i) => {
                            const pct = estadisticas.totalSegundos > 0 ? Math.round((item.tiempo / estadisticas.totalSegundos) * 100) : 0;
                            return (
                                <Box key={i}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: item.color }} />
                                            <Typography variant="body2" fontWeight={500}>{item.nombre}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.entradas} {item.entradas === 1 ? 'entrada' : 'entradas'}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" fontFamily="'SF Mono', 'Fira Code', monospace" fontWeight={600}>
                                            {formatearTiempoCorto(item.tiempo)} ({pct}%)
                                        </Typography>
                                    </Box>
                                    <Box sx={{ height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
                                        <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: item.color, borderRadius: 3, transition: 'width 0.3s' }} />
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Paper>

            {/* Date range dialog */}
            <Dialog open={dialogRango} onClose={() => setDialogRango(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Rango de fechas</DialogTitle>
                <DialogContent>
                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, color: '#626F86' }}>DESDE</Typography>
                    <DatePicker
                        value={dayjs(rangoFechas.inicio)}
                        onChange={(val) => val && setRangoFechas({ ...rangoFechas, inicio: val.format('YYYY-MM-DD') })}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                        sx={{ mb: 2 }}
                    />
                    <Typography variant="subtitle2" sx={{ mb: 0.5, color: '#626F86' }}>HASTA</Typography>
                    <DatePicker
                        value={dayjs(rangoFechas.fin)}
                        onChange={(val) => val && setRangoFechas({ ...rangoFechas, fin: val.format('YYYY-MM-DD') })}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogRango(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
                    <Button onClick={() => { setFiltro('rango'); setDialogRango(false); }} variant="contained">Aplicar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
