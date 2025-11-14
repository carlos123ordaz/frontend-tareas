import { createContext, useState, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { CONFIG } from "../config";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [entradaActiva, setEntradaActiva] = useState(null);
    const [historial, setHistorial] = useState([]);
    const fechaHoy = new Date().toISOString().split('T')[0];
    const entradaRef = useRef(entradaActiva);
    const userRef = useRef(user);

    useEffect(() => {
        entradaRef.current = entradaActiva;
    }, [entradaActiva]);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const pausarTimer = async (user_param) => {
        try {
            const response = await fetch(`${CONFIG.uri}/entries/pause`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user_param._id })
            });
            if (response.ok) {
                const data = await response.json();
                setEntradaActiva(data.entry);
                cargarHistorial(user_param);
            }
        } catch (error) {
            console.error('Error al pausar:', error);
        }
    };

    const cargarHistorial = async (user_param) => {
        try {
            const response = await fetch(`${CONFIG.uri}/entries/user/${user_param._id}/date/${fechaHoy}`);
            if (response.ok) {
                const data = await response.json();
                setHistorial(data);
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
        }
    };

    useEffect(() => {
        let unlistenInactive;
        let unlistenClose;

        const setupListeners = async () => {
            unlistenInactive = await listen("user_inactive", (_) => {
                if (!userRef.current || !entradaRef.current) return;
                if (entradaRef.current.estado === 'activo' && entradaRef.current.withPause) {
                    pausarTimer(userRef.current);
                }
            });

            unlistenClose = await listen("confirm_close", async () => {
                if (!userRef.current || !entradaRef.current) {
                    await invoke("force_close");
                    return;
                }

                if (entradaRef.current.estado === 'activo') {
                    alert("No se puede cerrar la aplicación mientras la entrada está activa.");
                } else {
                    await invoke("force_close");
                }
            });
        };

        setupListeners();

        return () => {
            if (unlistenInactive) unlistenInactive();
            if (unlistenClose) unlistenClose();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, entradaActiva, setEntradaActiva, historial, setHistorial, pausarTimer, cargarHistorial }}>
            {children}
        </AuthContext.Provider>
    );
};