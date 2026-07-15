import { useState, useEffect, useContext } from 'react';
import {
    Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
    Grid, Divider, Alert,
} from '@mui/material';
import { Download, InsertDriveFile, DateRange, Assessment } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { CONFIG } from '../config';
import { AuthContext } from '../contexts/AuthContext';

export const ReportPage = () => {
    const [dialogExportar, setDialogExportar] = useState(false);
    const [tipoExportacion, setTipoExportacion] = useState('todo');
    const [rangoFechas, setRangoFechas] = useState({
        inicio: new Date().toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    });
    const [entradas, setEntradas] = useState([]);
    const { user } = useContext(AuthContext);
    const [estadisticas, setEstadisticas] = useState({ totalEntradas: 0, totalSegundos: 0, totalTareas: 0 });

    useEffect(() => { if (dialogExportar) cargarDatosParaExportar(); }, [dialogExportar, tipoExportacion, rangoFechas]);

    const cargarDatosParaExportar = async () => {
        try {
            let fechaInicio, fechaFin;
            if (tipoExportacion === 'todo') {
                const hace1Año = new Date(); hace1Año.setFullYear(hace1Año.getFullYear() - 1);
                fechaInicio = hace1Año.toISOString().split('T')[0];
                fechaFin = new Date().toISOString().split('T')[0];
            } else { fechaInicio = rangoFechas.inicio; fechaFin = rangoFechas.fin; }

            const response = await fetch(`${CONFIG.uri}/entries/user/${user._id}/range/${fechaInicio}/${fechaFin}`);
            if (response.ok) {
                const data = await response.json();
                setEntradas(data);
                const tareasUnicas = new Set();
                let totalSegundos = 0;
                data.forEach(e => { tareasUnicas.add(e.taskId); totalSegundos += e.duracionTotal; });
                setEstadisticas({ totalEntradas: data.length, totalSegundos, totalTareas: tareasUnicas.size });
            }
        } catch (error) { console.error('Error al cargar datos:', error); }
    };

    const formatearTiempo = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const formatearTiempoCorto = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };
    const formatearFecha = (iso) => new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const formatearHora = (iso) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const exportarCSV = () => {
        const headers = ['Fecha', 'Tarea', 'Estado', 'Hora Inicio', 'Hora Fin', 'Duración (HH:MM:SS)', 'Duración (Horas)', 'Sesiones'];
        const rows = entradas.map(e => {
            const pHora = e.segmentos.length > 0 ? formatearHora(e.segmentos[0].inicio) : '-';
            const uHora = e.segmentos.length > 0 && e.segmentos[e.segmentos.length - 1].fin ? formatearHora(e.segmentos[e.segmentos.length - 1].fin) : 'En curso';
            return [formatearFecha(e.fecha), `"${e.tarea}"`, e.estado, pHora, uHora, formatearTiempo(e.duracionTotal), (e.duracionTotal / 3600).toFixed(2), e.segmentos.length];
        });
        rows.push([]);
        rows.push(['TOTAL', '', '', '', '', formatearTiempo(estadisticas.totalSegundos), (estadisticas.totalSegundos / 3600).toFixed(2), '']);

        const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', tipoExportacion === 'todo'
            ? `reporte_${user.username}_completo_${new Date().toISOString().split('T')[0]}.csv`
            : `reporte_${user.username}_${rangoFechas.inicio}_${rangoFechas.fin}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        setDialogExportar(false);
    };

    const infoCards = [
        {
            icon: <Assessment />, color: '#36B37E', title: 'Datos incluidos',
            items: ['Fecha de cada entrada', 'Nombre de la tarea', 'Estado', 'Horas de inicio y fin', 'Duración total', 'Número de sesiones']
        },
        {
            icon: <DateRange />, color: '#FF991F', title: 'Opciones',
            items: ['Todo: historial completo', 'Rango: fechas específicas']
        },
        {
            icon: <InsertDriveFile />, color: '#6554C0', title: 'Formato CSV',
            items: ['Microsoft Excel', 'Google Sheets', 'LibreOffice Calc']
        },
    ];

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>Reportes</Typography>

            {/* Main export card */}
            <Paper sx={{ p: 5, textAlign: 'center', mb: 3 }}>
                <Box sx={{
                    width: 56, height: 56, borderRadius: '12px', bgcolor: '#DEEBFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    <Download sx={{ fontSize: 28, color: '#0052CC' }} />
                </Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    Exportar reporte de actividades
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 440, mx: 'auto' }}>
                    Descarga un archivo CSV con el registro detallado de tus actividades.
                    Puedes exportar todo tu historial o un rango de fechas específico.
                </Typography>
                <Button variant="contained" startIcon={<Download />} onClick={() => setDialogExportar(true)}
                    sx={{ px: 3 }}>
                    Generar reporte
                </Button>
            </Paper>

            {/* Info cards */}
            <Grid container spacing={2}>
                {infoCards.map((card) => (
                    <Grid key={card.title} size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <Box sx={{ color: card.color, display: 'flex', '& svg': { fontSize: 20 } }}>{card.icon}</Box>
                                <Typography variant="body1" fontWeight={600}>{card.title}</Typography>
                            </Box>
                            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                                {card.items.map((item, i) => (
                                    <Typography key={i} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                                        {item}
                                    </Typography>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Export dialog */}
            <Dialog open={dialogExportar} onClose={() => setDialogExportar(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Exportar reporte</DialogTitle>
                <DialogContent>
                    <FormControl component="fieldset" sx={{ mt: 1, mb: 2 }}>
                        <FormLabel component="legend" sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#626F86' }}>
                            Período
                        </FormLabel>
                        <RadioGroup value={tipoExportacion} onChange={(e) => setTipoExportacion(e.target.value)} sx={{ mt: 0.5 }}>
                            <FormControlLabel value="todo" control={<Radio size="small" />}
                                label={<Typography variant="body2">Todo el historial</Typography>} />
                            <FormControlLabel value="rango" control={<Radio size="small" />}
                                label={<Typography variant="body2">Rango personalizado</Typography>} />
                        </RadioGroup>
                    </FormControl>

                    {tipoExportacion === 'rango' && (
                        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ mb: 0.5, color: '#626F86' }}>DESDE</Typography>
                                <DatePicker
                                    value={dayjs(rangoFechas.inicio)}
                                    onChange={(val) => val && setRangoFechas({ ...rangoFechas, inicio: val.format('YYYY-MM-DD') })}
                                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ mb: 0.5, color: '#626F86' }}>HASTA</Typography>
                                <DatePicker
                                    value={dayjs(rangoFechas.fin)}
                                    onChange={(val) => val && setRangoFechas({ ...rangoFechas, fin: val.format('YYYY-MM-DD') })}
                                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                />
                            </Box>
                        </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#626F86' }}>RESUMEN</Typography>

                    {entradas.length === 0 ? (
                        <Alert severity="warning" sx={{
                            bgcolor: '#FFF0B3', color: '#FF8B00', borderRadius: 1,
                            '& .MuiAlert-icon': { color: '#FF991F' },
                        }}>
                            Sin datos para el período seleccionado
                        </Alert>
                    ) : (
                        <Box sx={{ bgcolor: '#F4F5F7', p: 2, borderRadius: 1, border: '1px solid #EBECF0' }}>
                            <Grid container spacing={1.5}>
                                {[
                                    { label: 'Usuario', value: user.username },
                                    { label: 'Período', value: tipoExportacion === 'todo' ? 'Completo' : `${rangoFechas.inicio} — ${rangoFechas.fin}` },
                                    { label: 'Entradas', value: estadisticas.totalEntradas },
                                    { label: 'Tareas', value: estadisticas.totalTareas },
                                    { label: 'Tiempo total', value: `${formatearTiempoCorto(estadisticas.totalSegundos)} (${formatearTiempo(estadisticas.totalSegundos)})`, full: true },
                                ].map((item, i) => (
                                    <Grid key={i} size={{ xs: item.full ? 12 : 6 }}>
                                        <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                                        <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogExportar(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
                    <Button variant="contained" onClick={exportarCSV} disabled={entradas.length === 0} startIcon={<Download />}>
                        Descargar CSV
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
