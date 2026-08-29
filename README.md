# SofiGlow — Sitio web

## Cómo verlo
Abre `index.html` en cualquier navegador (doble clic funciona). Para publicarlo en internet, sube toda esta carpeta a un hosting gratuito como **Netlify**, **Vercel** o **GitHub Pages** — no necesita servidor especial, es un sitio estático.

## Estructura
```
sofiglow/
├── index.html          → página principal
├── css/style.css        → estilos y paleta de colores
├── js/app.js             → catálogo, búsqueda, carrito, checkout
├── data/products.json    → base de datos de productos (1,495 productos)
├── images/                → fotos de cada producto
└── assets/qr-nequi.jpg   → QR de pago Nequi
```

## Cómo funciona el catálogo
Todos los productos viven en **`data/products.json`**. Es un archivo de texto con esta forma, uno por producto:

```json
{
  "id": "AE0424",
  "name": "Serum Facial Con Aloe Vera Girly",
  "price": 38000,
  "category": "Cuidado del rostro",
  "image": "images/AE0424.jpg"
}
```

Este archivo funciona como una base de datos ligera — no necesitas tocar el código del sitio para agregar, editar o quitar productos.

### Agregar un producto nuevo
1. Guarda la foto del producto dentro de la carpeta `images/`.
2. Abre `data/products.json` y agrega un bloque nuevo como el de arriba (recuerda la coma entre productos).
3. Guarda el archivo. Listo — aparece automáticamente en el catálogo, en la categoría indicada y disponible en el buscador.

### Editar precio o nombre
Busca el producto por su `id` (el SKU) dentro de `products.json` y cambia el valor de `price` o `name`.

### Si el catálogo sigue creciendo
Con miles de productos más, lo más práctico sería pasar `products.json` a una base de datos real (por ejemplo, con Airtable, Google Sheets como fuente, o una base de datos como Supabase/Firebase) para que Sofía pueda agregar productos desde un formulario sin editar código. Si llegan a ese punto, avísame y lo armamos.

## Cómo funciona el pago
1. La clienta arma su pedido y da clic en **"Finalizar compra"**.
2. Ve el resumen y el total, y pasa a **"Ir a pagar con Nequi"**, donde aparece el QR.
3. Escanea el QR desde la app Nequi y paga el total.
4. Da clic en **"Confirmar pago por WhatsApp"** — se abre WhatsApp con el número de Sofía (300 819 6612) y un mensaje ya armado con el detalle del pedido y el total, listo para enviar junto con el comprobante.

## Catálogo importado
Los 1,495 productos y sus fotos se extrajeron automáticamente del catálogo mayorista en PDF (Magna Cosmetics) que compartiste. Si quieres quitar productos que Sofía no maneja, o categorías completas, dímelo y filtro el archivo `products.json`.
