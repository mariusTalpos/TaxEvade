# Contract: Wells Fargo CSV Export Format

**Feature**: 001-csv-ledger-import  
**Consumer**: CSV parser service (Wells Fargo adapter)

## Column Layout

Wells Fargo CSV exports are comma-delimited with **quoted** fields. There is **no header row**; the first line is data. Columns:

| Column index (0-based) | Name        | Example                    | Description |
|------------------------|-------------|----------------------------|-------------|
| 0                      | Date        | `"12/31/2025"`             | Transaction date in MM/DD/YYYY. Parser MUST normalize to YYYY-MM-DD. |
| 1                      | Amount      | `"-18.12"` or `"1929.21"`  | Signed number as quoted string: positive = deposit (inflow), negative = withdrawal (outflow). Parser MUST strip quotes and parse as number. |
| 2                      | (asterisk)  | `"*"`                      | Literal asterisk; ignore. |
| 3                      | (empty)     | `""`                       | Empty; ignore. |
| 4                      | Description | `"ONLINE TRANSFER REF..."`  | Transaction description or memo (may contain commas; field is quoted). |

**Example row**:

```csv
"12/31/2025","-18.12","*","","ONLINE TRANSFER REF #IB0W9MQXF8 TO PLATINUM CARD XXXXXXXXXXXX0858 ON 12/31/25"
```

**Notes**:
- All fields are double-quoted. Parser MUST handle quoted CSV (commas and quotes inside column 4 are valid).
- Amount is in column 1 (not 2); description is in column 4. Column order is fixed.
- If a row has fewer than 5 columns or column 0 does not parse as MM/DD/YYYY, treat as malformed and skip (or fail file if systematic).

## Parser Output

Each valid row MUST be mapped to the **normalized transaction** shape (see `normalized-transaction.md`). The parser does NOT set `id` or `account`; the import pipeline assigns `id` and sets `account` from import context (user input or default).

## Error Handling

- Empty file: return zero transactions and a result indicating "no transactions found".
- Unsupported format (e.g. wrong column count or non-date in column 0): return a parse error with a user-facing message (e.g. "Unsupported CSV format; Wells Fargo export expected").
- Malformed rows: skip row and count toward "skipped" in import result; if too many rows are skipped (e.g. >50%), consider failing the whole file with an actionable message.
