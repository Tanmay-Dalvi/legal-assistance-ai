import pytest
import json
from app.utils.normalizer import normalize_legal_analysis

def test_normalize_valid():
    payload = {
        "summary": "Sum",
        "document_type": "Doc",
        "disclaimer": "Disc",
        "key_points": [
            {
                "point": "Point 1",
                "evidence": [
                    {"chunk_id": "1", "document_id": "2", "section_id": "3", "page_number": 1, "heading": "H", "quote": "Q", "claim_type": "C"}
                ]
            }
        ]
    }
    res = normalize_legal_analysis(payload)
    assert res["summary"] == "Sum"
    assert len(res["key_points"]) == 1
    assert res["key_points"][0]["evidence"][0]["quote"] == "Q"

def test_normalize_missing_lists():
    payload = {
        "summary": "Sum",
    }
    res = normalize_legal_analysis(payload)
    assert res["summary"] == "Sum"
    assert res["key_points"] == []
    assert res["obligations"] == []
    assert res["risks"] == []

def test_normalize_empty_strings_in_list():
    payload = {
        "summary": "Sum",
        "key_points": [
            {"point": "Valid", "evidence": []},
            "",
            "   ",
            {"point": "", "evidence": []}
        ]
    }
    res = normalize_legal_analysis(payload)
    assert len(res["key_points"]) == 1
    assert res["key_points"][0]["point"] == "Valid"

def test_normalize_evidence_dict():
    payload = {
        "summary": "Sum",
        "key_points": [
            {
                "point": "Valid",
                "evidence": {"quote": "Single dict quote", "claim_type": "Analysis"}
            }
        ]
    }
    res = normalize_legal_analysis(payload)
    assert len(res["key_points"][0]["evidence"]) == 1
    assert res["key_points"][0]["evidence"][0]["quote"] == "Single dict quote"

def test_normalize_evidence_json_string():
    payload = {
        "summary": "Sum",
        "key_points": [
            {
                "point": "Valid",
                "evidence": json.dumps({"quote": "String dict quote", "claim_type": "Analysis"})
            }
        ]
    }
    res = normalize_legal_analysis(payload)
    assert len(res["key_points"][0]["evidence"]) == 1
    assert res["key_points"][0]["evidence"][0]["quote"] == "String dict quote"

def test_normalize_missing_top_level():
    res = normalize_legal_analysis({})
    assert res["summary"] == ""
    assert res["document_type"] == ""
    assert res["disclaimer"] == ""
    assert res["key_points"] == []

def test_normalize_invalid_severity():
    payload = {
        "risks": [
            {"description": "Valid", "severity": "HIGH", "evidence": [{"quote": "Q"}]},
            {"description": "Invalid sev", "severity": "unknown", "evidence": [{"quote": "Q"}]}
        ]
    }
    res = normalize_legal_analysis(payload)
    assert len(res["risks"]) == 1
    assert res["risks"][0]["description"] == "Valid"
