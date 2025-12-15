import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ChevronRight,
  LayoutDashboard,
  Lock,
  LogOut,
  Play,
  Shield,
  Terminal,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_BASE_URL || "http://localhost:5000";
console.log("Using API Base URL:", API_BASE_URL);
const App = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [isQALoggedIn, setIsQALoggedIn] = useState(false);
  const [qaCredentials, setQaCredentials] = useState({
    username: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");

  // Client View State
  const [riskScore, setRiskScore] = useState(50);
  const [userName, setUserName] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  // QA Dashboard State
  const [testOutput, setTestOutput] = useState("");
  const [testRunning, setTestRunning] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [qaDashboardTab, setQaDashboardTab] = useState("tests");
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);

  // Fetch metrics on QA dashboard load
  useEffect(() => {
    if (isQALoggedIn && activeTab === "qa") {
      fetchMetrics();
    }
  }, [isQALoggedIn, activeTab]);

  const handleQALogin = (e) => {
    e.preventDefault();
    // Simple hardcoded credentials for demo
    if (
      qaCredentials.username === "qa_admin" &&
      qaCredentials.password === "test123"
    ) {
      setIsQALoggedIn(true);
      setLoginError("");
      setActiveTab("qa");
    } else {
      setLoginError("Invalid credentials. Try: qa_admin / test123");
    }
  };

  const handleLogout = () => {
    setIsQALoggedIn(false);
    setQaCredentials({ username: "", password: "" });
    setActiveTab("client");
  };

  const getRecommendation = async () => {
    setLoading(true);
    setRecommendation(null);

    try {
      const response = await fetch(`${API_BASE_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          risk_score: parseInt(riskScore),
          name: userName || "Anonymous User",
        }),
      });

      const data = await response.json();
      setRecommendation(data);
    } catch (error) {
      console.error("Error fetching recommendation:", error);
      setRecommendation({
        error: `Failed to connect to server at ${API_BASE_URL}. Is the backend running?`,
      });
    } finally {
      setLoading(false);
    }
  };

  const runTests = async (testType) => {
    setTestRunning(true);
    setTestOutput(
      "Initializing test environment...\nRunning automated checks...\n"
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/run-tests?type=${encodeURIComponent(testType)}`
      );
      const data = await response.json();
      setTestOutput(data.output || data.error || "No output received");

      // Refresh metrics after test run
      setTimeout(() => fetchMetrics(), 1000);
    } catch (error) {
      setTestOutput(
        `Error: ${error.message}\n[SYSTEM ALERT]: Ensure backend service is active at ${API_BASE_URL}.`
      );
    } finally {
      setTestRunning(false);
    }
  };

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/metrics`);
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    setRecsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations`);
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setRecsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Fin<span className="text-indigo-400">Secure</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Enterprise Risk Systems
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isQALoggedIn && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2 animate-pulse"></span>
                  QA Environment Active
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {!isQALoggedIn ? (
          <div className="space-y-12">
            {/* Hero / Login Section */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Investment Engine */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      <h2 className="text-lg font-semibold text-slate-800">
                        Portfolio Analysis Engine
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      v2.4.0-stable
                    </span>
                  </div>

                  <div className="p-8">
                    <div className="grid md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Client Identifier
                          </label>
                          <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. John Doe"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <label className="block text-sm font-semibold text-slate-700">
                              Risk Tolerance Profile
                            </label>
                            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                              Score: {riskScore}/100
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={riskScore}
                            onChange={(e) => setRiskScore(e.target.value)}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium uppercase tracking-wide">
                            <span>Conservative</span>
                            <span>Aggressive</span>
                          </div>
                        </div>

                        <button
                          onClick={getRecommendation}
                          disabled={loading}
                          className="w-full bg-indigo-600 text-white py-3.5 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-all font-semibold shadow-lg shadow-indigo-100 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Run Analysis <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Result Card */}
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col justify-center">
                        {!recommendation ? (
                          <div className="text-center text-slate-400 space-y-3">
                            <BarChart3 className="w-12 h-12 mx-auto opacity-20" />
                            <p className="text-sm">
                              Enter parameters to generate a portfolio strategy.
                            </p>
                          </div>
                        ) : recommendation.error ? (
                          <div className="text-center space-y-3">
                            <XCircle className="w-12 h-12 mx-auto text-red-500" />
                            <h3 className="text-red-900 font-semibold">
                              System Error
                            </h3>
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                              {recommendation.error}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-2">
                              <TrendingUp className="w-8 h-8" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                                Recommended Strategy
                              </p>
                              <h3 className="text-3xl font-bold text-slate-900">
                                {recommendation.portfolio_type}
                              </h3>
                            </div>
                            <div className="inline-block bg-white px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">
                              Risk Coefficient: {recommendation.risk_score}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      icon: Shield,
                      title: "Compliance",
                      text: "Automated boundary analysis detects regulatory violations in real-time.",
                    },
                    {
                      icon: Lock,
                      title: "Security",
                      text: "Integrated XML injection protection and input sanitization protocols.",
                    },
                    {
                      icon: Users,
                      title: "Support",
                      text: "Dedicated QA support line for system integration testing.",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <item.icon className="w-6 h-6 text-slate-400 mb-3" />
                      <h3 className="font-semibold text-slate-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: QA Portal */}
              <div className="lg:col-span-4">
                <div className="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-32 bg-indigo-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                  <div className="p-8 relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                        <Lock className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h2 className="text-xl font-bold">QA Engineer Access</h2>
                    </div>

                    <form onSubmit={handleQALogin} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Username
                        </label>
                        <div className="relative">
                          <Users className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={qaCredentials.username}
                            onChange={(e) =>
                              setQaCredentials({
                                ...qaCredentials,
                                username: e.target.value,
                              })
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                            placeholder="Identify yourself"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                          <input
                            type="password"
                            value={qaCredentials.password}
                            onChange={(e) =>
                              setQaCredentials({
                                ...qaCredentials,
                                password: e.target.value,
                              })
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                            placeholder="Enter credentials"
                          />
                        </div>
                      </div>

                      {loginError && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          {loginError}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-900/50 mt-2"
                      >
                        Authenticate
                      </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800">
                      <p className="text-xs text-slate-500 mb-2 font-mono">
                        DEBUG_CREDENTIALS:
                      </p>
                      <div className="bg-slate-950 rounded p-3 text-xs font-mono text-indigo-300 space-y-1 border border-slate-800">
                        <p>User: qa_admin</p>
                        <p>Pass: test123</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* QA Dashboard View */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  System Diagnostics
                </h2>
                <p className="text-slate-500">
                  Real-time validation of compliance and security protocols.
                </p>
              </div>
              <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
                <button
                  onClick={() => setQaDashboardTab("tests")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    qaDashboardTab === "tests"
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Test Suite
                </button>
                <button
                  onClick={() => {
                    setQaDashboardTab("users");
                    fetchRecommendations();
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    qaDashboardTab === "users"
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  User Data
                </button>
              </div>
            </div>

            {qaDashboardTab === "tests" ? (
              <div className="grid lg:grid-cols-12 gap-8">
                {/* Left Col: Metrics & Controls */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Metrics Cards */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                      label="Tests Executed"
                      value={metrics?.total_tests || 0}
                      color="blue"
                      loading={metricsLoading}
                    />
                    <MetricCard
                      label="Passed"
                      value={metrics?.passed_tests || 0}
                      color="green"
                      loading={metricsLoading}
                    />
                    <MetricCard
                      label="Failed"
                      value={metrics?.failed_tests || 0}
                      color="red"
                      loading={metricsLoading}
                    />
                    <MetricCard
                      label="Total Recs"
                      value={metrics?.total_recommendations || 0}
                      color="purple"
                      loading={metricsLoading}
                    />
                  </div>

                  {/* Test Controls */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-slate-500" />
                      Test Execution Control
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => runTests("compliance")}
                        disabled={testRunning}
                        className="group relative overflow-hidden bg-white border-2 border-slate-100 hover:border-green-500 hover:bg-green-50/50 p-6 rounded-xl transition-all text-left disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-green-100 rounded-lg text-green-600 group-hover:bg-green-200 transition-colors">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          <Play className="w-5 h-5 text-slate-300 group-hover:text-green-600" />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">
                          Compliance Suite
                        </h4>
                        <p className="text-sm text-slate-500">
                          Run boundary value analysis and regulatory checks.
                        </p>
                      </button>

                      <button
                        onClick={() => runTests("security")}
                        disabled={testRunning}
                        className="group relative overflow-hidden bg-white border-2 border-slate-100 hover:border-red-500 hover:bg-red-50/50 p-6 rounded-xl transition-all text-left disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-red-100 rounded-lg text-red-600 group-hover:bg-red-200 transition-colors">
                            <Shield className="w-6 h-6" />
                          </div>
                          <Play className="w-5 h-5 text-slate-300 group-hover:text-red-600" />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">
                          Security Suite
                        </h4>
                        <p className="text-sm text-slate-500">
                          Execute injection attacks and penetration tests.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {metrics && metrics.recent_tests?.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800">
                          Recent Test Logs
                        </h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {metrics.recent_tests.map((test, idx) => (
                          <div
                            key={idx}
                            className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              {test.status === "passed" ? (
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                              ) : test.status === "failed" ? (
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                                  <XCircle className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0">
                                  <AlertTriangle className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-slate-900">
                                  {test.test_name}
                                </p>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">
                                  {test.test_type}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm text-slate-400 font-mono">
                              {new Date(test.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Col: Console Output */}
                <div className="lg:col-span-4">
                  <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden flex flex-col h-full min-h-[500px] border border-slate-800">
                    <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-mono text-slate-400">
                          test_runner.py
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                      </div>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto font-mono text-sm relative">
                      {testRunning && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 animate-pulse"></div>
                      )}
                      <pre className="text-green-400 whitespace-pre-wrap leading-relaxed">
                        {testOutput || (
                          <span className="text-slate-600">
                            // Waiting for test execution command...
                          </span>
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Users Table View */
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">
                    Recommendation History
                  </h3>
                  <button
                    onClick={fetchRecommendations}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium hover:underline"
                  >
                    Refresh Data
                  </button>
                </div>

                {recsLoading ? (
                  <div className="p-12 text-center">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500">Retrieving records...</p>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    No user data available.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Client Name
                          </th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Risk Profile
                          </th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Strategy
                          </th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recommendations.map((rec) => (
                          <tr
                            key={rec.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm font-mono text-slate-500">
                              #{rec.id}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                              {rec.name}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      rec.risk_score > 50
                                        ? "bg-indigo-500"
                                        : "bg-teal-500"
                                    }`}
                                    style={{ width: `${rec.risk_score}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium text-slate-600">
                                  {rec.risk_score}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  rec.portfolio_type === "Stocks"
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                    : "bg-teal-50 text-teal-700 border border-teal-100"
                                }`}
                              >
                                {rec.portfolio_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 text-right">
                              {new Date(rec.timestamp).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © 2025 FinSecure System. Developed by Prashant.
          </p>
          <div className="flex gap-6 text-sm text-slate-400">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>
              Compliance Status:{" "}
              <span className="text-green-600 font-semibold">Active</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper Component for Metrics
const MetricCard = ({ label, value, color, loading }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    red: "text-red-600 bg-red-50 border-red-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-sm font-medium text-slate-500 mb-2">{label}</p>
      {loading ? (
        <div className="h-8 w-24 bg-slate-100 animate-pulse rounded"></div>
      ) : (
        <p className={`text-3xl font-bold ${colors[color].split(" ")[0]}`}>
          {value}
        </p>
      )}
    </div>
  );
};

export default App;
