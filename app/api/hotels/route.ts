import { NextResponse } from "next/server";
import Amadeus from "amadeus";

// Configuração do Amadeus (sandbox)
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY!,
  clientSecret: process.env.AMADEUS_API_SECRET!,
  hostname: "test.api.amadeus.com", // Sandbox
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityName = searchParams.get("city") || "Lisboa";
  const checkInDate = searchParams.get("checkInDate");
  const checkOutDate = searchParams.get("checkOutDate");

  try {
    // 1. Buscar código IATA da cidade
    const cityResponse = await amadeus.referenceData.locations.get({
      keyword: cityName,
      subType: "CITY",
    });

    if (!cityResponse.data || cityResponse.data.length === 0) {
      return NextResponse.json(
        { error: "Cidade não encontrada" },
        { status: 404 }
      );
    }

    const cityCode = cityResponse.data[0].iataCode;

    // 2. Buscar hotéis com datas
    const response = await amadeus.shopping.hotelOffers.get({
      cityCode,
      checkInDate: checkInDate || undefined,
      checkOutDate: checkOutDate || undefined,
    });

    return NextResponse.json(response.data);
  } catch (err) {
    console.error("Erro API Amadeus:", err);
    return NextResponse.json(
      { error: "Erro ao buscar hotéis" },
      { status: 500 }
    );
  }
}
