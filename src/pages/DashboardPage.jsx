import { useState, useEffect, useContext } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    ButtonGroup,
    Grid,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
} from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import {
    CalendarToday,
    DateRange,
    TrendingUp,
    AccessTime,
} from '@mui/icons-material';
import { CONFIG } from '../config';
import { AuthContext } from '../contexts/AuthContext';

export const DashboardPage = () => {
    const [filtro, setFiltro] = useState('hoy');
    const [entradas, setEntradas] = useState([]);
    const [dialogRango, setDialogRango] = useState(false);
    const [rangoFechas, setRangoFechas] = useState({
        inicio: new Date().toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    });

    const { user } = useContext(AuthContext);

    useEffect(() => {
        cargarDatos();
    }, [filtro, rangoFechas]);

    const cargarDatos = async () => {
        try {
            const { fechaInicio, fechaFin } = obtenerRangoFechas();
            const response = await fetch(
                `${CONFIG.uri}/entries/user/${user._id}/range/${fechaInicio}/${fechaFin}`
            );
            if (response.ok) {
                const data = await response.json();
                setEntradas(data);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    };

    const obtenerRangoFechas = () => {
        const hoy = new Date();
        let fechaInicio, fechaFin;

        switch (filtro) {
            case 'hoy':
                fechaInicio = fechaFin = hoy.toISOString().split('T')[0];
                break;
            case 'semana':
                const inicioSemana = new Date(hoy);
                inicioSemana.setDate(hoy.getDate() - hoy.getDay());
                fechaInicio = inicioSemana.toISOString().split('T')[0];
                fechaFin = hoy.toISOString().split('T')[0];
                break;
            case 'mes':
                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                fechaInicio = inicioMes.toISOString().split('T')[0];
                fechaFin = hoy.toISOString().split('T')[0];
                break;
            case 'rango':
                fechaInicio = rangoFechas.inicio;
                fechaFin = rangoFechas.fin;
                break;
            default:
                fechaInicio = fechaFin = hoy.toISOString().split('T')[0];
        }

        return { fechaInicio, fechaFin };
    };

    const calcularEstadisticas = () => {
        const stats = {};
        let totalSegundos = 0;
        let totalEntradas = 0;
        let tareasUnicas = new Set();

        entradas.forEach(entrada => {
            if (!stats[entrada.taskId]) {
                stats[entrada.taskId] = {
                    nombre: entrada.tarea,
                    color: entrada.color,
                    tiempo: 0,
                    entradas: 0
                };
            }
            stats[entrada.taskId].tiempo += entrada.duracionTotal;
            stats[entrada.taskId].entradas += 1;
            totalSegundos += entrada.duracionTotal;
            totalEntradas += 1;
            tareasUnicas.add(entrada.taskId);
        });

        return {
            porTarea: Object.values(stats),
            totalSegundos,
            totalEntradas,
            totalTareas: tareasUnicas.size
        };
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

    const aplicarRango = () => {
        setFiltro('rango');
        setDialogRango(false);
    };

    const obtenerNombreFiltro = () => {
        switch (filtro) {
            case 'hoy': return 'Hoy';
            case 'semana': return 'Esta Semana';
            case 'mes': return 'Este Mes';
            case 'rango': return `${rangoFechas.inicio} - ${rangoFechas.fin}`;
            default: return 'Hoy';
        }
    };

    const estadisticas = calcularEstadisticas();
    const dataPie = estadisticas.porTarea.map(item => ({
        name: item.nombre,
        value: item.tiempo,
        color: item.color
    }));
    const dataBar = estadisticas.porTarea
        .sort((a, b) => b.tiempo - a.tiempo)
        .map(item => ({
            nombre: item.nombre.length > 15 ? item.nombre.substring(0, 15) + '...' : item.nombre,
            horas: parseFloat((item.tiempo / 3600).toFixed(2)),
            color: item.color
        }));

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize="14"
                fontWeight="bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <Paper sx={{ p: 1.5, border: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" fontWeight={600}>
                        {payload[0].payload.name || payload[0].name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {formatearTiempoCorto(payload[0].value)}
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight="600">
                    Dashboard - {obtenerNombreFiltro()}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <ButtonGroup variant="outlined" size="small">
                        <Button
                            variant={filtro === 'hoy' ? 'contained' : 'outlined'}
                            onClick={() => setFiltro('hoy')}
                            sx={{
                                bgcolor: filtro === 'hoy' ? '#03a9f4' : 'transparent',
                                '&:hover': {
                                    bgcolor: filtro === 'hoy' ? '#0288d1' : 'rgba(3, 169, 244, 0.08)'
                                }
                            }}
                        >
                            HOY
                        </Button>
                        <Button
                            variant={filtro === 'semana' ? 'contained' : 'outlined'}
                            onClick={() => setFiltro('semana')}
                            sx={{
                                bgcolor: filtro === 'semana' ? '#03a9f4' : 'transparent',
                                '&:hover': {
                                    bgcolor: filtro === 'semana' ? '#0288d1' : 'rgba(3, 169, 244, 0.08)'
                                }
                            }}
                        >
                            SEMANA
                        </Button>
                        <Button
                            variant={filtro === 'mes' ? 'contained' : 'outlined'}
                            onClick={() => setFiltro('mes')}
                            sx={{
                                bgcolor: filtro === 'mes' ? '#03a9f4' : 'transparent',
                                '&:hover': {
                                    bgcolor: filtro === 'mes' ? '#0288d1' : 'rgba(3, 169, 244, 0.08)'
                                }
                            }}
                        >
                            MES
                        </Button>
                    </ButtonGroup>
                    <Button
                        variant={filtro === 'rango' ? 'contained' : 'outlined'}
                        startIcon={<DateRange />}
                        onClick={() => setDialogRango(true)}
                        size="small"
                        sx={{
                            bgcolor: filtro === 'rango' ? '#03a9f4' : 'transparent',
                            '&:hover': {
                                bgcolor: filtro === 'rango' ? '#0288d1' : 'rgba(3, 169, 244, 0.08)'
                            }
                        }}
                    >
                        RANGO
                    </Button>
                </Box>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <AccessTime sx={{ color: '#03a9f4', fontSize: 20 }} />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    TIEMPO TOTAL
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="700" color="#03a9f4">
                                {formatearTiempoCorto(estadisticas.totalSegundos)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatearTiempo(estadisticas.totalSegundos)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <CalendarToday sx={{ color: '#4CAF50', fontSize: 20 }} />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    ENTRADAS
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="700" color="#4CAF50">
                                {estadisticas.totalEntradas}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Sesiones registradas
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TrendingUp sx={{ color: '#FF9800', fontSize: 20 }} />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    TAREAS TRABAJADAS
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="700" color="#FF9800">
                                {estadisticas.totalTareas}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Diferentes tareas
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <AccessTime sx={{ color: '#9C27B0', fontSize: 20 }} />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    PROMEDIO/ENTRADA
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="700" color="#9C27B0">
                                {estadisticas.totalEntradas > 0
                                    ? formatearTiempoCorto(Math.floor(estadisticas.totalSegundos / estadisticas.totalEntradas))
                                    : '0m'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Duración promedio
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            {estadisticas.totalSegundos > 0 ? (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <Typography variant="h6" fontWeight="600" gutterBottom>
                                Distribución de Tiempo
                            </Typography>
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={dataPie}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {dataPie.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                                {dataPie.map((item, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                                        <Typography variant="caption">{item.name}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <Typography variant="h6" fontWeight="600" gutterBottom>
                                Tiempo por Tarea (Horas)
                            </Typography>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={dataBar} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="nombre"
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="horas" radius={[8, 8, 0, 0]}>
                                        {dataBar.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>
            ) : null}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                    Detalle por Tarea
                </Typography>

                {estadisticas.porTarea.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No hay datos para mostrar en el período seleccionado
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {estadisticas.porTarea
                            .sort((a, b) => b.tiempo - a.tiempo)
                            .map((item, index) => {
                                const porcentaje = estadisticas.totalSegundos > 0
                                    ? Math.round((item.tiempo / estadisticas.totalSegundos) * 100)
                                    : 0;

                                return (
                                    <Box key={index}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box
                                                    sx={{
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: '50%',
                                                        bgcolor: item.color
                                                    }}
                                                />
                                                <Typography variant="body2" fontWeight={500}>
                                                    {item.nombre}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ({item.entradas} {item.entradas === 1 ? 'entrada' : 'entradas'})
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                                                {formatearTiempoCorto(item.tiempo)} ({porcentaje}%)
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                height: 8,
                                                bgcolor: '#f0f0f0',
                                                borderRadius: 4,
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    height: '100%',
                                                    width: `${porcentaje}%`,
                                                    bgcolor: item.color,
                                                    transition: 'width 0.3s'
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                );
                            })}
                    </Box>
                )}
            </Paper>
            <Dialog open={dialogRango} onClose={() => setDialogRango(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Seleccionar Rango de Fechas</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Fecha Inicio"
                        type="date"
                        value={rangoFechas.inicio}
                        onChange={(e) => setRangoFechas({ ...rangoFechas, inicio: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mt: 2, mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Fecha Fin"
                        type="date"
                        value={rangoFechas.fin}
                        onChange={(e) => setRangoFechas({ ...rangoFechas, fin: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogRango(false)}>Cancelar</Button>
                    <Button onClick={aplicarRango} variant="contained">Aplicar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};