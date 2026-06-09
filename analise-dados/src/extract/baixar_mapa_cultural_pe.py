"""Baixa agentes da API publica do Mapa Cultural de Pernambuco."""

from __future__ import annotations

import argparse
import json
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


API_URL = "https://www.mapacultural.pe.gov.br/api/agent/find"
INDIVIDUAL_TYPE_ID = 1
ARTISTIC_AREA_TERMS = (
    "arte",
    "artesan",
    "audiovisual",
    "banda",
    "bordado",
    "canto",
    "carnaval",
    "cinema",
    "circo",
    "contacao de historias",
    "criacao literaria",
    "cultura negra",
    "cultura lgbtqiapn+",
    "cultura dos povos originarios",
    "culturas populares",
    "culturas tradicionais",
    "danca",
    "declamacao",
    "design",
    "documentario",
    "escultura",
    "festas populares",
    "festejos juninos",
    "filme",
    "forro",
    "fotografia",
    "frevo",
    "gastronomia",
    "lenda",
    "leitura",
    "literatura",
    "livro",
    "macrame",
    "moda",
    "musica",
    "novela",
    "orquestra",
    "pintura",
    "poesia",
    "producao audiovisual",
    "radio",
    "renda",
    "rock",
    "samba",
    "sapateado",
    "teatro",
    "tecelagem",
    "televisao",
    "trancagem",
    "video",
    "webserie",
    "xaxado",
)
SUSPICIOUS_NAME_TERMS = ("admin", "teste", "test agent", "test user")
SUSPICIOUS_DESCRIPTION_TERMS = (
    "agente teste",
    "apenas teste",
    "cadastro teste",
    "pagina teste",
    "perfil teste",
    "test agent",
    "test user",
)
SUSPICIOUS_EXACT_DESCRIPTIONS = ("descrever", "test", "teste")
SELECT_FIELDS = (
    "id,name,shortDescription,type,terms,createTimestamp,updateTimestamp"
)
PROJECT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = PROJECT_DIR / "data" / "raw" / "mapa_cultural_pe_agentes.json"


def normalizar_texto(valor: object) -> str:
    texto = unicodedata.normalize("NFKD", str(valor or ""))
    return "".join(caractere for caractere in texto if not unicodedata.combining(caractere)).lower()


def eh_perfil_artistico(agente: dict) -> bool:
    tipo = agente.get("type") if isinstance(agente.get("type"), dict) else {}
    termos = agente.get("terms") if isinstance(agente.get("terms"), dict) else {}
    areas = termos.get("area") if isinstance(termos.get("area"), list) else []
    nome = normalizar_texto(agente.get("name"))
    descricao = normalizar_texto(agente.get("shortDescription")).strip()
    perfil_suspeito = (
        any(termo in nome for termo in SUSPICIOUS_NAME_TERMS)
        or descricao in SUSPICIOUS_EXACT_DESCRIPTIONS
        or any(termo in descricao for termo in SUSPICIOUS_DESCRIPTION_TERMS)
    )

    return (
        tipo.get("id") == INDIVIDUAL_TYPE_ID
        and not perfil_suspeito
        and any(
            termo_artistico in normalizar_texto(area)
            for area in areas
            for termo_artistico in ARTISTIC_AREA_TERMS
        )
    )


def baixar_pagina(page: int, limit: int) -> tuple[list[dict], str, int]:
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

    return [agente for agente in payload if eh_perfil_artistico(agente)], url, len(payload)


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
        pagina_dados, url, total_retornado = baixar_pagina(pagina, limit)
        registros.extend(pagina_dados)
        urls.append(url)

        unicos = {str(registro.get("id")): registro for registro in registros}
        if total_registros is not None and len(unicos) >= total_registros:
            registros = list(unicos.values())[:total_registros]
            break
        if total_retornado < limit:
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
            "criterio_local": (
                "perfil individual com pelo menos uma area artistica/criativa "
                "e sem marcadores evidentes de teste ou administracao"
            ),
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
