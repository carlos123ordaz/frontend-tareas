import { useState, useEffect, useContext } from 'react';
import {
    AppBar,
    Toolbar,
    Drawer,
    Box,
    Typography,
    Button,
    IconButton,
    List,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Avatar,
    Divider,
    Tooltip,
} from '@mui/material';
import {
    Timer,
    Dashboard,
    Assessment,
    Menu as MenuIcon,
    Brightness4,
    Brightness7,
    ControlPoint,
    PictureInPictureAlt,
    LogoutRounded,
    ChevronLeft,
} from '@mui/icons-material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { invoke } from '@tauri-apps/api/core';

const drawerWidth = 240;

export default function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [modoMini, setModoMini] = useState(() => localStorage.getItem('modoMini') === 'true');
    const { mode, toggleTheme } = useContext(ThemeContext);
    const { setUser, user } = useContext(AuthContext);

    useEffect(() => {
        const usuario = localStorage.getItem('user');
        if (!usuario) {
            navigate('/login');
        } else {
            setUser(JSON.parse(usuario));
        }
    }, []);

    useEffect(() => {
        const syncMiniMode = () => {
            setModoMini(localStorage.getItem('modoMini') === 'true');
        };
        window.addEventListener('mini-mode-changed', syncMiniMode);
        window.addEventListener('storage', syncMiniMode);
        return () => {
            window.removeEventListener('mini-mode-changed', syncMiniMode);
            window.removeEventListener('storage', syncMiniMode);
        };
    }, []);

    useEffect(() => {
        if (modoMini && location.pathname !== '/timer' && location.pathname !== '/') {
            navigate('/timer');
        }
    }, [modoMini, location.pathname, navigate]);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const actualizarModoMini = async (enabled) => {
        try {
            await invoke('set_mini_mode', { enabled });
            localStorage.setItem('modoMini', String(enabled));
            setModoMini(enabled);
            window.dispatchEvent(new Event('mini-mode-changed'));
        } catch (error) {
            console.error('Error al cambiar modo mini:', error);
            alert('No se pudo cambiar al modo mini');
        }
    };

    const isActive = (ruta) => {
        if (ruta === '/timer') return location.pathname === '/timer' || location.pathname === '/';
        return location.pathname === ruta;
    };

    const menuItems = [
        { texto: 'Timer', icono: <Timer />, ruta: '/timer' },
        { texto: 'Dashboard', icono: <Dashboard />, ruta: '/dashboard' },
        { texto: 'Reportes', icono: <Assessment />, ruta: '/reportes' },
        ...(user?.esLider ? [{ texto: 'Control', icono: <ControlPoint />, ruta: '/team-dashboard' }] : [])
    ];

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Brand header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                    width: 32, height: 32, borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0052CC 0%, #4C9AFF 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Timer sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem' }}>
                    TimeTracker
                </Typography>
            </Box>

            <Divider />

            {/* Navigation */}
            <List sx={{ px: 0.5, pt: 1.5, flex: 1 }}>
                {menuItems.map((item) => {
                    const active = isActive(item.ruta);
                    return (
                        <ListItemButton
                            key={item.ruta}
                            selected={active}
                            onClick={() => {
                                navigate(item.ruta);
                                if (mobileOpen) setMobileOpen(false);
                            }}
                            sx={{ mb: 0.25 }}
                        >
                            <ListItemIcon sx={{
                                minWidth: 36,
                                color: active ? 'primary.main' : 'text.secondary',
                            }}>
                                {item.icono}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.texto}
                                primaryTypographyProps={{
                                    fontSize: '0.875rem',
                                    fontWeight: active ? 600 : 400,
                                    color: active ? 'primary.main' : 'text.primary',
                                }}
                            />
                            {active && (
                                <Box sx={{
                                    width: 3, height: 20, borderRadius: 2,
                                    bgcolor: 'primary.main', position: 'absolute', left: 0,
                                }} />
                            )}
                        </ListItemButton>
                    );
                })}
            </List>

            {/* User section at bottom */}
            <Box sx={{ p: 1.5 }}>
                <Divider sx={{ mb: 1.5 }} />
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1, borderRadius: 1.5,
                    bgcolor: mode === 'light' ? '#F4F5F7' : '#282E33',
                }}>
                    <Avatar sx={{
                        width: 32, height: 32,
                        bgcolor: 'primary.main',
                        fontSize: '0.75rem',
                    }}>
                        {user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                            {user?.nombre || user?.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {user?.username}
                        </Typography>
                    </Box>
                    <Tooltip title="Cerrar sesión">
                        <IconButton size="small" onClick={handleLogout} sx={{ color: 'text.secondary' }}>
                            <LogoutRounded fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );

    if (modoMini) {
        return (
            <Box component="main" sx={{ minHeight: '100vh', p: 1, bgcolor: 'background.default' }}>
                <Outlet />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                }}
            >
                <Toolbar variant="dense" sx={{ minHeight: 48 }}>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 1, display: { md: 'none' }, color: 'text.primary' }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Page title */}
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {menuItems.find(m => isActive(m.ruta))?.texto || 'Timer'}
                    </Typography>

                    <Box sx={{ flexGrow: 1 }} />

                    <Tooltip title="Modo compacto">
                        <Button
                            size="small"
                            startIcon={<PictureInPictureAlt sx={{ fontSize: '18px !important' }} />}
                            onClick={() => actualizarModoMini(true)}
                            sx={{
                                mr: 1, color: 'text.secondary',
                                fontSize: '0.8125rem',
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            Mini
                        </Button>
                    </Tooltip>

                    <Tooltip title={mode === 'light' ? 'Tema oscuro' : 'Tema claro'}>
                        <IconButton onClick={toggleTheme} size="small" sx={{ color: 'text.secondary' }}>
                            {mode === 'light' ? <Brightness4 fontSize="small" /> : <Brightness7 fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    mt: '48px',
                    bgcolor: 'background.default',
                    minHeight: '100vh',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}
