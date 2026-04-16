#!/usr/bin/env python
from supabase import create_client

client = create_client(
    'https://kihtwajgkgjmjsnbfvgb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaHR3YWpna2dqbWpzbmJmdmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzUxMDUsImV4cCI6MjA5MDUxMTEwNX0.9kZfuXVMqllv7ADCzBlGPBBDiGZDgYeKDASddJm9HvE'
)

result = client.table('categories').select('*').execute()
print(f'Categories: {len(result.data)}')
if result.data:
    for cat in result.data[:5]:
        print(f"  - {cat.get('name_en')} ({cat.get('slug')})")
