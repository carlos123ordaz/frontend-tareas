import { createContext, useState, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
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
        const unlistenPromise = listen("user_inactive", (_) => {
            if (!userRef.current || !entradaRef.current) return;
            if (entradaRef.current.estado === 'activo' && entradaRef.current.withPause) {
                pausarTimer(userRef.current);
            }
        });

        const handleBeforeUnload = (_) => {
            if (entradaRef.current && entradaRef.current.estado === "activo") {
                pausarTimer(userRef.current);
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, entradaActiva, setEntradaActiva, historial, setHistorial, pausarTimer, cargarHistorial }}>
            {children}
        </AuthContext.Provider>
    );
};
