import pytest
from app.rag.vector_store import LocalVectorStore
from app.schemas.comparison import SectionComparisonResult
from app.services.comparison_service import ComparisonService

def test_optimized_vector_cosine():
    # Because embeddings from llm_service are L2 normalized,
    # cosine similarity is mathematically identical to the dot product.
    # The optimized _cosine should handle exactly this.
    vec1 = [1.0, 0.0, 0.0]
    vec2 = [1.0, 0.0, 0.0]
    vec3 = [0.0, 1.0, 0.0]
    
    assert LocalVectorStore._cosine(vec1, vec2) == 1.0
    assert LocalVectorStore._cosine(vec1, vec3) == 0.0
    
    # Handle empty/mismatched length safely
    assert LocalVectorStore._cosine([], []) == 0.0
    assert LocalVectorStore._cosine([1.0], [1.0, 0.0]) == 0.0

def test_comparison_batching_schema_safety():
    # Ensure SectionComparisonResult can be batched safely
    # and has all the required lists.
    res = SectionComparisonResult(disclaimer='test')
    assert hasattr(res, "modified_sections")
    assert hasattr(res, "obligation_changes")
    
    # Ensure build_batch_prompt constructs the payload without crashing
    class DummySection:
        def __init__(self):
            self.section_id = "test"
            self.page_number = 1
            self.heading = "test"
            self.text = "test"
    class DummyPairSection:
        def __init__(self):
            self.section_id = "test"
            self.section = DummySection()
    class DummyPair:
        def __init__(self):
            self.section_a = DummyPairSection()
            self.section_b = DummyPairSection()
            
    prompt = ComparisonService.build_batch_prompt([DummyPair(), DummyPair()], "docA", "docB")
    assert "test" in prompt
    assert "DOCUMENT SECTION PAIRS START" in prompt
