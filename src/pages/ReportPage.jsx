import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Grid,
    Card,
    CardContent,
    Divider,
    Alert,
} from '@mui/material';
import {
    Download,
    InsertDriveFile,
    DateRange,
    Assessment,
} from '@mui/icons-material';
import { CONFIG } from '../config';

export const ReportPage = () => {
    const [dialogExportar, setDialogExportar] = useState(false);
    const [tipoExportacion, setTipoExportacion] = useState('todo');
    const [rangoFechas, setRangoFechas] = useState({
        inicio: new Date().toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
    });
    const [entradas, setEntradas] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        totalEntradas: 0,
        totalSegundos: 0,
        totalTareas: 0,
        fechaInicio: null,
        fechaFin: null
    });

    const userId = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    useEffect(() => {
        if (dialogExportar) {
            cargarDatosParaExportar();
        }
    }, [dialogExportar, tipoExportacion, rangoFechas]);

    const cargarDatosParaExportar = async () => {
        try {
            let url;
            let fechaInicio, fechaFin;

            if (tipoExportacion === 'todo') {
                const hoy = new Date().toISOString().split('T')[0];
                const hace1Año = new Date();
                hace1Año.setFullYear(hace1Año.getFullYear() - 1);
                fechaInicio = hace1Año.toISOString().split('T')[0];
                fechaFin = hoy;
            } else {
                fechaInicio = rangoFechas.inicio;
                fechaFin = rangoFechas.fin;
            }

            url = `${CONFIG.uri}/entries/user/${userId}/range/${fechaInicio}/${fechaFin}`;

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setEntradas(data);

                const tareasUnicas = new Set();
                let totalSegundos = 0;

                data.forEach(entrada => {
                    tareasUnicas.add(entrada.taskId);
                    totalSegundos += entrada.duracionTotal;
                });

                setEstadisticas({
                    totalEntradas: data.length,
                    totalSegundos,
                    totalTareas: tareasUnicas.size,
                    fechaInicio,
                    fechaFin
                });
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
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

    const formatearFecha = (isoString) => {
        const fecha = new Date(isoString);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatearHora = (isoString) => {
        const fecha = new Date(isoString);
        return fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const exportarCSV = () => {
        const headers = [
            'Fecha',
            'Tarea',
            'Estado',
            'Hora Inicio',
            'Hora Fin',
            'Duración (HH:MM:SS)',
            'Duración (Horas)',
            'Sesiones'
        ];

        const rows = entradas.map(entrada => {
            const primeraHora = entrada.segmentos.length > 0
                ? formatearHora(entrada.segmentos[0].inicio)
                : '-';
            const ultimaHora = entrada.segmentos.length > 0 && entrada.segmentos[entrada.segmentos.length - 1].fin
                ? formatearHora(entrada.segmentos[entrada.segmentos.length - 1].fin)
                : 'En curso';

            return [
                formatearFecha(entrada.fecha),
                `"${entrada.tarea}"`,
                entrada.estado,
                primeraHora,
                ultimaHora,
                formatearTiempo(entrada.duracionTotal),
                (entrada.duracionTotal / 3600).toFixed(2),
                entrada.segmentos.length
            ];
        });

        const totalHoras = (estadisticas.totalSegundos / 3600).toFixed(2);
        rows.push([]);
        rows.push(['TOTAL', '', '', '', '', formatearTiempo(estadisticas.totalSegundos), totalHoras, '']);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const nombreArchivo = tipoExportacion === 'todo'
            ? `reporte_timetracker_${username}_completo_${new Date().toISOString().split('T')[0]}.csv`
            : `reporte_timetracker_${username}_${rangoFechas.inicio}_${rangoFechas.fin}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', nombreArchivo);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDialogExportar(false);
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight="600" gutterBottom>
                Reportes
            </Typography>

            {/* Card principal */}
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
                <InsertDriveFile sx={{ fontSize: 64, color: '#03a9f4', mb: 2 }} />
                <Typography variant="h6" fontWeight="600" gutterBottom>
                    Exportar Reporte de Actividades
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
                    Descarga un archivo CSV con el registro detallado de tus actividades.
                    Podrás elegir exportar todo tu historial o un rango de fechas específico.
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<Download />}
                    onClick={() => setDialogExportar(true)}
                    sx={{
                        bgcolor: '#03a9f4',
                        textTransform: 'none',
                        boxShadow: 'none',
                        px: 4,
                        py: 1.5,
                        fontSize: '1rem',
                        '&:hover': {
                            bgcolor: '#0288d1',
                            boxShadow: 'none',
                        }
                    }}
                >
                    Generar Reporte
                </Button>
            </Paper>

            {/* Información sobre el CSV */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Assessment sx={{ color: '#4CAF50' }} />
                                <Typography variant="h6" fontWeight="600">
                                    Datos Incluidos
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                • Fecha de cada entrada<br />
                                • Nombre de la tarea<br />
                                • Estado (activo/pausado/completado)<br />
                                • Horas de inicio y fin<br />
                                • Duración total<br />
                                • Número de sesiones
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <DateRange sx={{ color: '#FF9800' }} />
                                <Typography variant="h6" fontWeight="600">
                                    Opciones de Exportación
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                • <strong>Todo:</strong> Exporta todas tus entradas históricas<br />
                                • <strong>Rango:</strong> Selecciona fechas específicas para exportar solo ese período
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <InsertDriveFile sx={{ color: '#9C27B0' }} />
                                <Typography variant="h6" fontWeight="600">
                                    Formato CSV
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                El archivo descargado es compatible con:<br />
                                • Microsoft Excel<br />
                                • Google Sheets<br />
                                • LibreOffice Calc<br />
                                • Cualquier editor de hojas de cálculo
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialog de exportación */}
            <Dialog
                open={dialogExportar}
                onClose={() => setDialogExportar(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Download />
                        Exportar Reporte
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <FormControl component="fieldset" sx={{ mt: 2, mb: 3 }}>
                        <FormLabel component="legend">Selecciona el período a exportar</FormLabel>
                        <RadioGroup
                            value={tipoExportacion}
                            onChange={(e) => setTipoExportacion(e.target.value)}
                            sx={{ mt: 1 }}
                        >
                            <FormControlLabel
                                value="todo"
                                control={<Radio />}
                                label="Todo el historial"
                            />
                            <FormControlLabel
                                value="rango"
                                control={<Radio />}
                                label="Rango de fechas personalizado"
                            />
                        </RadioGroup>
                    </FormControl>

                    {tipoExportacion === 'rango' && (
                        <Box sx={{ mb: 3 }}>
                            <TextField
                                fullWidth
                                label="Fecha Inicio"
                                type="date"
                                value={rangoFechas.inicio}
                                onChange={(e) => setRangoFechas({ ...rangoFechas, inicio: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Fecha Fin"
                                type="date"
                                value={rangoFechas.fin}
                                onChange={(e) => setRangoFechas({ ...rangoFechas, fin: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                        Resumen de Exportación
                    </Typography>

                    {entradas.length === 0 ? (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            No hay datos disponibles para el período seleccionado
                        </Alert>
                    ) : (
                        <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Usuario
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {username}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Período
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {tipoExportacion === 'todo'
                                            ? 'Completo'
                                            : `${rangoFechas.inicio} - ${rangoFechas.fin}`}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Entradas
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {estadisticas.totalEntradas}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Tareas diferentes
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {estadisticas.totalTareas}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Tiempo total
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {formatearTiempoCorto(estadisticas.totalSegundos)} ({formatearTiempo(estadisticas.totalSegundos)})
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDialogExportar(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={exportarCSV}
                        disabled={entradas.length === 0}
                        startIcon={<Download />}
                        sx={{
                            bgcolor: '#03a9f4',
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: '#0288d1',
                                boxShadow: 'none',
                            }
                        }}
                    >
                        Descargar CSV
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};