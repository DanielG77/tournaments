import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { CheckCircle, XCircle } from "lucide-react";

const RegisterButton = ({ tournamentId, onRegistered }) => {
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [teams, setTeams] = useState([]);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [notice, setNotice] = useState(null);

    const getUser = () => {
        try {
            const raw = localStorage.getItem("user_data");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const user = getUser();

    const resolveCoachId = () => {
        if (!user) return localStorage.getItem("coach_test_id") || null;
        return user.id || user.user_id || localStorage.getItem("coach_test_id") || null;
    };

    const openModal = async () => {
        if (!user) {
            navigate("/login");
            return;
        }
        if (user.role !== "coach") {

            if (user.role === "admin") {
                setNotice({ type: "info", msg: "Menos partido y Ponte a trabajar." });
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
            else {
                setNotice({ type: "info", msg: "Eres jugador. Contacta con tu coach para registrarte." });
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
        }

        const coachId = resolveCoachId();
        if (!coachId) {
            setNotice({ type: "error", msg: "No se ha podido resolver el ID del coach. Guarda un coach_id o inicia sesión correctamente." });
            return;
        }

        setShowModal(true);
        setLoadingTeams(true);
        setNotice(null);
        setTeams([]);
        setSelectedTeam(null);

        try {
            const res = await api.get(`/tournaments/${tournamentId}/coach/${coachId}/eligible-teams`);
            const payload = res.data || {};

            const items = Array.isArray(payload) ? payload : (payload.teams || []);
            setTeams(items);

            if (!items || items.length === 0) {
                const msg = payload.message || "Tus equipos ya están registrados o no tienes equipos.";
                setNotice({ type: "info", msg });
            }
        } catch (err) {
            console.error("Error loading eligible teams:", err);
            const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Error al cargar equipos";
            setNotice({ type: "error", msg: detail });
        } finally {
            setLoadingTeams(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedTeam(null);
    };

    const handleRegister = async () => {
        if (!selectedTeam) {
            setNotice({ type: "error", msg: "Selecciona un equipo antes de continuar." });
            return;
        }

        const payload = { team_id: selectedTeam };

        setSubmitting(true);
        setNotice(null);

        try {
            const res = await api.post(`/tournaments/${tournamentId}/register`, payload);
            const status = res?.data?.status || "pending";
            setNotice({ type: "success", msg: `Equipo registrado correctamente. Estado: ${status}` });
            closeModal();
            if (typeof onRegistered === "function") onRegistered(res.data);
        } catch (err) {
            console.error("Register error:", err);
            const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Error al registrar";
            setNotice({ type: "error", msg: detail });
        } finally {
            setSubmitting(false);
        }
    };

    const NoticeBox = ({ notice }) => {
        if (!notice) return null;
        const color =
            notice.type === "success" ? "bg-green-800 text-green-200" :
                notice.type === "error" ? "bg-red-800 text-red-200" :
                    "bg-yellow-800 text-yellow-200";
        return (
            <div className={`rounded-md p-3 ${color} mb-3`} role="status">
                <div className="flex items-start gap-3">
                    {notice.type === "success" && <CheckCircle className="w-5 h-5" />}
                    {notice.type === "error" && <XCircle className="w-5 h-5" />}
                    <p className="text-sm">{notice.msg}</p>
                </div>
            </div>
        );
    };

    return (
        <>
            <NoticeBox notice={notice} />

            {/* Botón principal */}
            <button
                onClick={openModal}
                className="w-full bg-lol-gold text-lol-blue font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
            >
                Registrarse Ahora
            </button>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={closeModal}
                        aria-hidden="true"
                    />

                    <div className="relative w-full max-w-2xl mx-4 bg-gray-900 border border-gray-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Selecciona un equipo para registrar</h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-300 hover:text-white"
                                aria-label="Cerrar"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Contenido */}
                        <div className="space-y-4">
                            {loadingTeams ? (
                                <div className="py-8 flex justify-center">
                                    <div className="animate-spin w-10 h-10 rounded-full border-4 border-lol-gold border-t-transparent"></div>
                                </div>
                            ) : (
                                <>
                                    {teams.length === 0 ? (
                                        <p className="text-sm text-gray-400">No se encontraron equipos elegibles.</p>
                                    ) : (
                                        <div className="grid gap-3">
                                            {teams.map((t) => (
                                                <label
                                                    key={t.id}
                                                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${selectedTeam === t.id ? 'border-lol-gold bg-gray-800' : 'border-gray-700'} cursor-pointer`}
                                                >
                                                    <div>
                                                        <div className="text-sm font-semibold">{t.name}</div>
                                                        <div className="text-xs text-gray-400">{t.players_count ?? ''} jugadores</div>
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="selected_team"
                                                        value={t.id}
                                                        checked={selectedTeam === t.id}
                                                        onChange={() => setSelectedTeam(t.id)}
                                                        className="w-4 h-4"
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end gap-3 mt-4">
                                        <button
                                            onClick={closeModal}
                                            className="px-4 py-2 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800"
                                            disabled={submitting}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            onClick={handleRegister}
                                            className="px-4 py-2 rounded-md bg-lol-gold text-lol-blue font-semibold hover:bg-yellow-600 disabled:opacity-60"
                                            disabled={!selectedTeam || submitting}
                                        >
                                            {submitting ? "Registrando..." : "Registrar equipo"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RegisterButton;
