import re

with open("frontend/src/utils/constants.ts", "r") as f:
    content = f.read()

content = content.replace(
    "export const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || '/api/v1'",
    "export const API_BASE_URL = ((import.meta as any).env.VITE_API_BASE_URL || '').replace(/\\/+$/, '')"
)

with open("frontend/src/utils/constants.ts", "w") as f:
    f.write(content)
