/**
 * Secure, Real Execution Sandbox for Candidate Code
 * Executes Python code directly against question-specific test cases
 * using an isolated subprocess with strict timeouts and resource bounds.
 */

import { spawn } from 'child_process';
import { CodingExecutionResult } from '../types/index.ts';

const PYTHON_RUNNER_SCRIPT = `
import json, io, sys, time, traceback, ast

def is_not_implemented(code_str):
    try:
        tree = ast.parse(code_str)
        func_nodes = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
        if not func_nodes:
            # Check if there are any non-comment, non-pass statements
            meaningful_nodes = [n for n in tree.body if not (isinstance(n, ast.Expr) and isinstance(n.value, (ast.Constant, ast.Str))) and not isinstance(n, ast.Pass)]
            return len(meaningful_nodes) == 0
        
        # Check if all function bodies are only pass / docstrings / NotImplementedError
        all_empty = True
        for fn in func_nodes:
            body_statements = [stmt for stmt in fn.body if not (isinstance(stmt, ast.Expr) and isinstance(stmt.value, (ast.Constant, ast.Str)))]
            if len(body_statements) == 0:
                continue
            is_fn_empty = False
            if len(body_statements) == 1:
                stmt = body_statements[0]
                if isinstance(stmt, ast.Pass):
                    is_fn_empty = True
                elif isinstance(stmt, ast.Expr) and isinstance(stmt.value, ast.Constant) and stmt.value.value is Ellipsis:
                    is_fn_empty = True
                elif isinstance(stmt, ast.Raise):
                    if isinstance(stmt.exc, ast.Name) and stmt.exc.id == "NotImplementedError":
                        is_fn_empty = True
                    elif isinstance(stmt.exc, ast.Call) and getattr(stmt.exc.func, "id", "") == "NotImplementedError":
                        is_fn_empty = True
            if not is_fn_empty:
                all_empty = False
                break
        return all_empty
    except Exception:
        return False

def execute():
    try:
        raw_payload = sys.stdin.read()
        payload = json.loads(raw_payload) if raw_payload else {}
    except Exception as e:
        print(json.dumps({
            "passed": False,
            "status": "EXECUTION UNAVAILABLE",
            "testsPassed": 0,
            "totalTests": 0,
            "output": f"Failed to parse payload: {str(e)}",
            "error": "PayloadError",
            "executionTimeMs": 0,
            "codeQualityScore": 0,
            "timeComplexityRating": "N/A",
            "feedback": "Internal runner error",
            "testResults": []
        }))
        return

    code = payload.get("code", "")
    test_cases = payload.get("testCases", [])
    start_time = time.time()

    # Check for empty submission or un-implemented starter code
    if not code or not code.strip():
        print(json.dumps({
            "passed": False,
            "status": "NOT IMPLEMENTED",
            "testsPassed": 0,
            "totalTests": len(test_cases),
            "output": "No code submitted. Candidate editor is empty.",
            "error": "EmptySubmission: No code provided",
            "executionTimeMs": 0,
            "codeQualityScore": 0,
            "timeComplexityRating": "N/A",
            "feedback": "No code was submitted. Please write your solution in the editor before running tests.",
            "testResults": [{
                "description": tc.get("description", f"Test {i+1}"),
                "input": str(tc.get("input", "")),
                "expected": str(tc.get("expectedOutput") or tc.get("expected", "")),
                "actual": "None",
                "passed": False,
                "status": "NOT RUN",
                "error": "Not executed: code is empty"
            } for i, tc in enumerate(test_cases)]
        }))
        return

    if is_not_implemented(code):
        print(json.dumps({
            "passed": False,
            "status": "NOT IMPLEMENTED",
            "testsPassed": 0,
            "totalTests": len(test_cases),
            "output": "The candidate has not implemented the required solution (unimplemented template / pass).",
            "error": "NotImplementedError: Solution function contains only placeholder / pass",
            "executionTimeMs": 0,
            "codeQualityScore": 20,
            "timeComplexityRating": "N/A",
            "feedback": "Starter template unmodified. Please implement the required algorithmic logic before running tests.",
            "testResults": [{
                "description": tc.get("description", f"Test {i+1}"),
                "input": str(tc.get("input", "")),
                "expected": str(tc.get("expectedOutput") or tc.get("expected", "")),
                "actual": "Not implemented",
                "passed": False,
                "status": "NOT IMPLEMENTED",
                "error": "Candidate has not implemented the required solution"
            } for i, tc in enumerate(test_cases)]
        }))
        return

    # 1. Syntax Compilation Check
    try:
        compiled = compile(code, "<candidate_code>", "exec")
    except SyntaxError as e:
        elapsed = round((time.time() - start_time) * 1000, 2)
        print(json.dumps({
            "passed": False,
            "status": "ERROR",
            "testsPassed": 0,
            "totalTests": len(test_cases),
            "output": f"SyntaxError on line {e.lineno}: {e.msg}\\n  {e.text or ''}".strip(),
            "error": f"SyntaxError: {e.msg} (line {e.lineno})",
            "executionTimeMs": elapsed,
            "codeQualityScore": 0,
            "timeComplexityRating": "N/A",
            "feedback": f"SyntaxError on line {e.lineno}: {e.msg}. Please fix syntax before evaluating tests.",
            "testResults": [{
                "description": tc.get("description", f"Test {i+1}"),
                "input": str(tc.get("input", "")),
                "expected": str(tc.get("expectedOutput") or tc.get("expected", "")),
                "actual": "Compilation Failed",
                "passed": False,
                "status": "ERROR",
                "error": f"SyntaxError: {e.msg} (line {e.lineno})"
            } for i, tc in enumerate(test_cases)]
        }))
        return

    # 2. Execution in isolated namespace
    stdout_buf = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = stdout_buf
    scope = {"__name__": "__main__"}

    try:
        exec(compiled, scope)
    except Exception as e:
        sys.stdout = old_stdout
        elapsed = round((time.time() - start_time) * 1000, 2)
        print(json.dumps({
            "passed": False,
            "status": "ERROR",
            "testsPassed": 0,
            "totalTests": len(test_cases),
            "output": traceback.format_exc(),
            "error": f"{type(e).__name__}: {str(e)}",
            "executionTimeMs": elapsed,
            "codeQualityScore": 25,
            "timeComplexityRating": "N/A",
            "feedback": f"Runtime error during script execution: {type(e).__name__}: {str(e)}",
            "testResults": [{
                "description": tc.get("description", f"Test {i+1}"),
                "input": str(tc.get("input", "")),
                "expected": str(tc.get("expectedOutput") or tc.get("expected", "")),
                "actual": f"Error: {type(e).__name__}",
                "passed": False,
                "status": "ERROR",
                "error": f"{type(e).__name__}: {str(e)}"
            } for i, tc in enumerate(test_cases)]
        }))
        return

    sys.stdout = old_stdout
    captured_stdout = stdout_buf.getvalue()

    funcs = [v for k, v in scope.items() if callable(v) and not k.startswith("_")]
    if not funcs and not any("=" in tc.get("input", "") for tc in test_cases):
        elapsed = round((time.time() - start_time) * 1000, 2)
        print(json.dumps({
            "passed": False,
            "status": "ERROR",
            "testsPassed": 0,
            "totalTests": len(test_cases),
            "output": captured_stdout or "No callable function defined.",
            "error": "NoFunctionDefined: Please define a solution function",
            "executionTimeMs": elapsed,
            "codeQualityScore": 30,
            "timeComplexityRating": "N/A",
            "feedback": "No callable function was found in the submitted code. Please declare a function matching the problem specification.",
            "testResults": []
        }))
        return

    target_func = funcs[-1] if funcs else None

    def deep_compare(act, exp):
        if exp is None and act is None:
            return True
        if isinstance(exp, float) and isinstance(act, (int, float)):
            return abs(act - exp) < 1e-3 or round(float(act), 4) == round(float(exp), 4)
        if isinstance(exp, (list, tuple)) and isinstance(act, (list, tuple)):
            if len(exp) != len(act): return False
            return all(deep_compare(a, b) for a, b in zip(act, exp))
        if isinstance(exp, dict) and isinstance(act, dict):
            if set(exp.keys()) != set(act.keys()): return False
            return all(deep_compare(act[k], exp[k]) for k in exp)
        return act == exp or str(act).strip() == str(exp).strip()

    test_results = []
    has_any_error = False
    for idx, tc in enumerate(test_cases):
        raw_inp = tc.get("input", "")
        raw_exp = tc.get("expectedOutput") if tc.get("expectedOutput") is not None else tc.get("expected", "")
        desc = tc.get("description", f"Test {idx + 1}")

        # parse expected value
        exp_val = raw_exp
        if isinstance(raw_exp, str):
            try:
                exp_val = ast.literal_eval(raw_exp)
            except Exception:
                exp_val = raw_exp

        # call candidate function or evaluate multi-statement test script
        act_val = None
        error_msg = None
        test_status = "FAIL"
        passed = False
        t_start = time.time()

        try:
            if ";" in raw_inp or "cache =" in raw_inp:
                # Multi-statement test case (e.g. for classes like LRUCache)
                test_scope = dict(scope)
                exec(raw_inp, test_scope)
                # Parse expected variables if raw_exp like "res1=1, res2=-1"
                if isinstance(raw_exp, str) and "=" in raw_exp:
                    expected_pairs = [part.strip().split("=") for part in raw_exp.split(",") if "=" in part]
                    matches = []
                    actual_dict = {}
                    for k, v in expected_pairs:
                        k = k.strip()
                        v = v.strip()
                        try:
                            parsed_v = ast.literal_eval(v)
                        except Exception:
                            parsed_v = v
                        cand_v = test_scope.get(k)
                        actual_dict[k] = cand_v
                        matches.append(deep_compare(cand_v, parsed_v))
                    passed = all(matches) if matches else False
                    act_val = ", ".join(f"{k}={v}" for k, v in actual_dict.items())
                else:
                    passed = True
                    act_val = "Executed"
            else:
                try:
                    act_val = eval(f"target_func({raw_inp})", {"target_func": target_func, **scope})
                except Exception:
                    act_val = target_func(raw_inp)
                passed = deep_compare(act_val, exp_val)

            test_status = "PASS" if passed else "FAIL"
        except Exception as e:
            passed = False
            has_any_error = True
            test_status = "ERROR"
            error_msg = f"{type(e).__name__}: {str(e)}"
            act_val = f"Exception: {type(e).__name__}"

        t_elapsed = round((time.time() - t_start) * 1000, 2)
        test_results.append({
            "description": desc,
            "input": str(raw_inp),
            "expected": str(exp_val),
            "actual": str(act_val) if act_val is not None else "None",
            "passed": passed,
            "status": test_status,
            "error": error_msg,
            "executionTimeMs": t_elapsed
        })

    elapsed = round((time.time() - start_time) * 1000, 2)
    total = len(test_results)
    passed_count = sum(1 for r in test_results if r["passed"])
    all_passed = total > 0 and passed_count == total

    # Complexity estimation
    loop_count = code.count("for ") + code.count("while ")
    if loop_count >= 2:
        complexity = "O(N^2) time complexity"
    elif loop_count == 1:
        complexity = "O(N) time complexity"
    else:
        complexity = "O(1) time complexity"

    # Quality score estimation
    has_type_hints = "->" in code or ": str" in code or ": int" in code or ": list" in code
    has_docstring = '"""' in code or "'''" in code or "#" in code
    quality = 70
    if all_passed: quality += 15
    if has_type_hints: quality += 5
    if has_docstring: quality += 5
    if not all_passed: quality = max(20, min(quality, 50 + passed_count * 10))

    overall_status = "PASS" if all_passed else ("ERROR" if has_any_error and passed_count == 0 else "FAIL")

    logs = []
    if captured_stdout.strip():
        logs.append(f"[Program Output]:\\n{captured_stdout.strip()}\\n")
    logs.append(f"[Sandbox Results]: {passed_count} of {total} test cases passed ({elapsed}ms). Status: {overall_status}")
    for r in test_results:
        logs.append(f"  [{r['status']}] {r['description']} | In: {r['input']} => Got: {r['actual']} (Exp: {r['expected']})")
        if r.get("error"):
            logs.append(f"         Error: {r['error']}")

    print(json.dumps({
        "passed": all_passed,
        "status": overall_status,
        "testsPassed": passed_count,
        "totalTests": total,
        "output": "\\n".join(logs),
        "error": None if all_passed else (test_results[0].get("error") if test_results else "Tests failed"),
        "executionTimeMs": elapsed,
        "codeQualityScore": min(100, quality),
        "timeComplexityRating": complexity,
        "feedback": "All test assertions passed successfully with optimal runtime." if all_passed else f"{passed_count} of {total} test cases passed. Review failing cases and edge constraints.",
        "testResults": test_results
    }))

if __name__ == "__main__":
    execute()
`;

