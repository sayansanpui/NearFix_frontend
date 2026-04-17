export default function WorkerCard({ worker }) {
    const handleBookNow = () => {
        window.alert("Booking Confirmed");
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-white">
                {worker?.name || "Unknown Worker"}
            </h2>

            <p className="text-slate-300 mt-2">
                <span className="text-slate-400">Skill:</span> {worker?.skill || "N/A"}
            </p>

            <p className="text-slate-300 mt-1">
                <span className="text-slate-400">Price:</span> {worker?.price ?? "N/A"}
            </p>

            <button
                type="button"
                onClick={handleBookNow}
                className="mt-4 w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-white transition hover:bg-sky-400"
            >
                Book Now
            </button>
        </div>
    );
}