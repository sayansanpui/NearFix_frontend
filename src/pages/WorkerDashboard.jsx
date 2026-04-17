import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const initialForm = {
    name: "",
    skill: "",
    price: "",
    lat: "",
    lng: "",
    imageUrl: "",
};

export default function WorkerDashboard() {
    const { token } = useAuth();
    const [formData, setFormData] = useState(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!token) {
            setErrorMessage("You must be logged in to add a worker.");
            setSuccessMessage("");
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage("");
            setSuccessMessage("");
            const baseUrl = import.meta.env.VITE_API_URL || "";

            const payload = {
                name: formData.name.trim(),
                skill: formData.skill.trim(),
                price: Number(formData.price),
                lat: Number(formData.lat),
                lng: Number(formData.lng),
                imageUrl: formData.imageUrl.trim(),
            };

            const response = await fetch(`${baseUrl}/api/workers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to create worker");
            }

            setSuccessMessage("Worker created successfully.");
            setFormData(initialForm);
        } catch (error) {
            setErrorMessage(error.message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
            <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
                <h1 className="text-2xl font-semibold">Worker Dashboard</h1>
                <p className="mt-2 text-slate-400">Add a new worker profile.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-slate-300" htmlFor="name">
                            Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-sky-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-slate-300" htmlFor="skill">
                            Skill
                        </label>
                        <input
                            id="skill"
                            name="skill"
                            type="text"
                            value={formData.skill}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-sky-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-slate-300" htmlFor="price">
                            Price
                        </label>
                        <input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-sky-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm text-slate-300" htmlFor="lat">
                                Latitude
                            </label>
                            <input
                                id="lat"
                                name="lat"
                                type="number"
                                step="any"
                                value={formData.lat}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-sky-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm text-slate-300" htmlFor="lng">
                                Longitude
                            </label>
                            <input
                                id="lng"
                                name="lng"
                                type="number"
                                step="any"
                                value={formData.lng}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-sky-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-slate-300" htmlFor="imageUrl">
                            Image URL
                        </label>
                        <input
                            id="imageUrl"
                            name="imageUrl"
                            type="url"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-sky-500"
                        />
                    </div>

                    {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
                    {successMessage && <p className="text-sm text-emerald-400">{successMessage}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Submitting..." : "Create Worker"}
                    </button>
                </form>
            </div>
        </div>
    );
}