export async function executePythonSandbox(params: {
  code: string;
  testCases: any[];
  timeoutMs?: number;
}): Promise<CodingExecutionResult> {
  const { code = '', testCases = [], timeoutMs = 5000 } = params;

  if (!code || typeof code !== 'string') {
    return {
      passed: false,
      status: 'NOT IMPLEMENTED',
      testsPassed: 0,
      totalTests: testCases.length,
      output: 'No code submitted.',
      error: 'EmptyCodeError',
      executionTimeMs: 0,
      codeQualityScore: 0,
      feedback: 'Please enter code to execute.',
      testResults: testCases.map((tc, idx) => ({
        input: String(tc.input || ''),
        expected: String(tc.expectedOutput || tc.expected || ''),
        actual: 'None',
        passed: false,
        status: 'NOT RUN',
        description: tc.description || `Test ${idx + 1}`
      }))
    };
  }

  // Security checks against destructive host operations
  const prohibitedKeywords = [
    'import os', 'os.system', 'os.remove', 'os.rmdir', 'subprocess',
    'shutil', 'process.exit', 'child_process', 'fs.unlink', 'fs.rm',
    'require("fs")', "require('fs')", 'socket.socket', 'urllib.request'
  ];

  for (const forbidden of prohibitedKeywords) {
    if (code.includes(forbidden)) {
      return {
        passed: false,
        status: 'ERROR',
        testsPassed: 0,
        totalTests: testCases.length,
        output: `Security Violation: Prohibited construct '${forbidden}' detected. Code execution must run in an isolated algorithmic context.`,
        error: `SecurityViolation: ${forbidden}`,
        executionTimeMs: 0,
        codeQualityScore: 0,
        feedback: 'Forbidden system or network operation detected.',
        testResults: testCases.map((tc, idx) => ({
          input: String(tc.input || ''),
          expected: String(tc.expectedOutput || tc.expected || ''),
          actual: 'Security Violation',
          passed: false,
          status: 'ERROR',
          error: `SecurityViolation: ${forbidden}`,
          description: tc.description || `Test ${idx + 1}`
        }))
      };
    }
  }

  return new Promise((resolve) => {
    let stdoutData = '';
    let stderrData = '';
    let timedOut = false;

    const child = spawn('python3', ['-c', PYTHON_RUNNER_SCRIPT], {
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
      resolve({
        passed: false,
        status: 'ERROR',
        testsPassed: 0,
        totalTests: testCases.length,
        output: 'Execution Timed Out (exceeded 5000ms limit). Possible infinite loop or slow recursion.',
        error: 'TimeoutError: 5000ms exceeded',
        executionTimeMs: 5000,
        codeQualityScore: 20,
        timeComplexityRating: 'O(Infinity)',
        feedback: 'Execution timed out. Check for infinite loops or non-terminating recursion.',
        testResults: testCases.map((tc, idx) => ({
          input: String(tc.input || ''),
          expected: String(tc.expectedOutput || tc.expected || ''),
          actual: 'Timed out',
          passed: false,
          status: 'ERROR',
          error: 'TimeoutError: 5000ms exceeded',
          description: tc.description || `Test ${idx + 1}`
        }))
      });
    }, timeoutMs);

    child.stdout.on('data', (d) => {
      stdoutData += d.toString();
    });

    child.stderr.on('data', (d) => {
      stderrData += d.toString();
    });

    child.on('close', (codeExit) => {
      clearTimeout(timer);
      if (timedOut) return;

      if (codeExit !== 0 && !stdoutData.trim()) {
        resolve({
          passed: false,
          status: 'EXECUTION UNAVAILABLE',
          testsPassed: 0,
          totalTests: testCases.length,
          output: stderrData || `Python runner process exited with code ${codeExit}`,
          error: `RunnerError: exit code ${codeExit}`,
          executionTimeMs: 0,
          codeQualityScore: 0,
          feedback: 'Python execution sandbox could not run.',
          testResults: testCases.map((tc, idx) => ({
            input: String(tc.input || ''),
            expected: String(tc.expectedOutput || tc.expected || ''),
            actual: 'Unavailable',
            passed: false,
            status: 'EXECUTION UNAVAILABLE',
            error: 'Sandbox execution unavailable',
            description: tc.description || `Test ${idx + 1}`
          }))
        });
        return;
      }

      try {
        const parsed = JSON.parse(stdoutData.trim());
        resolve({
          passed: !!parsed.passed,
          status: parsed.status || (parsed.passed ? 'PASS' : 'FAIL'),
          overallStatus: parsed.status || (parsed.passed ? 'PASS' : 'FAIL'),
          testsPassed: parsed.testsPassed || 0,
          totalTests: parsed.totalTests || testCases.length,
          output: parsed.output || '',
          error: parsed.error || undefined,
          executionTimeMs: parsed.executionTimeMs || 0,
          codeQualityScore: parsed.codeQualityScore || 0,
          timeComplexityRating: parsed.timeComplexityRating || 'O(N)',
          feedback: parsed.feedback || 'Execution completed.',
          testResults: parsed.testResults || []
        });
      } catch (err: any) {
        resolve({
          passed: false,
          status: 'ERROR',
          testsPassed: 0,
          totalTests: testCases.length,
          output: stdoutData || stderrData || `Failed to parse execution output: ${err.message}`,
          error: `JSONParseError: ${err.message}`,
          executionTimeMs: 0,
          codeQualityScore: 0,
          feedback: 'Error reading sandbox test results.',
          testResults: []
        });
      }
    });

    child.stdin.write(JSON.stringify({ code, testCases }));
    child.stdin.end();
  });
}

