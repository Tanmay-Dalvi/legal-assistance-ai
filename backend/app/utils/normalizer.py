import json

def normalize_legal_analysis(payload: dict, schema_name: str = "") -> dict:
    if not isinstance(payload, dict):
        return {}

    normalized = {}
    
    # QA Check
    if schema_name == "QAResult" or "answer" in payload:
        normalized["answer"] = str(payload.get("answer", "") or "")
        normalized["not_found"] = bool(payload.get("not_found", False))
        normalized["disclaimer"] = str(payload.get("disclaimer", "") or "")
        normalized["evidence"] = _normalize_evidence(payload.get("evidence"))
        return normalized

    # LegalAnalysisResult
    normalized["summary"] = str(payload.get("summary", "") or "")
    normalized["document_type"] = str(payload.get("document_type", "") or "")
    normalized["disclaimer"] = str(payload.get("disclaimer", "") or "")

    evidence_collections = {
        "key_points": ["point"],
        "obligations": ["obligation"],
        "important_dates": ["description"],
        "financial_terms": ["description"],
        "termination_terms": ["description"],
        "risks": ["description", "severity"],
        "inconsistencies": ["description"],
        "questions_for_lawyer": ["question"],
    }

    for collection_name, required_keys in evidence_collections.items():
        items = payload.get(collection_name)
        normalized_items = []
        if isinstance(items, list):
            for item in items:
                if not isinstance(item, dict):
                    if isinstance(item, str) and item.strip():
                        try:
                            item = json.loads(item)
                        except Exception:
                            continue
                    else:
                        continue
                
                if not isinstance(item, dict):
                    continue

                missing_required = False
                for req in required_keys:
                    if req not in item or item[req] is None or str(item[req]).strip() == "":
                        missing_required = True
                        break
                    if req == "severity":
                        sev = str(item.get("severity", "")).lower().strip()
                        if sev not in ("low", "medium", "high"):
                            missing_required = True
                            break

                if missing_required:
                    continue

                item["evidence"] = _normalize_evidence(item.get("evidence"))
                normalized_items.append(item)
        normalized[collection_name] = normalized_items

    normalized["evidence"] = _normalize_evidence(payload.get("evidence"))

    return normalized

def _normalize_evidence(evidence) -> list:
    if not evidence:
        return []
    
    if isinstance(evidence, str):
        try:
            evidence = json.loads(evidence)
        except Exception:
            return []
            
    if isinstance(evidence, dict):
        evidence = [evidence]
        
    if not isinstance(evidence, list):
        return []
        
    normalized = []
    for entry in evidence:
        if isinstance(entry, str):
            if not entry.strip():
                continue
            try:
                entry = json.loads(entry)
            except Exception:
                continue
        if isinstance(entry, dict):
            if "quote" not in entry or not entry["quote"] or not str(entry["quote"]).strip():
                continue
            if "claim_type" not in entry or not entry["claim_type"] or not str(entry["claim_type"]).strip():
                entry["claim_type"] = "Analysis"
                
            for k in ["chunk_id", "document_id", "section_id", "heading"]:
                if k in entry and (entry[k] == "" or entry[k] == "null"):
                    entry[k] = None
                    
            if "page_number" in entry and entry["page_number"] is not None:
                try:
                    entry["page_number"] = int(entry["page_number"])
                except Exception:
                    entry["page_number"] = None
                    
            normalized.append(entry)
            
    return normalized
