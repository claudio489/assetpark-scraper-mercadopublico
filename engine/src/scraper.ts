import fetch from "node-fetch";
import "dotenv/config";

export async function scrapeOpportunities() {
  const API_KEY = process.env.MP_API_KEY;

  const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=publicada&pagina=1&ticket=${API_KEY}`;

  try {
    const res = await fetch(url);
    const json: any = await res.json();

    if (!json.Listado || json.Listado.length === 0) {
      return [];
    }

    return json.Listado.map((item: any) => ({
      id: item.CodigoExterno,
      title: item.Nombre,
      entity: item.NombreOrganismo,
      region: item.Region,
      amount: item.MontoEstimado || 0,
      closingDate: item.FechaCierre,
      link: item.UrlActiva || `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=${item.CodigoExterno}`
    }));

  } catch (error: any) {
    console.error("SCRAPER ERROR:", error.message);
    return [];
  }
}