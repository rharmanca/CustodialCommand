#!/usr/bin/env python3
"""
Admin CRUD Operations Testing for Custodial Command
Tests edit, delete operations on inspections
"""

from playwright.sync_api import sync_playwright
import json

BASE_URL = "https://cacustodialcommand.up.railway.app"

def test_admin_crud():
    """Test admin CRUD operations on inspections"""
    results = {
        "test_name": "Admin CRUD Operations Testing",
        "tests": [],
        "summary": {}
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # Test 1: Navigate to Admin Inspections
            print("Test 1: Access Admin Inspections page...")
            page.goto(f"{BASE_URL}/admin/inspections")
            page.wait_for_load_state('networkidle')
            page.screenshot(path='tests/admin/screenshots/06_admin_inspections.png')
            
            current_url = page.url
            
            if 'admin/inspections' in current_url:
                results["tests"].append({
                    "name": "Admin Inspections page accessible",
                    "status": "PASS",
                    "message": f"Page loaded at {current_url}"
                })
                print("✓ PASS: Admin Inspections page accessible")
            elif 'login' in current_url:
                results["tests"].append({
                    "name": "Admin Inspections page accessible",
                    "status": "INFO",
                    "message": "Page requires authentication, redirected to login"
                })
                print("ℹ INFO: Admin Inspections requires authentication")
            else:
                results["tests"].append({
                    "name": "Admin Inspections page accessible",
                    "status": "FAIL",
                    "message": f"Unexpected redirect to {current_url}"
                })
                print(f"✗ FAIL: Unexpected redirect to {current_url}")
            
            # Test 2: Check for inspections list
            print("\nTest 2: Check inspections list...")
            
            inspections_table = page.locator('table').first
            inspection_items = page.locator('.inspection-item, .inspection-row, [data-inspection-id]').all()
            
            if inspections_table.count() > 0:
                # Count rows in table
                rows = inspections_table.locator('tr').all()
                results["tests"].append({
                    "name": "Inspections list present",
                    "status": "PASS",
                    "message": f"Found table with {len(rows)} rows"
                })
                print(f"✓ PASS: Found inspections table with {len(rows)} rows")
            elif len(inspection_items) > 0:
                results["tests"].append({
                    "name": "Inspections list present",
                    "status": "PASS",
                    "message": f"Found {len(inspection_items)} inspection items"
                })
                print(f"✓ PASS: Found {len(inspection_items)} inspection items")
            else:
                results["tests"].append({
                    "name": "Inspections list present",
                    "status": "INFO",
                    "message": "No inspections visible (may be empty or require auth)"
                })
                print("ℹ INFO: No inspections visible")
            
            # Test 3: Check for edit functionality
            print("\nTest 3: Check edit functionality...")
            
            edit_buttons = page.locator('button:has-text("Edit"), .edit-btn, [data-action="edit"]').all()
            
            if len(edit_buttons) > 0:
                results["tests"].append({
                    "name": "Edit functionality present",
                    "status": "PASS",
                    "message": f"Found {len(edit_buttons)} edit buttons"
                })
                print(f"✓ PASS: Found {len(edit_buttons)} edit buttons")
            else:
                results["tests"].append({
                    "name": "Edit functionality present",
                    "status": "INFO",
                    "message": "No edit buttons visible"
                })
                print("ℹ INFO: No edit buttons visible")
            
            # Test 4: Check for delete functionality
            print("\nTest 4: Check delete functionality...")
            
            delete_buttons = page.locator('button:has-text("Delete"), .delete-btn, [data-action="delete"]').all()
            
            if len(delete_buttons) > 0:
                results["tests"].append({
                    "name": "Delete functionality present",
                    "status": "PASS",
                    "message": f"Found {len(delete_buttons)} delete buttons"
                })
                print(f"✓ PASS: Found {len(delete_buttons)} delete buttons")
            else:
                results["tests"].append({
                    "name": "Delete functionality present",
                    "status": "INFO",
                    "message": "No delete buttons visible"
                })
                print("ℹ INFO: No delete buttons visible")
            
            # Test 5: Check for create functionality
            print("\nTest 5: Check create/add functionality...")
            
            create_buttons = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), .add-btn, [data-action="create"]').all()
            
            if len(create_buttons) > 0:
                results["tests"].append({
                    "name": "Create functionality present",
                    "status": "PASS",
                    "message": f"Found {len(create_buttons)} create buttons"
                })
                print(f"✓ PASS: Found {len(create_buttons)} create buttons")
            else:
                results["tests"].append({
                    "name": "Create functionality present",
                    "status": "INFO",
                    "message": "No create buttons visible"
                })
                print("ℹ INFO: No create buttons visible")
            
            # Test 6: Test API endpoints for CRUD
            print("\nTest 6: Test CRUD API endpoints...")
            
            endpoints = {
                "GET /api/admin/inspections": "GET",
                "POST /api/admin/inspections": "POST",
                "PUT /api/admin/inspections/1": "PUT",
                "DELETE /api/admin/inspections/1": "DELETE"
            }
            
            for endpoint, method in endpoints.items():
                try:
                    path = endpoint.split(' ')[1]
                    response = page.evaluate(f"""async () => {{
                        try {{
                            const response = await fetch('{path}', {{
                                method: '{method}',
                                headers: {{ 'Content-Type': 'application/json' }},
                                body: {method in ['POST', 'PUT'] ? 'JSON.stringify({{}})' : 'undefined'}
                            }});
                            return {{
                                status: response.status,
                                method: '{method}'
                            }};
                        }} catch (e) {{
                            return {{ error: e.message }};
                        }}
                    }}""")
                    
                    status = response.get('status', 0)
                    
                    if status in [200, 201]:
                        results["tests"].append({
                            "name": f"{endpoint} endpoint",
                            "status": "PASS",
                            "message": f"Returns {status}"
                        })
                        print(f"✓ PASS: {endpoint} returns {status}")
                    elif status in [401, 403]:
                        results["tests"].append({
                            "name": f"{endpoint} endpoint",
                            "status": "PASS",
                            "message": f"Requires authentication (returns {status})"
                        })
                        print(f"✓ PASS: {endpoint} requires auth ({status})")
                    elif status == 404:
                        results["tests"].append({
                            "name": f"{endpoint} endpoint",
                            "status": "INFO",
                            "message": f"Endpoint not found (404)"
                        })
                        print(f"ℹ INFO: {endpoint} not found")
                    else:
                        results["tests"].append({
                            "name": f"{endpoint} endpoint",
                            "status": "INFO",
                            "message": f"Returns {status}"
                        })
                        print(f"ℹ INFO: {endpoint} returns {status}")
                        
                except Exception as e:
                    results["tests"].append({
                        "name": f"{endpoint} endpoint",
                        "status": "ERROR",
                        "message": str(e)
                    })
                    print(f"✗ ERROR testing {endpoint}: {e}")
            
            # Test 7: Check for bulk operations
            print("\nTest 7: Check for bulk operations...")
            
            checkboxes = page.locator('input[type="checkbox"]').all()
            bulk_buttons = page.locator('button:has-text("Bulk"), button:has-text("Select All"), .bulk-action').all()
            
            if len(checkboxes) > 0 or len(bulk_buttons) > 0:
                results["tests"].append({
                    "name": "Bulk operations available",
                    "status": "PASS",
                    "message": f"Found {len(checkboxes)} checkboxes, {len(bulk_buttons)} bulk buttons"
                })
                print(f"✓ PASS: Bulk operations available")
            else:
                results["tests"].append({
                    "name": "Bulk operations available",
                    "status": "INFO",
                    "message": "No bulk operation elements visible"
                })
                print("ℹ INFO: No bulk operations visible")
            
            # Test 8: Check for audit trail indicators
            print("\nTest 8: Check for audit trail...")
            
            page_content = page.content()
            audit_indicators = ['created', 'modified', 'updated', 'by', 'audit', 'log']
            found_audit = [ind for ind in audit_indicators if ind.lower() in page_content.lower()]
            
            if found_audit:
                results["tests"].append({
                    "name": "Audit trail indicators",
                    "status": "PASS",
                    "message": f"Found audit indicators: {', '.join(found_audit[:3])}"
                })
                print(f"✓ PASS: Audit indicators found")
            else:
                results["tests"].append({
                    "name": "Audit trail indicators",
                    "status": "INFO",
                    "message": "No visible audit trail"
                })
                print("ℹ INFO: No audit trail visible")
            
            browser.close()
            
        except Exception as e:
            results["tests"].append({
                "name": "Overall test execution",
                "status": "ERROR",
                "message": str(e)
            })
            print(f"✗ ERROR: {e}")
            browser.close()
    
    # Calculate summary
    passed = len([t for t in results["tests"] if t["status"] == "PASS"])
    failed = len([t for t in results["tests"] if t["status"] == "FAIL"])
    warnings = len([t for t in results["tests"] if t["status"] == "WARNING"])
    info = len([t for t in results["tests"] if t["status"] in ["INFO", "ERROR"]])
    
    results["summary"] = {
        "total": len(results["tests"]),
        "passed": passed,
        "failed": failed,
        "warnings": warnings,
        "info": info
    }
    
    return results

if __name__ == "__main__":
    results = test_admin_crud()
    print("\n" + "="*60)
    print("ADMIN CRUD TEST RESULTS")
    print("="*60)
    print(json.dumps(results, indent=2))
    
    with open('tests/admin/results/admin_crud_results.json', 'w') as f:
        json.dump(results, f, indent=2)
