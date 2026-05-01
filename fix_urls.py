import re, os

new_url = 'https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion='

files = ['api/src/index.ts', 'frontend/index.html', 'api/dist/index.js']

for f in files:
    if not os.path.exists(f):
        continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Reemplazar cualquier URL vieja de mercadopublico
    content = re.sub(r'https://www\.mercadopublico\.cl/[^"\s]*?(?=["\s])', new_url, content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
    
    print('OK:', f)
