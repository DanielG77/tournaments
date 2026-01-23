import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://localhost:8000/auth"

# Generate random email
email = f"test_{int(time.time())}@example.com"
password = "password123"
user_data = {
    "email": email,
    "password": password,
    "role": "player",
    "nickname": "TestPlayer"
}

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    headers["Content-Type"] = "application/json"
    
    if data:
        json_data = json.dumps(data).encode("utf-8")
    else:
        json_data = None
        
    req = urllib.request.Request(url, data=json_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as e:
        print(f"Request error: {e}")
        return 0, None

def run_test():
    print(f"Testing Auth Flow for {email}...")

    # 1. Register
    print("\n1. Registering...")
    status, body = make_request(f"{BASE_URL}/register", "POST", user_data)
    if status == 201:
        print("✅ Registered successfully")
    else:
        print(f"❌ Register failed: {status} {body}")
        return

    # 2. Login
    print("\n2. Logging in...")
    status, body = make_request(f"{BASE_URL}/login", "POST", {"email": email, "password": password})
    if status == 200:
        access_token = body["access_token"]
        refresh_token = body["refresh_token"]
        print("✅ Login successful")
        print(f"   Access Token: {access_token[:20]}...")
        print(f"   Refresh Token: {refresh_token[:20]}...")
    else:
        print(f"❌ Login failed: {status} {body}")
        return

    # 3. Access Protected Route (/me)
    print("\n3. Testing Protected Route (/me)...")
    status, body = make_request(f"{BASE_URL}/me", "GET", headers={"Authorization": f"Bearer {access_token}"})
    if status == 200:
        print(f"✅ /me success: {body.get('email')}")
    else:
        print(f"❌ /me failed: {status} {body}")

    # 4. Refresh Token
    print("\n4. Refreshing Token...")
    status, body = make_request(f"{BASE_URL}/refresh", "POST", {"refresh_token": refresh_token})
    if status == 200:
        new_access_token = body["access_token"]
        new_refresh_token = body["refresh_token"]
        print("✅ Refresh successful")
        print(f"   New Access Token: {new_access_token[:20]}...")
    else:
        print(f"❌ Refresh failed: {status} {body}")
        return

    # 5. Logout
    print("\n5. Logging out...")
    status, body = make_request(f"{BASE_URL}/logout", "POST", {"refresh_token": new_refresh_token})
    if status == 200:
        print("✅ Logout successful")
    else:
        print(f"❌ Logout failed: {status} {body}")

    # 6. Try Refresh with Revoked Token (Expect 401)
    print("\n6. Trying Refresh with Revoked Token (Expect 401)...")
    status, body = make_request(f"{BASE_URL}/refresh", "POST", {"refresh_token": new_refresh_token})
    if status == 401:
        print("✅ Refresh correctly rejected (401)")
    else:
        print(f"❌ Refresh should fail but got: {status} {body}")

    # 7. Logout All Test
    print("\n--- Testing Logout All ---")
    
    # Login 1
    s1, b1 = make_request(f"{BASE_URL}/login", "POST", {"email": email, "password": password})
    # Login 2
    s2, b2 = make_request(f"{BASE_URL}/login", "POST", {"email": email, "password": password})
    
    if s1 != 200 or s2 != 200:
        print("❌ Setup for Logout All failed")
        return
        
    print("Logged in twice. Calling logout-all with first refresh token...")
    # NOTE: logout-all typically requires auth header OR refresh token. My impl accepts refresh token in body OR auth header.
    # The requirement said "POST /api/auth/logout-all".
    # My impl extracts user_id from the provided token (refresh or access).
    
    status, body = make_request(f"{BASE_URL}/logout-all", "POST", {"refresh_token": b1["refresh_token"]})
    
    if status == 200:
        print("✅ Logout All successful")
    else:
        print(f"❌ Logout All failed: {status} {body}")
        
    print("Verifying both refresh tokens are revoked...")
    rs1, rb1 = make_request(f"{BASE_URL}/refresh", "POST", {"refresh_token": b1["refresh_token"]})
    rs2, rb2 = make_request(f"{BASE_URL}/refresh", "POST", {"refresh_token": b2["refresh_token"]})
    
    if rs1 == 401 and rs2 == 401:
        print("✅ Both tokens revoked successfully")
    else:
        print(f"❌ Tokens not fully revoked: Token1={rs1}, Token2={rs2}")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"Test failed in Setup/Connection: {e}")
        print("Ensure the backend server is running on localhost:8000")
