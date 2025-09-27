const express = require("express");
const Amadeus = require("amadeus");
require("dotenv").config();

const app = express();
const PORT = 3001;

// Config Amadeus (sandbox)
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET,
  hostname: "test.api.amadeus.com",
});

// Endpoint para buscar hotéis
app.get("/api/hotels", async (req, res) => {
  const { city = "Lisboa", checkInDate, checkOutDate } = req.query;

  try {
    // 1. Obter código IATA da cidade
    const cityResponse = await amadeus.referenceData.locations.get({
      keyword: city,
      subType: "CITY",
    });

    if (!cityResponse.data || cityResponse.data.length === 0) {
      return res.status(404).json({ error: "Cidade não encontrada" });
    }

    const cityCode = cityResponse.data[0].iataCode;

    // 2. Buscar hotéis
    const hotels = await amadeus.shopping.hotelOffers.get({
      cityCode,
      checkInDate,
      checkOutDate,
    });

    res.json(hotels.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar hotéis" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
