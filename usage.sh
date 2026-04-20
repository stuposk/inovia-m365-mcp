#!/usr/bin/env bash
# Usage stats pre inovia-m365-mcp — dotazy do Cloud Logging.
# Používa structured logy (jsonPayload.type=tool_call) emitované v src/log.ts.
#
# Použitie:
#   ./usage.sh                # default: top tools za 7 dní
#   ./usage.sh top [DAYS]     # top tools (default 7d)
#   ./usage.sh users [DAYS]   # top používatelia
#   ./usage.sh combo [DAYS]   # kombinácia user × tool
#   ./usage.sh feed [LIMIT]   # chronologický feed (default 50)
#   ./usage.sh daily [DAYS]   # počet volaní po dňoch
set -euo pipefail

PROJECT="cs-poc-dygqbmfisiqcp6qp4ctkddq"
FILTER='jsonPayload.type="tool_call"'
cmd="${1:-top}"
arg="${2:-}"

case "$cmd" in
  top)
    days="${arg:-7}"
    echo "== Top tools za posledných ${days}d =="
    gcloud logging read "$FILTER" --format="value(jsonPayload.tool)" \
      --freshness="${days}d" --project="$PROJECT" \
      | sort | uniq -c | sort -rn
    ;;

  users)
    days="${arg:-7}"
    echo "== Top používatelia za posledných ${days}d =="
    gcloud logging read "$FILTER" --format="value(jsonPayload.email)" \
      --freshness="${days}d" --project="$PROJECT" \
      | sort | uniq -c | sort -rn
    ;;

  combo)
    days="${arg:-7}"
    echo "== User × tool za posledných ${days}d =="
    gcloud logging read "$FILTER" --format="csv[no-heading](jsonPayload.email,jsonPayload.tool)" \
      --freshness="${days}d" --project="$PROJECT" \
      | sort | uniq -c | sort -rn
    ;;

  feed)
    limit="${arg:-50}"
    echo "== Posledných ${limit} volaní =="
    gcloud logging read "$FILTER" \
      --format="table(timestamp.date('%Y-%m-%d %H:%M:%S','Europe/Bratislava'),jsonPayload.email,jsonPayload.tool)" \
      --limit="$limit" --project="$PROJECT"
    ;;

  daily)
    days="${arg:-7}"
    echo "== Volania po dňoch za posledných ${days}d (Europe/Bratislava) =="
    gcloud logging read "$FILTER" \
      --format="value(timestamp.date('%Y-%m-%d','Europe/Bratislava'))" \
      --freshness="${days}d" --project="$PROJECT" \
      | sort | uniq -c
    ;;

  *)
    echo "Neznámy príkaz: $cmd"
    echo "Použitie: $0 {top|users|combo|feed|daily} [arg]"
    exit 1
    ;;
esac
