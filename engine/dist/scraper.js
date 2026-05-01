"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeOpportunities = scrapeOpportunities;
const node_fetch_1 = __importDefault(require("node-fetch"));
require("dotenv/config");
async function scrapeOpportunities() {
    const API_KEY = process.env.MP_API_KEY;
    const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=publicada&pagina=1&ticket=${API_KEY}`;
    try {
        const res = await (0, node_fetch_1.default)(url);
        const json = await res.json();
        if (!json.Listado || json.Listado.length === 0) {
            return [];
        }
        return json.Listado.map((item) => ({
            id: item.CodigoExterno,
            title: item.Nombre,
            entity: item.NombreOrganismo,
            region: item.Region,
            amount: item.MontoEstimado || 0,
            closingDate: item.FechaCierre,
            link: item.UrlActiva || `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=${item.CodigoExterno}`
        }));
    }
    catch (error) {
        console.error("SCRAPER ERROR:", error.message);
        return [];
    }
}
