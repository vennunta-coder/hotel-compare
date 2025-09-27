"use client";
import { useState } from "react";
import { Search, Star, Calendar, Filter, MapPin, ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";

// Import do mapa só no client (Next.js requer isso)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

type Hotel = {
  hotel: {
    name: string;
    address?: { cityName?: string };
    rating?: string;
    latitude?: number;
    longitude?: number;
  };
  offers?: { price?: { total?: string }; self?: string }[];
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [minStars, setMinStars] = useState(0);
  const [maxPrice, setMaxPrice] = useState(9999);
  const [minRating, setMinRating] = useState(0);

  async function fetchHotels() {
    setLoading(true);
    const params = new URLSearchParams({
      city: search,
      checkInDate,
      checkOutDate,
    });
    const res = await fetch(`/api/hotels?${params.toString()}`);
    const data = await res.json();
    setHotels(data);
    setLoading(false);
  }

  // Aplicar filtros locais
  const filteredHotels = hotels.filter((hotel) => {
    const stars = parseInt(hotel.hotel?.rating || "0");
    const price = parseFloat(hotel.offers?.[0]?.price?.total || "0");

    return (
      (!minStars || stars >= minStars) &&
      (!maxPrice || price <= maxPrice) &&
      (!minRating || stars >= minRating)
    );
  });

  // Definir posição inicial do mapa (primeiro hotel ou Lisboa)
  const defaultPosition: [number, number] = [
    filteredHotels[0]?.hotel?.latitude || 38.7169,
    filteredHotels[0]?.hotel?.longitude || -9.139,
  ];

  return (
    <main className="min-h-screen flex">
      {/* Painel lateral de filtros */}
      <aside className="w-64 bg-white shadow p-4 hidden md:block overflow-y-auto">
        <h2 className="font-bold flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4" /> Filtros
        </h2>

        {/* Estrelas */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Estrelas mínimas</label>
          <select
            value={minStars}
            onChange={(e) => setMinStars(Number(e.target.value))}
            className="w-full p-2 border rounded-lg mt-1"
          >
            <option value={0}>Qualquer</option>
            <option value={3}>3 estrelas</option>
            <option value={4}>4 estrelas</option>
            <option value={5}>5 estrelas</option>
          </select>
        </div>

        {/* Preço máximo */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Preço máximo (€)</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full p-2 border rounded-lg mt-1"
          />
        </div>

        {/* Avaliação mínima */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Avaliação mínima</label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="w-full p-2 border rounded-lg mt-1"
          >
            <option value={0}>Qualquer</option>
            <option value={7}>7+</option>
            <option value={8}>8+</option>
            <option value={9}>9+</option>
          </select>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {/* Barra de busca */}
        <header className="bg-white shadow p-4 flex flex-wrap items-center gap-2">
          <Search className="text-gray-500" />
          <input
            type="text"
            placeholder="Digite uma cidade (ex: Lisboa, Paris, Nova York)..."
            className="flex-1 p-2 border rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-500" />
            <input
              type="date"
              className="p-2 border rounded-lg"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-500" />
            <input
              type="date"
              className="p-2 border rounded-lg"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
            />
          </div>
          <button
            onClick={fetchHotels}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Buscar
          </button>
        </header>

        <div className="flex-1 grid md:grid-cols-2">
          {/* Lista de resultados */}
          <section className="p-6 overflow-y-auto">
            {loading && <p>🔄 Carregando hotéis...</p>}
            {filteredHotels.map((hotel, i) => {
              const offer = hotel.offers?.[0];
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden mb-4"
                >
                  <div className="p-4">
                    <h2 className="font-bold text-lg">{hotel.hotel?.name}</h2>
                    <p className="text-sm text-gray-500">
                      {hotel.hotel?.address?.cityName || "Cidade desconhecida"}
                    </p>
                    <div className="flex items-center gap-1 my-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{hotel.hotel?.rating || "N/A"}</span>
                    </div>
                    <p className="text-xl font-semibold">
                      {offer?.price?.total
                        ? `€ ${offer.price.total}/noite`
                        : "Preço indisponível"}
                    </p>

                    {/* Botão Ver oferta */}
                    {offer?.self ? (
                      <a
                        href={offer.self}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg w-full flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver oferta
                      </a>
                    ) : (
                      <button
                        disabled
                        className="mt-3 bg-gray-400 text-white px-4 py-2 rounded-lg w-full"
                      >
                        Oferta indisponível
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Mapa */}
          <section className="relative">
            <MapContainer
              center={defaultPosition}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {filteredHotels.map((hotel, i) => {
                const lat = hotel.hotel?.latitude;
                const lng = hotel.hotel?.longitude;
                const offer = hotel.offers?.[0];
                if (!lat || !lng) return null;

                return (
                  <Marker key={i} position={[lat, lng]}>
                    <Popup>
                      <strong>{hotel.hotel?.name}</strong>
                      <br />
                      {offer?.price?.total
                        ? `€ ${offer.price.total}/noite`
                        : "Preço indisponível"}
                      <br />
                      {offer?.self && (
                        <a
                          href={offer.self}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Ver oferta
                        </a>
                      )}
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </section>
        </div>
      </div>
    </main>
  );
}
