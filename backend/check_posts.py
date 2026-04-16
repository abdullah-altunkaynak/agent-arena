#!/usr/bin/env python
from supabase import create_client

client = create_client(
    'https://kihtwajgkgjmjsnbfvgb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaHR3YWpna2dqbWpzbmJmdmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzUxMDUsImV4cCI6MjA5MDUxMTEwNX0.9kZfuXVMqllv7ADCzBlGPBBDiGZDgYeKDASddJm9HvE'
)

result = client.table('posts').select('*').execute()
print(f'Total posts: {len(result.data)}')

for post in result.data:
    print(f"\nPost: {post.get('slug')}")
    for k, v in post.items():
        if v is None:
            print(f"  ⚠️  {k}: None")
