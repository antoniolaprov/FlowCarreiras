"""Baixa agentes da API publica do Mapa Cultural de Pernambuco."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


API_URL = "https://www.mapacultural.pe.gov.br/api/agent/find"
INDIVIDUAL_TYPE_ID = 1
SELECT_FIELDS = (
    "id,name,shortDescription,type,terms,createTimestamp,updateTimestamp"
)
PROJECT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = PROJECT_DIR / "data" / "raw" / "mapa_cultural_pe_agentes.json"


def baixar_pagina(page: int, limit: int) -> tuple[list[dict], str]:
    params = {
        "@select": SELECT_FIELDS,
        "@limit": limit,
        "@page": page,
        "type": f"EQ({INDIVIDUAL_TYPE_ID})",
    }
    url = f"{API_URL}?{urlencode(params)}"
    request = Request(url, headers={"User-Agent": "FlowCarreiras-AnaliseDados/1.0"})

    with urlopen(request, timeout=60) as response:
        payload = json.load(response)

    if isinstance(payload, dict):
        payload = [payload]
    if not isinstance(payload, list):
        raise ValueError("Resposta inesperada da API: era esperada uma lista de agentes.")

    individuais = [
        agente
        for agente in payload
        if isinstance(agente.get("type"), dict)
        and agente["type"].get("id") == INDIVIDUAL_TYPE_ID
    ]
    return individuais, url


def baixar_dados(
    limit: int,
    pagina_inicial: int,
    total_registros: int | None,
    todas_paginas: bool,
) -> tuple[list[dict], list[str]]:
    registros: list[dict] = []
    urls: list[str] = []
    pagina = pagina_inicial

    while True:
        pagina_dados, url = baixar_pagina(pagina, limit)
        registros.extend(pagina_dados)
        urls.append(url)

        if total_registros is not None and len(registros) >= total_registros:
            registros = registros[:total_registros]
            break
        if len(pagina_dados) < limit:
            break
        pagina += 1

    unicos = {str(registro.get("id")): registro for registro in registros}
    return list(unicos.values()), urls


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--page", type=int, default=1)
    parser.add_argument(
        "--total-registros",
        type=int,
        default=1000,
        help="Quantidade maxima de registros a baixar. Padrao: 1000.",
    )
    parser.add_argument(
        "--todas-paginas",
        action="store_true",
        help="Ignora o limite total e continua ate a ultima pagina da API.",
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    total_registros = None if args.todas_paginas else args.total_registros
    dados, urls = baixar_dados(
        args.limit,
        args.page,
        total_registros,
        args.todas_paginas,
    )
    documento = {
        "fonte": API_URL,
        "consulta": {
            "@select": SELECT_FIELDS,
            "@limit": args.limit,
            "@page": args.page,
            "type": f"EQ({INDIVIDUAL_TYPE_ID})",
            "total_registros": total_registros,
            "todas_paginas": args.todas_paginas,
        },
        "urls_consultadas": urls,
        "extraido_em_utc": datetime.now(timezone.utc).isoformat(),
        "total_registros": len(dados),
        "dados": dados,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(documento, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"{len(dados)} registros salvos em {args.output}")


if __name__ == "__main__":
    main()
