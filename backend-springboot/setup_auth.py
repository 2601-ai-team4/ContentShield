import requests
import json
import os

BASE_URL = "http://localhost:8081/api/auth"

def get_token():
    email = "debug@test.com"
    password = "password123"
    username = "debug_user"

    # 1. Try Login
    try:
        print(f"Attempting login for {email}...")
        resp = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
        if resp.status_code == 200:
            token = resp.json().get("token")
            print("Login successful.")
            return token
    except Exception as e:
        print(f"Login failed: {e}")

    # 2. If login failed, try Signup then Login
    try:
        print(f"Attempting signup for {email}...")
        resp = requests.post(f"{BASE_URL}/signup", json={
            "email": email, "password": password, "username": username
        })
        if resp.status_code == 200:
            print("Signup successful. Logging in...")
            resp = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
            if resp.status_code == 200:
                token = resp.json().get("token")
                print("Login successful.")
                return token
        else:
            print(f"Signup failed: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"Signup failed: {e}")

    return None

if __name__ == "__main__":
    token = get_token()
    if token:
        with open("token.txt", "w") as f:
            f.write(token)
        print("Token saved to token.txt")
    else:
        print("Failed to get token.")
