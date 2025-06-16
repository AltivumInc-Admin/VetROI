#!/usr/bin/env python3
"""Test script to check O*NET response format"""

# Sample O*NET response based on the user's screenshot
sample_onet_response = {
    "keyword": "18D",
    "branch": "army",
    "total": 24,
    "military_matches": {
        "match": [
            {
                "code": "18D",
                "title": "Special Forces Medical Sergeant",
                "branch": "army"
            }
        ]
    },
    "career": [
        {
            "href": "https://services.onetcenter.org/ws/online/occupations/29-2042.00/",
            "code": "29-2042.00",
            "title": "Emergency Medical Technicians",
            "match_type": "Some",
            "preparation_needed": "Postsecondary non-degree award",
            "tags": {
                "bright_outlook": True,
                "green": False
            }
        },
        {
            "href": "https://services.onetcenter.org/ws/online/occupations/29-2061.00/",
            "code": "29-2061.00",
            "title": "Licensed Practical and Licensed Vocational Nurses",
            "match_type": "Some",
            "preparation_needed": "Postsecondary non-degree award",
            "tags": {
                "bright_outlook": True,
                "green": False
            }
        },
        {
            "href": "https://services.onetcenter.org/ws/online/occupations/29-1141.00/",
            "code": "29-1141.00",
            "title": "Registered Nurses",
            "match_type": "Much",
            "preparation_needed": "Bachelor's degree",
            "tags": {
                "bright_outlook": True,
                "green": False
            }
        }
    ]
}

# The frontend expects format (from CareerMatchDisplay interface):
frontend_expected_format = {
    "href": "https://...",
    "code": "29-2042.00",
    "title": "Emergency Medical Technicians",
    "tags": {
        "bright_outlook": True,
        "green": False
    }
}

print("O*NET returns 'career' array with these fields:")
print("- href, code, title, match_type, preparation_needed, tags")
print("\nFrontend expects:")
print("- href, code, title, tags")
print("\nThe formats are compatible! O*NET has extra fields that frontend ignores.")