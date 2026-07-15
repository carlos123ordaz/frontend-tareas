import { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const ThemeContext = createContext();

// Atlassian Design System tokens
const atlassianTokens = {
    light: {
        primary: { main: '#0052CC', light: '#4C9AFF', dark: '#0747A6', contrastText: '#FFFFFF' },
        secondary: { main: '#6554C0', light: '#998DD9', dark: '#403294' },
        success: { main: '#36B37E', light: '#ABF5D1', dark: '#006644' },
        warning: { main: '#FF991F', light: '#FFF0B3', dark: '#FF8B00' },
        error: { main: '#DE350B', light: '#FFBDAD', dark: '#BF2600' },
        info: { main: '#0065FF', light: '#B3D4FF', dark: '#0747A6' },
        background: { default: '#FAFBFC', paper: '#FFFFFF' },
        text: { primary: '#172B4D', secondary: '#626F86', disabled: '#A5ADBA' },
        divider: '#EBECF0',
        action: { hover: '#F4F5F7', selected: '#DEEBFF', disabledBackground: '#F4F5F7' },
    },
    dark: {
        primary: { main: '#4C9AFF', light: '#B3D4FF', dark: '#0052CC', contrastText: '#1D2125' },
        secondary: { main: '#998DD9', light: '#C0B6F2', dark: '#6554C0' },
        success: { main: '#57D9A3', light: '#79F2C0', dark: '#36B37E' },
        warning: { main: '#FFC400', light: '#FFE380', dark: '#FF991F' },
        error: { main: '#FF5630', light: '#FF8F73', dark: '#DE350B' },
        info: { main: '#4C9AFF', light: '#B3D4FF', dark: '#0065FF' },
        background: { default: '#1D2125', paper: '#22272B' },
        text: { primary: '#B6C2CF', secondary: '#8C9BAB', disabled: '#5E6C84' },
        divider: '#A1BDD914',
        action: { hover: '#A1BDD914', selected: '#A1BDD929', disabledBackground: '#A1BDD914' },
    },
};

export function ThemeContextProvider({ children }) {
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode || 'light';
    });

    useEffect(() => {
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const tokens = atlassianTokens[mode];

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    ...tokens,
                },
                typography: {
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                    h4: { fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.01em' },
                    h5: { fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em' },
                    h6: { fontWeight: 600, fontSize: '1.1rem', letterSpacing: '-0.01em' },
                    subtitle1: { fontWeight: 500, fontSize: '0.875rem', color: tokens.text.secondary },
                    subtitle2: { fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: tokens.text.secondary },
                    body1: { fontSize: '0.875rem', lineHeight: 1.6 },
                    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
                    button: { textTransform: 'none', fontWeight: 500 },
                },
                shape: { borderRadius: 3 },
                shadows: Array(25).fill('none').map((_, i) => {
                    if (i === 0) return 'none';
                    if (i === 1) return mode === 'light'
                        ? '0 1px 1px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31)'
                        : '0 1px 1px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.6)';
                    if (i <= 4) return mode === 'light'
                        ? '0 4px 8px -2px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31)'
                        : '0 4px 8px -2px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.6)';
                    return mode === 'light'
                        ? '0 8px 16px -4px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31)'
                        : '0 8px 16px -4px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.6)';
                }),
                components: {
                    MuiCssBaseline: {
                        styleOverrides: {
                            body: {
                                scrollbarWidth: 'thin',
                                scrollbarColor: mode === 'light' ? '#C1C7D0 transparent' : '#5E6C84 transparent',
                            },
                            '*::-webkit-scrollbar': { width: '8px' },
                            '*::-webkit-scrollbar-thumb': {
                                borderRadius: '4px',
                                backgroundColor: mode === 'light' ? '#C1C7D0' : '#5E6C84',
                            },
                        },
                    },
                    MuiAppBar: {
                        defaultProps: { elevation: 0 },
                        styleOverrides: {
                            root: {
                                backgroundColor: mode === 'light' ? '#FFFFFF' : '#282E33',
                                borderBottom: `1px solid ${mode === 'light' ? '#EBECF0' : '#A1BDD914'}`,
                            },
                        },
                    },
                    MuiDrawer: {
                        styleOverrides: {
                            paper: {
                                backgroundColor: mode === 'light' ? '#FAFBFC' : '#1D2125',
                                borderRight: `1px solid ${mode === 'light' ? '#EBECF0' : '#A1BDD914'}`,
                            },
                        },
                    },
                    MuiButton: {
                        defaultProps: { disableElevation: true },
                        styleOverrides: {
                            root: { borderRadius: 3, fontWeight: 500, padding: '6px 12px', fontSize: '0.875rem' },
                            containedPrimary: {
                                '&:hover': { backgroundColor: mode === 'light' ? '#0747A6' : '#B3D4FF' },
                            },
                        },
                    },
                    MuiPaper: {
                        defaultProps: { elevation: 0 },
                        styleOverrides: {
                            root: {
                                border: `1px solid ${mode === 'light' ? '#EBECF0' : '#A1BDD914'}`,
                                borderRadius: 8,
                            },
                        },
                    },
                    MuiCard: {
                        defaultProps: { elevation: 0 },
                        styleOverrides: {
                            root: {
                                border: `1px solid ${mode === 'light' ? '#EBECF0' : '#A1BDD914'}`,
                                borderRadius: 8,
                            },
                        },
                    },
                    MuiChip: {
                        styleOverrides: {
                            root: { borderRadius: 3, fontWeight: 600, fontSize: '0.6875rem', height: 20, textTransform: 'uppercase' },
                        },
                    },
                    MuiTableHead: {
                        styleOverrides: {
                            root: {
                                '& .MuiTableCell-head': {
                                    fontWeight: 600,
                                    fontSize: '0.6875rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    color: tokens.text.secondary,
                                    backgroundColor: mode === 'light' ? '#FAFBFC' : '#282E33',
                                    borderBottom: `2px solid ${mode === 'light' ? '#EBECF0' : '#A1BDD914'}`,
                                    padding: '8px 16px',
                                },
                            },
                        },
                    },
                    MuiTableCell: {
                        styleOverrides: {
                            root: {
                                borderBottom: `1px solid ${mode === 'light' ? '#EBECF0' : '#A1BDD914'}`,
                                padding: '10px 16px',
                                fontSize: '0.875rem',
                            },
                        },
                    },
                    MuiTableRow: {
                        styleOverrides: {
                            root: {
                                '&:hover': { backgroundColor: mode === 'light' ? '#F4F5F7' : '#A1BDD914' },
                                transition: 'background-color 0.1s ease',
                            },
                        },
                    },
                    MuiTextField: {
                        defaultProps: { size: 'small' },
                        styleOverrides: {
                            root: {
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    '& fieldset': { borderColor: mode === 'light' ? '#DFE1E6' : '#A1BDD914' },
                                    '&:hover fieldset': { borderColor: mode === 'light' ? '#C1C7D0' : '#A1BDD929' },
                                    '&.Mui-focused fieldset': { borderColor: tokens.primary.main, borderWidth: 2 },
                                },
                            },
                        },
                    },
                    MuiSelect: {
                        defaultProps: { size: 'small' },
                        styleOverrides: {
                            root: { borderRadius: 3 },
                        },
                    },
                    MuiDialog: {
                        styleOverrides: {
                            paper: { borderRadius: 8, border: 'none' },
                        },
                    },
                    MuiDialogTitle: {
                        styleOverrides: {
                            root: {
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                padding: '24px 24px 8px',
                            },
                        },
                    },
                    MuiTooltip: {
                        styleOverrides: {
                            tooltip: {
                                backgroundColor: mode === 'light' ? '#172B4D' : '#B6C2CF',
                                color: mode === 'light' ? '#FFFFFF' : '#1D2125',
                                fontSize: '0.75rem',
                                borderRadius: 3,
                                padding: '4px 8px',
                            },
                        },
                    },
                    MuiListItemButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: 6,
                                margin: '2px 8px',
                                padding: '8px 12px',
                                '&.Mui-selected': {
                                    backgroundColor: mode === 'light' ? '#DEEBFF' : '#A1BDD929',
                                    color: tokens.primary.main,
                                    '&:hover': { backgroundColor: mode === 'light' ? '#B3D4FF' : '#A1BDD940' },
                                },
                            },
                        },
                    },
                    MuiAvatar: {
                        styleOverrides: {
                            root: {
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                            },
                        },
                    },
                    // DatePicker / Calendar Atlassian styling
                    MuiPickersDay: {
                        styleOverrides: {
                            root: {
                                borderRadius: 3,
                                fontSize: '0.8125rem',
                                '&.Mui-selected': {
                                    backgroundColor: tokens.primary.main,
                                    '&:hover': { backgroundColor: mode === 'light' ? '#0747A6' : '#B3D4FF' },
                                },
                                '&:hover': { backgroundColor: mode === 'light' ? '#DEEBFF' : '#A1BDD914' },
                            },
                        },
                    },
                    MuiPickersCalendarHeader: {
                        styleOverrides: {
                            root: { paddingLeft: 16, paddingRight: 8 },
                            label: { fontSize: '0.875rem', fontWeight: 600 },
                            switchViewButton: { color: tokens.text.secondary },
                        },
                    },
                    MuiDayCalendar: {
                        styleOverrides: {
                            weekDayLabel: {
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                color: tokens.text.secondary,
                                textTransform: 'uppercase',
                            },
                        },
                    },
                    MuiDateCalendar: {
                        styleOverrides: {
                            root: { width: 280 },
                        },
                    },
                    MuiPickersPopper: {
                        styleOverrides: {
                            paper: {
                                borderRadius: 8,
                                border: `1px solid ${mode === 'light' ? '#EBECF0' : '#A1BDD914'}`,
                                boxShadow: mode === 'light'
                                    ? '0 4px 8px -2px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31)'
                                    : '0 4px 8px -2px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.6)',
                            },
                        },
                    },
                    MuiPickersYear: {
                        styleOverrides: {
                            yearButton: {
                                borderRadius: 3,
                                fontSize: '0.8125rem',
                                '&.Mui-selected': { backgroundColor: tokens.primary.main },
                            },
                        },
                    },
                },
            }),
        [mode, tokens]
    );

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
}
