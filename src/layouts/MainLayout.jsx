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
} from '@mui/material';
import {
    Timer,
    Dashboard,
    Assessment,
    Menu as MenuIcon,
    Brightness4,
    Brightness7,
    ControlPoint,
} from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';
import { CONFIG } from '../config';

const drawerWidth = 240;

export default function MainLayout() {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
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

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };
    const menuItems = [
        { texto: 'Timer', icono: <Timer />, ruta: '/timer' },
        { texto: 'Dashboard', icono: <Dashboard />, ruta: '/dashboard' },
        { texto: 'Reportes', icono: <Assessment />, ruta: '/reportes' },
        ...(user?.esLider ? [{
            texto: 'Control',
            icono: <ControlPoint />,
            ruta: '/team-dashboard'
        }] : [])
    ];

    const drawer = (
        <Box>
            <Box sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Timer sx={{ color: '#03a9f4', fontSize: 28 }} />
                <Typography variant="h6" fontWeight="700" sx={{ color: '#03a9f4' }}>
                    TimeTracker
                </Typography>
            </Box>
            <List sx={{ px: 1, pt: 2 }}>
                {menuItems.map((item) => (
                    <ListItemButton
                        key={item.ruta}
                        onClick={() => {
                            navigate(item.ruta);
                            if (mobileOpen) setMobileOpen(false);
                        }}
                        sx={{
                            mb: 0.5,
                            borderRadius: 1,
                            '&:hover': {
                                bgcolor: mode === 'light' ? '#e3f2fd' : 'rgba(3, 169, 244, 0.15)',
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            {item.icono}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.texto}
                            primaryTypographyProps={{
                                fontSize: '0.9rem'
                            }}
                        />
                    </ListItemButton>
                ))}
            </List>

            <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleLogout}
                    sx={{
                        textTransform: 'none',
                        borderColor: 'divider',
                        color: 'text.secondary',
                        '&:hover': {
                            borderColor: '#03a9f4',
                            bgcolor: mode === 'light' ? '#e3f2fd' : 'rgba(3, 169, 244, 0.15)',
                        }
                    }}
                >
                    Cerrar Sesión
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box sx={{ flexGrow: 1 }} />

                    <IconButton
                        onClick={toggleTheme}
                        sx={{ mr: 2 }}
                        title={mode === 'light' ? 'Activar tema oscuro' : 'Activar tema claro'}
                    >
                        {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
                    </IconButton>

                    <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary' }}>
                        {user && user.username}
                    </Typography>

                    <Avatar sx={{ bgcolor: '#03a9f4', width: 32, height: 32, fontSize: '0.875rem' }}>
                        {user && user.username.charAt(0).toUpperCase()}
                    </Avatar>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
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
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            borderRight: '1px solid',
                            borderColor: 'divider',
                        },
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
                    mt: 8,
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}