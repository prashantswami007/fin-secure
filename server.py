from flask import Flask, request, jsonify
from flask_cors import CORS
import xml.etree.ElementTree as ET
import subprocess
import sys
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import json

app = Flask(__name__)
if os.getenv('RENDER'):
    # In production, allow specific origins
    CORS(app, origins=[
        "https://fin-secure.onrender.com",  # Update with your frontend URL
        "http://localhost:5173"  # Keep for local development
    ])
else:
    # In development, allow all origins
    CORS(app)

# Database Configuration - Replace with your NeonDB credentials
DATABASE_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def init_database():
    """Initialize database tables"""
    conn = get_db_connection()
    if not conn:
        print("Warning: Could not connect to database")
        return

    cursor = conn.cursor()

    # Create recommendations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recommendations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            risk_score INTEGER,
            portfolio_type VARCHAR(50),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create test_results table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_results (
            id SERIAL PRIMARY KEY,
            test_name VARCHAR(255),
            test_type VARCHAR(50),
            status VARCHAR(50),
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    cursor.close()
    conn.close()
    print("Database initialized successfully")

# Initialize database on startup
init_database()

def parse_xml_vulnerable(xml_string):
    """
    INTENTIONALLY VULNERABLE XML PARSER
    This demonstrates XML injection vulnerability for testing purposes
    In production, NEVER use this approach!
    """
    try:
        # Parse XML without safety restrictions (VULNERABLE!)
        root = ET.fromstring(xml_string)

        risk_score = int(root.find('risk_score').text)
        name = root.find('name').text

        return {'risk_score': risk_score, 'name': name}
    except Exception as e:
        raise ValueError(f"XML parsing error: {str(e)}")

def get_portfolio_recommendation(risk_score):
    """Business logic for portfolio recommendation"""
    if risk_score < 50:
        return "Bonds"
    else:
        return "Stocks"

def save_recommendation(name, risk_score, portfolio_type):
    """Save recommendation to database"""
    conn = get_db_connection()
    if not conn:
        return

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO recommendations (name, risk_score, portfolio_type)
            VALUES (%s, %s, %s)
        """, (name, risk_score, portfolio_type))
        conn.commit()
        cursor.close()
    except Exception as e:
        print(f"Error saving recommendation: {e}")
    finally:
        conn.close()

def save_test_result(test_name, test_type, status, details=""):
    """Save test result to database"""
    conn = get_db_connection()
    if not conn:
        return

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO test_results (test_name, test_type, status, details)
            VALUES (%s, %s, %s, %s)
        """, (test_name, test_type, status, details))
        conn.commit()
        cursor.close()
    except Exception as e:
        print(f"Error saving test result: {e}")
    finally:
        conn.close()

