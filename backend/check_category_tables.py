#!/usr/bin/env python
from supabase import create_client

client = create_client(
    'https://kihtwajgkgjmjsnbfvgb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaHR3YWpna2dqbWpzbmJmdmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzUxMDUsImV4cCI6MjA5MDUxMTEwNX0.9kZfuXVMqllv7ADCzBlGPBBDiGZDgYeKDASddJm9HvE'
)

# Check all tables
try:
    tables = ['categories', 'blog_categories', 'posts_categories', 'category']
    for table_name in tables:
        result = client.table(table_name).select('*').limit(5).execute()
        if result.data:
            print(f"✅ Table '{table_name}' has data: {len(result.data)} rows")
            print(f"   Columns: {list(result.data[0].keys())}")
        else:
            print(f"❌ Table '{table_name}' is empty or not found")
except Exception as e:
    print(f"Error: {e}")
