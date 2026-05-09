// ==========================================
// TEST — Ejecutar análisis completo desde consola
// ==========================================

const { runFullAnalysis } = require('./engine/dist/extractor/runFullAnalysis');
const { getAnalysisProfile } = require('./engine/dist/profiles/analysisProfile');

async function test() {
  const url = process.argv[2] || 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=1000-6-LE26';
  const profileId = process.argv[3] || 'general';
  
  console.log('\n========================================');
  console.log('TEST - Análisis Completo de Licitación');
  console.log('========================================\n');
  console.log('URL:', url);
  console.log('Perfil:', profileId);
  console.log('');
  
  const profile = getAnalysisProfile(profileId);
  const result = await runFullAnalysis(url, profile);
  
  if (!result) {
    console.error('Error: No se pudo analizar la licitación');
    process.exit(1);
  }
  
  console.log(JSON.stringify(result, null, 2));
  console.log('\n[OK] Análisis completado');
}

test().catch(e => { console.error(e); process.exit(1); });
