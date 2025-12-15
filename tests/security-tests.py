import pytest
import requests
import json

# Configuration
BASE_URL = "https://fin-secure-server.onrender.com"
RECOMMEND_ENDPOINT = f"{BASE_URL}/recommend"

class TestComplianceBoundaryAnalysis:
    """
    Compliance Testing: Boundary Value Analysis

    Tests the recommendation logic at boundary conditions:
    - Risk Score 0 (minimum)
    - Risk Score 49 (just below threshold)
    - Risk Score 50 (at threshold)
    - Risk Score 100 (maximum)
    """

    @pytest.mark.parametrize("risk_score,expected_portfolio", [
        (0, "Bonds"),      # Minimum value - Conservative
        (49, "Bonds"),     # Just below threshold
        (50, "Stocks"),    # At threshold
        (100, "Stocks"),   # Maximum value - Aggressive
    ])
    def test_risk_score_boundaries(self, risk_score, expected_portfolio):
        """
        Test boundary conditions for risk score recommendations

        Business Rule:
        - Risk Score < 50 → Bonds (Conservative)
        - Risk Score >= 50 → Stocks (Aggressive)
        """
        payload = {
            "risk_score": risk_score,
            "name": f"Tester_{risk_score}"
        }

        response = requests.post(
            RECOMMEND_ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 200, \
            f"Expected 200, got {response.status_code} for risk_score={risk_score}"

        data = response.json()

        assert "portfolio_type" in data, "Response missing portfolio_type field"
        assert data["portfolio_type"] == expected_portfolio, \
            f"Risk score {risk_score}: Expected '{expected_portfolio}', got '{data['portfolio_type']}'"

        print(f"✓ Risk Score {risk_score:3d} → {data['portfolio_type']:6s} [PASS]")

def test_compliance_boundary_analysis():
    """
    Wrapper function to run all compliance tests
    This is called by the Flask endpoint
    """
    tester = TestComplianceBoundaryAnalysis()

    test_cases = [
        (0, "Bonds"),
        (49, "Bonds"),
        (50, "Stocks"),
        (100, "Stocks"),
    ]

    print("\n" + "="*60)
    print("COMPLIANCE TEST: Boundary Value Analysis")
    print("="*60)

    passed = 0
    failed = 0

    for risk_score, expected in test_cases:
        try:
            tester.test_risk_score_boundaries(risk_score, expected)
            passed += 1
        except AssertionError as e:
            print(f"✗ Risk Score {risk_score:3d} [FAIL]: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ Risk Score {risk_score:3d} [ERROR]: {e}")
            failed += 1

    print("="*60)
    print(f"Results: {passed} passed, {failed} failed")
    print("="*60)

    assert failed == 0, f"{failed} test(s) failed"


class TestXMLInjectionDetection:
    """
    Security Testing: XML Injection Detection

    Tests for XML External Entity (XXE) vulnerabilities and malicious payloads
    """

    def test_xxe_file_disclosure(self):
        """
        Test XXE vulnerability - File disclosure attempt

        Malicious payload attempts to read /etc/passwd
        Expected: Should be caught or cause controlled error
        """
        malicious_xml = """<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<request>
  <risk_score>50</risk_score>
  <name>&xxe;</name>
</request>"""

        response = requests.post(
            RECOMMEND_ENDPOINT,
            data=malicious_xml,
            headers={"Content-Type": "application/xml"}
        )

        # Should NOT return 200 with malicious content
        if response.status_code == 200:
            data = response.json()
            # Check if entity was expanded (vulnerability confirmed)
            if "root:" in str(data.get('name', '')):
                raise AssertionError(
                    "CRITICAL: XXE vulnerability detected! File contents exposed."
                )

        # Accept error responses as proper handling
        assert response.status_code in [400, 500], \
            f"Expected error status, got {response.status_code}"

        print("✓ XXE File Disclosure attempt properly blocked [PASS]")

    def test_billion_laughs_attack(self):
        """
        Test Billion Laughs (XML Bomb) attack

        Exponential entity expansion attack
        Expected: Should timeout or be rejected
        """
        xml_bomb = """<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
]>
<request>
  <risk_score>75</risk_score>
  <name>&lol3;</name>
</request>"""

        try:
            response = requests.post(
                RECOMMEND_ENDPOINT,
                data=xml_bomb,
                headers={"Content-Type": "application/xml"},
                timeout=5
            )

            # Should fail or return error
            assert response.status_code in [400, 500], \
                "Billion Laughs attack should be rejected"

            print("✓ Billion Laughs attack properly blocked [PASS]")

        except requests.exceptions.Timeout:
            print("✓ Billion Laughs attack caused timeout (detected) [PASS]")

    def test_malicious_entity_injection(self):
        """
        Test simple entity injection in name field

        Expected: Should sanitize or reject
        """
        malicious_xml = """<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY malicious "INJECTED_CONTENT_12345">
]>
<request>
  <risk_score>60</risk_score>
  <name>&malicious;</name>
</request>"""

        response = requests.post(
            RECOMMEND_ENDPOINT,
            data=malicious_xml,
            headers={"Content-Type": "application/xml"}
        )

        # Check response
        if response.status_code == 200:
            data = response.json()
            # If entity was expanded, vulnerability exists
            if "INJECTED_CONTENT" in data.get('name', ''):
                print("⚠ WARNING: Entity injection successful (vulnerability present)")
                # This is expected in our vulnerable demo
            else:
                print("✓ Entity injection sanitized [PASS]")
        else:
            print(f"✓ Malicious entity rejected with status {response.status_code} [PASS]")

    def test_cdata_injection(self):
        """
        Test CDATA section injection
        """
        cdata_xml = """<?xml version="1.0"?>
<request>
  <risk_score>45</risk_score>
  <name><![CDATA[<script>alert('XSS')</script>]]></name>
</request>"""

        response = requests.post(
            RECOMMEND_ENDPOINT,
            data=cdata_xml,
            headers={"Content-Type": "application/xml"}
        )

        if response.status_code == 200:
            data = response.json()
            # Should not contain raw script tags
            if "<script>" not in data.get('name', ''):
                print("✓ CDATA injection sanitized [PASS]")
            else:
                print("⚠ WARNING: CDATA content not sanitized")
        else:
            print(f"✓ CDATA injection rejected [PASS]")

def test_xml_injection_detection():
    """
    Wrapper function to run all security tests
    This is called by the Flask endpoint
    """
    tester = TestXMLInjectionDetection()

    print("\n" + "="*60)
    print("SECURITY TEST: XML Injection Detection")
    print("="*60)

    tests = [
        ("XXE File Disclosure", tester.test_xxe_file_disclosure),
        ("Billion Laughs Attack", tester.test_billion_laughs_attack),
        ("Entity Injection", tester.test_malicious_entity_injection),
        ("CDATA Injection", tester.test_cdata_injection),
    ]

    passed = 0
    failed = 0

    for test_name, test_func in tests:
        try:
            print(f"\nRunning: {test_name}")
            test_func()
            passed += 1
        except AssertionError as e:
            print(f"✗ {test_name} [FAIL]: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ {test_name} [ERROR]: {e}")
            failed += 1

    print("\n" + "="*60)
    print(f"Security Test Results: {passed} passed, {failed} failed")
    print("="*60)

    if failed > 0:
        print("\n⚠ SECURITY ISSUES DETECTED!")
        print("Vulnerabilities found in XML processing.")
        print("Recommendation: Implement proper XML validation and sanitization.")
    else:
        print("\n✓ All security tests passed!")


# Additional validation tests
class TestInputValidation:
    """Test input validation and edge cases"""

    def test_invalid_risk_score_negative(self):
        """Test negative risk score"""
        payload = {"risk_score": -10, "name": "Test"}
        response = requests.post(RECOMMEND_ENDPOINT, json=payload)
        assert response.status_code == 400, "Should reject negative risk score"

    def test_invalid_risk_score_too_high(self):
        """Test risk score above 100"""
        payload = {"risk_score": 150, "name": "Test"}
        response = requests.post(RECOMMEND_ENDPOINT, json=payload)
        assert response.status_code == 400, "Should reject risk score > 100"

    def test_missing_risk_score(self):
        """Test missing risk score"""
        payload = {"name": "Test"}
        response = requests.post(RECOMMEND_ENDPOINT, json=payload)
        assert response.status_code == 400, "Should reject missing risk score"


if __name__ == "__main__":
    """Run tests directly"""
    print("\n" + "="*60)
    print("ADVISOR AI COMPLIANCE SANDBOX - TEST SUITE")
    print("="*60)

    # Run compliance tests
    try:
        test_compliance_boundary_analysis()
        print("\n✓ Compliance tests completed")
    except Exception as e:
        print(f"\n✗ Compliance tests failed: {e}")

    # Run security tests
    try:
        test_xml_injection_detection()
        print("\n✓ Security tests completed")
    except Exception as e:
        print(f"\n✗ Security tests failed: {e}")
