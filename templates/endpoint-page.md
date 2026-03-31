# {{METHOD}} {{PATH}}

{{SUMMARY}}

{{DESCRIPTION}}

---

## Details

| Field | Value |
|---|---|
| **Method** | `{{METHOD}}` |
| **Path** | `{{PATH}}` |
| **Auth** | {{AUTH_REQUIREMENT}} |
| **Rate Limit** | {{RATE_LIMIT}} |

---

## Parameters

{{#PATH_PARAMS}}
### Path Parameters

| Name | Type | Required | Description |
|---|---|---|---|
{{#EACH_PATH_PARAM}}
| `{{name}}` | `{{type}}` | Yes | {{description}} |
{{/EACH_PATH_PARAM}}
{{/PATH_PARAMS}}

{{#QUERY_PARAMS}}
### Query Parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
{{#EACH_QUERY_PARAM}}
| `{{name}}` | `{{type}}` | {{required}} | `{{default}}` | {{description}} |
{{/EACH_QUERY_PARAM}}
{{/QUERY_PARAMS}}

{{#REQUEST_BODY}}
### Request Body

**Content-Type:** `application/json`

```json
{{REQUEST_SCHEMA}}
```
{{/REQUEST_BODY}}

---

## Responses

{{#EACH_RESPONSE}}
### `{{STATUS_CODE}}` — {{DESCRIPTION}}

```json
{{RESPONSE_SCHEMA}}
```
{{/EACH_RESPONSE}}

---

## Examples

### curl

```bash
{{CURL_EXAMPLE}}
```

### JavaScript

```javascript
{{JAVASCRIPT_EXAMPLE}}
```

### Python

```python
{{PYTHON_EXAMPLE}}
```

---

## Error Responses

{{#EACH_ERROR}}
### `{{STATUS_CODE}}` — {{ERROR_DESCRIPTION}}

```json
{{ERROR_BODY}}
```
{{/EACH_ERROR}}

---

*Generated automatically from source code. Last updated: {{GENERATED_AT}}*

[← Back to API Index](../index.md)
