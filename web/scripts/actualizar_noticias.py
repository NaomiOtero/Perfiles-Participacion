#!/usr/bin/env python3
"""Descarga noticias electorales recientes por estado (Google News RSS) y las guarda en noticias.js.

Uso, desde la carpeta web/:
    python3 scripts/actualizar_noticias.py
Solo usa la biblioteca estándar. Tarda alrededor de un minuto (33 consultas, con pausa entre ellas).
La clasificación por tema y el índice de preocupación se calculan en el navegador (app.js),
con las palabras clave de data.js, para que haya una sola fuente de reglas.
"""
import datetime as dt
import email.utils
import json
import pathlib
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

DIAS = 14
POR_ESTADO = 25
TERMINOS = '(elecciones OR INE OR casilla OR "proceso electoral" OR votar OR "instituto electoral")'
ESTADOS = [
    ("AGS", "Aguascalientes"), ("BC", "Baja California"), ("BCS", "Baja California Sur"), ("CAMP", "Campeche"),
    ("COAH", "Coahuila"), ("COL", "Colima"), ("CHIS", "Chiapas"), ("CHIH", "Chihuahua"), ("CDMX", "Ciudad de México"),
    ("DGO", "Durango"), ("GTO", "Guanajuato"), ("GRO", "Guerrero"), ("HGO", "Hidalgo"), ("JAL", "Jalisco"),
    ("MEX", "Estado de México"), ("MICH", "Michoacán"), ("MOR", "Morelos"), ("NAY", "Nayarit"), ("NL", "Nuevo León"),
    ("OAX", "Oaxaca"), ("PUE", "Puebla"), ("QRO", "Querétaro"), ("QROO", "Quintana Roo"), ("SLP", "San Luis Potosí"),
    ("SIN", "Sinaloa"), ("SON", "Sonora"), ("TAB", "Tabasco"), ("TAM", "Tamaulipas"), ("TLAX", "Tlaxcala"),
    ("VER", "Veracruz"), ("YUC", "Yucatán"), ("ZAC", "Zacatecas"),
]
SALIDA = pathlib.Path(__file__).resolve().parent.parent / "noticias.js"


def consulta(q: str, n: int) -> list[dict]:
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode(
        {"q": f"{q} when:{DIAS}d", "hl": "es-419", "gl": "MX", "ceid": "MX:es-419"})
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (INEgualables prototipo)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        raiz = ET.fromstring(r.read())
    notas = []
    for it in raiz.iter("item"):
        fuente = (it.findtext("source") or "").strip()
        titulo = (it.findtext("title") or "").strip()
        if fuente and titulo.endswith(" - " + fuente):
            titulo = titulo[: -len(fuente) - 3]
        try:
            fecha = email.utils.parsedate_to_datetime(it.findtext("pubDate")).date().isoformat()
        except Exception:
            fecha = ""
        notas.append({"t": titulo, "f": fuente, "d": fecha, "u": (it.findtext("link") or "").strip()})
        if len(notas) >= n:
            break
    return notas


def main() -> int:
    datos = {"generado": dt.datetime.now(dt.timezone.utc).isoformat(), "fuente": "Google News", "dias": DIAS, "estados": {}}
    try:
        datos["nacional"] = consulta(f'{TERMINOS} ("elecciones 2027" OR "Instituto Nacional Electoral")', 60)
    except Exception as e:
        print(f"No se pudo consultar Google News: {e}", file=sys.stderr)
        return 1
    for i, (clave, nombre) in enumerate(ESTADOS, 1):
        time.sleep(1.5)
        try:
            datos["estados"][clave] = consulta(f'{TERMINOS} "{nombre}"', POR_ESTADO)
            print(f"[{i:2}/32] {nombre}: {len(datos['estados'][clave])} notas")
        except Exception as e:
            print(f"[{i:2}/32] {nombre}: error {e}", file=sys.stderr)
            datos["estados"][clave] = []
    SALIDA.write_text(
        "// Caché de noticias. Se regenera con: python3 scripts/actualizar_noticias.py\n"
        "window.NOTICIAS_CACHE = " + json.dumps(datos, ensure_ascii=False) + ";\n", encoding="utf-8")
    total = sum(len(v) for v in datos["estados"].values()) + len(datos["nacional"])
    print(f"Listo: {total} notas guardadas en {SALIDA}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