@app.route('/recommend', methods=['POST'])
def recommend():
    """
    Main recommendation endpoint
    Accepts JSON or XML input
    Returns portfolio recommendation based on risk score
    """
    try:
        content_type = request.headers.get('Content-Type', '')

        if 'application/xml' in content_type or 'text/xml' in content_type:
            # Handle XML input (vulnerable to injection)
            xml_data = request.data.decode('utf-8')
            data = parse_xml_vulnerable(xml_data)
        else:
            # Handle JSON input
            data = request.get_json()

        risk_score = data.get('risk_score')
        name = data.get('name', 'Anonymous')

        if risk_score is None:
            return jsonify({'error': 'risk_score is required'}), 400

        risk_score = int(risk_score)

        # Validate risk score range
        if not 0 <= risk_score <= 100:
            return jsonify({'error': 'risk_score must be between 0 and 100'}), 400

        # Get recommendation
        portfolio_type = get_portfolio_recommendation(risk_score)

        # Save to database
        save_recommendation(name, risk_score, portfolio_type)

        return jsonify({
            'name': name,
            'risk_score': risk_score,
            'portfolio_type': portfolio_type,
            'timestamp': datetime.now().isoformat()
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/run-tests', methods=['GET'])
def run_tests():
      if os.getenv("RENDER"):
        return jsonify({
            "error": "Test execution disabled in production",
            "message": "Use CI/CD or local environment to run tests"
        }), 403
    """
    Execute pytest tests and return results
    Query param: type=compliance or type=security
    """
    test_type = request.args.get('type', 'compliance')

    try:
        # Determine which test to run
        if test_type == 'compliance':
            test_file = 'tests/security-tests.py::test_compliance_boundary_analysis'
        elif test_type == 'security':
            test_file = 'tests/security-tests.py::test_xml_injection_detection'
        else:
            return jsonify({'error': 'Invalid test type'}), 400

        # Run pytest with verbose output and color
        result = subprocess.run(
            [sys.executable, '-m', 'pytest', test_file, '-v', '--color=yes', '--tb=short'],
            capture_output=True,
            text=True,
            timeout=30
        )

        # Combine stdout and stderr
        output = result.stdout + "\n" + result.stderr

        # Parse test results to save to database
        if "PASSED" in output:
            save_test_result(
                test_name=f"{test_type}_test",
                test_type=test_type,
                status='passed',
                details=output[:500]
            )
        elif "FAILED" in output:
            save_test_result(
                test_name=f"{test_type}_test",
                test_type=test_type,
                status='failed',
                details=output[:500]
            )

        return jsonify({
            'output': output,
            'return_code': result.returncode,
            'test_type': test_type
        })

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Test execution timeout'}), 500
    except Exception as e:
        return jsonify({'error': f'Error running tests: {str(e)}'}), 500

@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    """
    Get all recommendations from database
    Supports pagination and filtering
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        # Get query parameters
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        portfolio_type = request.args.get('portfolio_type', None)

        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Build query with optional filter
        query = """
            SELECT id, name, risk_score, portfolio_type, timestamp
            FROM recommendations
        """
        params = []

        if portfolio_type:
            query += " WHERE portfolio_type = %s"
            params.append(portfolio_type)

        query += " ORDER BY timestamp DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, params)
        recommendations = cursor.fetchall()

        # Get total count
        count_query = "SELECT COUNT(*) as total FROM recommendations"
        if portfolio_type:
            count_query += " WHERE portfolio_type = %s"
            cursor.execute(count_query, [portfolio_type])
        else:
            cursor.execute(count_query)

        total = cursor.fetchone()['total']

        cursor.close()
        conn.close()

        return jsonify({
            'recommendations': [dict(row) for row in recommendations],
            'total': total,
            'limit': limit,
            'offset': offset
        })

    except Exception as e:
        print(f"Error fetching recommendations: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """
    Get testing and recommendation metrics from database
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get test statistics
        cursor.execute("""
            SELECT
                COUNT(*) as total_tests,
                SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_tests,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tests
            FROM test_results
        """)
        test_stats = cursor.fetchone()

        # Get recommendation count
        cursor.execute("SELECT COUNT(*) as total FROM recommendations")
        rec_count = cursor.fetchone()

        # Get recent test results
        cursor.execute("""
            SELECT test_name, test_type, status, timestamp
            FROM test_results
            ORDER BY timestamp DESC
            LIMIT 10
        """)
        recent_tests = cursor.fetchall()

        # Get portfolio distribution
        cursor.execute("""
            SELECT
                portfolio_type,
                COUNT(*) as count,
                AVG(risk_score) as avg_risk_score
            FROM recommendations
            GROUP BY portfolio_type
        """)
        portfolio_dist = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            'total_tests': test_stats['total_tests'] or 0,
            'passed_tests': test_stats['passed_tests'] or 0,
            'failed_tests': test_stats['failed_tests'] or 0,
            'total_recommendations': rec_count['total'] or 0,
            'recent_tests': [dict(row) for row in recent_tests],
            'portfolio_distribution': [dict(row) for row in portfolio_dist]
        })

    except Exception as e:
        print(f"Error fetching metrics: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    conn = get_db_connection()
    db_status = "connected" if conn else "disconnected"
    if conn:
        conn.close()

    return jsonify({
        'status': 'healthy',
        'database': db_status,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("=" * 60)
    print("Robo-Advisor - Flask Backend")
    print("=" * 60)
    print("Server starting on http://localhost:5000")
    print("Endpoints:")
    print("  POST /recommend - Get investment recommendation")
    print("  GET  /run-tests?type=compliance|security - Run tests")
    print("  GET  /metrics - Get testing metrics")
    print("  GET  /recommendations - Get all user recommendations")
    print("  GET  /health - Health check")
    print("=" * 60)
    port = int(os.environ.get('PORT', 5000))
    debug = not os.getenv('RENDER')  # Disable debug in production
    app.run(host='0.0.0.0', port=port, debug=debug)
