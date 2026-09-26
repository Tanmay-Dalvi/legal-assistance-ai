import glob
import os

files = glob.glob("frontend/src/services/*.ts")
for path in files:
    with open(path, "r") as f:
        content = f.read()
    
    content = content.replace("`${API_BASE_URL}/", "`${API_BASE_URL}/api/v1/")
    
    with open(path, "w") as f:
        f.write(content)
