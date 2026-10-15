"""Unit tests for Future Scenario Foundry and Counterfactual Simulation Engine."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_scenarios_returns_four_classes():
    """Verify endpoint returns exactly the 4 required scenario classes."""
    response = client.get("/api/v1/scenarios", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["scenarios"]) == 4

    classes = {s["scenario_class"] for s in data["scenarios"]}
    assert classes == {"conservative", "accelerated", "disruptive", "human_first"}

    # Assert required financial and uncertainty fields
    for s in data["scenarios"]:
        assert "ebitda_impact_usd" in s
        assert "confidence_score" in s
        assert len(s["invalidation_triggers"]) >= 1
        assert len(s["counterfactuals"]) >= 3  # Minimum 3 counterfactual assumptions contract


def test_get_scenario_by_id_success():
    """Verify retrieving a specific scenario by ID."""
    response = client.get("/api/v1/scenarios/SCEN-001", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_id"] == "SCEN-001"
    assert data["scenario_class"] == "conservative"
    assert len(data["counterfactuals"]) >= 3


def test_get_scenario_by_id_not_found():
    """Verify retrieving an invalid scenario returns 404."""
    response = client.get("/api/v1/scenarios/SCEN-NONEXISTENT", headers={"X-Tenant-ID": "tenant-test-01"})
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_simulate_counterfactual_nominal():
    """Verify executing What-If counterfactual simulation under standard parameters."""
    payload = {
        "scenario_id": "SCEN-002",
        "adoption_speed_multiplier": 1.1,
        "wage_inflation_pct": 3.5,
        "automation_aggression": 1.1,
        "capital_cost_delta_pct": 5.0,
    }
    response = client.post(
        "/api/v1/scenarios/simulate",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["scenario"]["scenario_id"] == "SCEN-002"
    impact = data["impact"]
    assert impact["simulated_ebitda_usd"] > impact["base_ebitda_usd"]
    assert impact["delta_ebitda_usd"] > 0
    assert impact["risk_assessment"] in ["LOW_VOLATILITY", "HIGH_RETURN"]
    assert len(impact["tripped_triggers"]) == 0
    assert "projected EBITDA shifts" in impact["counterfactual_narrative"]


def test_simulate_counterfactual_tripping_triggers():
    """Verify extreme parameter simulation trips invalidation triggers."""
    # Low adoption (< 0.6) and high aggression (> 1.8) and high capital delta (> 35%)
    payload = {
        "scenario_id": "SCEN-001",
        "adoption_speed_multiplier": 0.4,
        "wage_inflation_pct": 2.0,
        "automation_aggression": 2.2,
        "capital_cost_delta_pct": 45.0,
    }
    response = client.post(
        "/api/v1/scenarios/simulate",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()
    impact = data["impact"]
    assert impact["risk_assessment"] == "ELEVATED_FRICTION"
    assert len(impact["tripped_triggers"]) >= 2
    assert "WARNING: Tripped" in impact["counterfactual_narrative"]


def test_simulate_counterfactual_high_capital_exposure():
    """Verify simulation with high capital cost delta but without tripped triggers."""
    payload = {
        "scenario_id": "SCEN-001",
        "adoption_speed_multiplier": 1.0,
        "wage_inflation_pct": 3.0,
        "automation_aggression": 1.0,
        "capital_cost_delta_pct": 25.0,  # > 20% but <= 35%
    }
    response = client.post(
        "/api/v1/scenarios/simulate",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()
    impact = data["impact"]
    assert impact["risk_assessment"] == "HIGH_CAPITAL_EXPOSURE"
    assert len(impact["tripped_triggers"]) == 0


def test_simulate_counterfactual_high_return():
    """Verify simulation resulting in high return."""
    payload = {
        "scenario_id": "SCEN-001",
        "adoption_speed_multiplier": 1.5,
        "wage_inflation_pct": 8.0,
        "automation_aggression": 1.4,
        "capital_cost_delta_pct": -5.0,
    }
    response = client.post(
        "/api/v1/scenarios/simulate",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()
    impact = data["impact"]
    assert impact["risk_assessment"] == "HIGH_RETURN"


def test_simulate_counterfactual_not_found():
    """Verify simulation on non-existent scenario returns 404."""
    payload = {
        "scenario_id": "SCEN-UNKNOWN",
        "adoption_speed_multiplier": 1.0,
    }
    response = client.post(
        "/api/v1/scenarios/simulate",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_generate_transformation_roadmap_healthcare():
    """Verify generating Vertex AI-synthesized transformation roadmap for clinical healthcare."""
    payload = {
        "firm_name": "Mayo Clinic",
        "scenario_prompt": "Emergency room intake queues and radiologist charting fatigue.",
        "sector": "healthcare",
        "target_horizon_years": 10,
    }
    response = client.post(
        "/api/v1/scenarios/transformation-roadmap",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["firm_title"] == "Mayo Clinic"
    assert data["category"] == "public_health"
    assert "Vertex AI" in data["executive_summary"]

    # Verify 6 temporal horizons
    assert "baseline" in data["horizons"]
    assert "year1" in data["horizons"]
    assert "year2" in data["horizons"]
    assert "year3" in data["horizons"]
    assert "year5" in data["horizons"]
    assert "year10" in data["horizons"]
    assert data["horizons"]["year10"]["productivityMultiplier"] == "100x"

    # Verify Imagen 3 Infographic Blueprint
    info = data["imagen_infographic"]
    assert "Mayo Clinic" in info["title"]
    assert len(info["zones"]) == 4
    assert "<svg" in info["svg_blueprint"]

    # Verify Lyria Audio Podcast Studio
    pod = data["lyria_podcast"]
    assert "Echoes of 2036" in pod["title"]
    assert len(pod["speakers"]) == 2
    assert "DR. JORDAN:" in pod["script"]

    # Verify Veo 2 Video Studio
    video = data["veo_video"]
    assert "60 FPS" in video["title"]
    assert video["fps"] == 60
    assert video["hud_telemetry"]["active_agent_count"] == 9

    # Verify multi-agent citations and model telemetry
    assert len(data["evidence_citations"]) == 3
    assert "model_used" in data
    assert data["input_tokens"] > 0


def test_generate_transformation_roadmap_categories():
    """Verify category categorization across tech titan, education, and commercial."""
    # Tech Titan
    resp_tech = client.post(
        "/api/v1/scenarios/transformation-roadmap",
        json={"firm_name": "Google LLC", "scenario_prompt": "Monorepo code reviews.", "sector": "it_technology"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_tech.status_code == 200
    assert resp_tech.json()["category"] == "tech_titan"

    # Public Education
    resp_edu = client.post(
        "/api/v1/scenarios/transformation-roadmap",
        json={"firm_name": "Public High School", "scenario_prompt": "Student tutoring.", "sector": "education"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_edu.status_code == 200
    assert resp_edu.json()["category"] == "public_education"

    # Default Commercial Enterprise
    resp_comm = client.post(
        "/api/v1/scenarios/transformation-roadmap",
        json={"firm_name": "", "scenario_prompt": "Automotive factory logistics.", "sector": "automotive"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_comm.status_code == 200
    assert resp_comm.json()["category"] == "commercial_enterprise"
    assert resp_comm.json()["firm_title"] == "Global Enterprise"
    assert resp_comm.json()["company_profile"] is not None
    assert resp_comm.json()["futuristic_readiness"] is not None


def test_analyze_company_intelligence_verified_google():
    """Verify company intelligence synthesis for verified firm Google/Alphabet."""
    payload = {
        "company_name": "Google LLC",
        "sector": "it_technology",
        "website_url": "https://abc.xyz",
        "custom_context": "Accelerate cloud enterprise migrations.",
    }
    response = client.post(
        "/api/v1/scenarios/company-intelligence",
        json=payload,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert response.status_code == 200
    data = response.json()

    # Company Profile Verification
    profile = data["company_profile"]
    assert "Google (Alphabet Inc.)" in profile["name"]
    assert "182,500" in profile["employee_count"]
    assert "$307.4B" in profile["annual_revenue"]
    assert "Search" in profile["core_business"]
    assert "Planetary compute" in profile["competitive_moat"]
    assert len(profile["primary_sources"]) >= 3

    # Futuristic Readiness Score Verification
    readiness = data["futuristic_readiness"]
    assert readiness["total_score"] >= 90.0
    assert readiness["grade"] == "A+ Frontier Pioneer"
    assert readiness["ai_agentic_maturity"] > 18.0
    assert readiness["digital_telemetry_iot"] > 18.0
    assert len(readiness["key_strengths"]) >= 2
    assert len(readiness["modernization_gaps"]) >= 1

    # Roadmap Verification
    roadmap = data["roadmap"]
    assert roadmap["firm_title"] == "Google (Alphabet Inc.)"
    assert "year1" in roadmap["horizons"]
    assert "year10" in roadmap["horizons"]
    assert roadmap["imagen_infographic"] is not None
    assert roadmap["lyria_podcast"] is not None
    assert roadmap["veo_video"] is not None


def test_analyze_company_intelligence_verified_catalog_entries():
    """Verify catalog coverage for Mayo Clinic, Apollo Hospitals, and Tesla."""
    # Mayo Clinic
    resp_mayo = client.post(
        "/api/v1/scenarios/company-intelligence",
        json={"company_name": "Mayo Clinic", "sector": "healthcare"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_mayo.status_code == 200
    mayo_profile = resp_mayo.json()["company_profile"]
    assert "73,000" in mayo_profile["employee_count"]
    assert "$17.9B" in mayo_profile["annual_revenue"]

    # Apollo Hospitals
    resp_apollo = client.post(
        "/api/v1/scenarios/company-intelligence",
        json={"company_name": "Apollo Hospitals", "sector": "healthcare"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_apollo.status_code == 200
    apollo_profile = resp_apollo.json()["company_profile"]
    assert "45,000" in apollo_profile["employee_count"]

    # Tesla
    resp_tesla = client.post(
        "/api/v1/scenarios/company-intelligence",
        json={"company_name": "Tesla Motors", "sector": "automotive"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_tesla.status_code == 200
    tesla_profile = resp_tesla.json()["company_profile"]
    assert "140,473" in tesla_profile["employee_count"]
    assert "$96.8B" in tesla_profile["annual_revenue"]

    # NHS Trust (B+ tier)
    resp_nhs = client.post(
        "/api/v1/scenarios/company-intelligence",
        json={"company_name": "NHS Foundation Trust", "sector": "healthcare"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_nhs.status_code == 200
    nhs_data = resp_nhs.json()
    assert nhs_data["futuristic_readiness"]["grade"] == "B+ Digital Modernizer"



def test_analyze_company_intelligence_custom_firm_branches():
    """Verify custom/unlisted firms across healthcare, technology, education, and general commercial sectors."""
    # Custom Healthcare
    resp_health = client.post(
        "/api/v1/scenarios/company-intelligence",
        json={"company_name": "Sunrise Regional Health", "sector": "hospital_network"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_health.status_code == 200
    health_profile = resp_health.json()["company_profile"]
    assert "18,400" in health_profile["employee_count"]

    # Custom Tech
    resp_tech = client.post(
        "/api/v1/scenarios/company-intelligence",
        json={"company_name": "QuantumCloud Labs", "sector": "software_it"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_tech.status_code == 200
    tech_profile = resp_tech.json()["company_profile"]
    assert "12,500" in tech_profile["employee_count"]

    # Custom Education
    resp_edu = client.post(
        "/api/v1/scenarios/company-intelligence",
        json={"company_name": "Valley Unified School", "sector": "education_k12"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_edu.status_code == 200
    edu_profile = resp_edu.json()["company_profile"]
    assert "4,200" in edu_profile["employee_count"]

    # Custom Commercial & score grade fallback
    resp_comm = client.post(
        "/api/v1/scenarios/company-intelligence",
        json={"company_name": "Apex Precision Metals", "sector": "heavy_machinery"},
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp_comm.status_code == 200
    comm_data = resp_comm.json()
    assert "24,000" in comm_data["company_profile"]["employee_count"]
    assert comm_data["futuristic_readiness"]["grade"] in ["B+ Digital Modernizer", "A Cognitive Leader", "A+ Frontier Pioneer", "B Agile Adopter", "C Emergent"]


